import type { AgentUsage } from "../app/agent/types";
import { catalogPool } from "./catalog-db";

export type AiUsageStatus =
  | "success"
  | "rate_limited"
  | "budget_exceeded"
  | "configuration_error"
  | "provider_error"
  | "internal_error";

export type AiUsageService = {
  id: string;
  title: string;
  category: string;
};

export type AiUsageEvent = {
  requestId: string;
  provider: "deepseek" | "openai";
  model: string;
  status: AiUsageStatus;
  usage: AgentUsage;
  estimatedCostBrl: number;
  providerCalls: number;
  toolCalls: number;
  services: AiUsageService[];
  personalDataRemoved: boolean;
  durationMs: number;
};

export type AiUsageTotals = {
  requests: number;
  successfulRequests: number;
  blockedRequests: number;
  failedRequests: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
};

export type AiUsagePeriodInput =
  | { mode: "days"; days: number }
  | { mode: "all" }
  | { mode: "custom"; startDate: string; endDate: string };

export type AiUsageDashboard = {
  period: {
    mode: AiUsagePeriodInput["mode"];
    startDate: string;
    endDate: string;
    dayCount: number;
    comparisonAvailable: boolean;
  };
  generatedAt: string;
  totals: AiUsageTotals;
  previousTotals: AiUsageTotals;
  daily: Array<{
    day: string;
    requests: number;
    successfulRequests: number;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
  }>;
  topServices: Array<{
    id: string;
    title: string;
    category: string;
    requests: number;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  recent: Array<{
    requestId: string;
    occurredAt: string;
    provider: string;
    model: string;
    status: AiUsageStatus;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    providerCalls: number;
    toolCalls: number;
    services: AiUsageService[];
    personalDataRemoved: boolean;
    durationMs: number;
  }>;
};

let initialization: Promise<void> | undefined;

async function createAiUsageTable() {
  await catalogPool().query(`
    CREATE TABLE IF NOT EXISTS ai_usage_events (
      id BIGSERIAL PRIMARY KEY,
      request_id UUID NOT NULL UNIQUE,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      input_tokens BIGINT NOT NULL DEFAULT 0,
      cached_input_tokens BIGINT NOT NULL DEFAULT 0,
      output_tokens BIGINT NOT NULL DEFAULT 0,
      estimated_cost_brl NUMERIC(18, 8) NOT NULL DEFAULT 0,
      provider_calls INTEGER NOT NULL DEFAULT 0,
      tool_calls INTEGER NOT NULL DEFAULT 0,
      services JSONB NOT NULL DEFAULT '[]'::jsonb,
      personal_data_removed BOOLEAN NOT NULL DEFAULT false,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT ai_usage_events_status_check CHECK (status IN (
        'success', 'rate_limited', 'budget_exceeded', 'configuration_error',
        'provider_error', 'internal_error'
      )),
      CONSTRAINT ai_usage_events_services_array_check CHECK (jsonb_typeof(services) = 'array')
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_events_occurred_at
      ON ai_usage_events(occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_events_status_occurred_at
      ON ai_usage_events(status, occurred_at DESC);
  `);
}

export function initializeAiUsageDatabase() {
  initialization ??= createAiUsageTable().catch((error) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export async function recordAiUsageEvent(event: AiUsageEvent) {
  await initializeAiUsageDatabase();
  await catalogPool().query(
    `INSERT INTO ai_usage_events (
      request_id, provider, model, status, input_tokens, cached_input_tokens,
      output_tokens, estimated_cost_brl, provider_calls, tool_calls, services,
      personal_data_removed, duration_ms
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
    ON CONFLICT (request_id) DO NOTHING`,
    [
      event.requestId,
      event.provider,
      event.model,
      event.status,
      event.usage.inputTokens,
      event.usage.cachedInputTokens,
      event.usage.outputTokens,
      event.estimatedCostBrl,
      event.providerCalls,
      event.toolCalls,
      JSON.stringify(event.services),
      event.personalDataRemoved,
      Math.max(0, Math.round(event.durationMs)),
    ],
  );
}

export async function currentMonthAiCost() {
  await initializeAiUsageDatabase();
  const result = await catalogPool().query<{ cost: string }>(`
    SELECT COALESCE(SUM(estimated_cost_brl), 0)::text AS cost
    FROM ai_usage_events
    WHERE status = 'success'
      AND occurred_at >= (
        date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
        AT TIME ZONE 'America/Sao_Paulo'
      )
  `);
  return Number(result.rows[0]?.cost) || 0;
}

type TotalRow = {
  requests: number;
  successful_requests: number;
  blocked_requests: number;
  failed_requests: number;
  input_tokens: string;
  cached_input_tokens: string;
  output_tokens: string;
};

type DailyRow = {
  day: string;
  requests: number;
  successful_requests: number;
  input_tokens: string;
  cached_input_tokens: string;
  output_tokens: string;
};

type RecentRow = {
  request_id: string;
  occurred_at: Date;
  provider: string;
  model: string;
  status: AiUsageStatus;
  input_tokens: string;
  cached_input_tokens: string;
  output_tokens: string;
  provider_calls: number;
  tool_calls: number;
  services: AiUsageService[];
  personal_data_removed: boolean;
  duration_ms: number;
};

const rangeSql = `occurred_at >= ($1::date AT TIME ZONE 'America/Sao_Paulo')
  AND occurred_at < (($2::date + 1) AT TIME ZONE 'America/Sao_Paulo')`;

function saoPauloToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

function mapTotals(row?: TotalRow): AiUsageTotals {
  return {
    requests: Number(row?.requests) || 0,
    successfulRequests: Number(row?.successful_requests) || 0,
    blockedRequests: Number(row?.blocked_requests) || 0,
    failedRequests: Number(row?.failed_requests) || 0,
    inputTokens: Number(row?.input_tokens) || 0,
    cachedInputTokens: Number(row?.cached_input_tokens) || 0,
    outputTokens: Number(row?.output_tokens) || 0,
  };
}

export async function getAiUsageDashboard(period: AiUsagePeriodInput, requestedPage = 1): Promise<AiUsageDashboard> {
  await initializeAiUsageDatabase();
  const db = catalogPool();
  const today = saoPauloToday();
  let startDate: string;
  let endDate = today;

  if (period.mode === "all") {
    const firstEvent = await db.query<{ start_date: string }>(`
      SELECT COALESCE(
        to_char(MIN((occurred_at AT TIME ZONE 'America/Sao_Paulo')::date), 'YYYY-MM-DD'),
        $1::text
      ) AS start_date
      FROM ai_usage_events
    `, [today]);
    startDate = firstEvent.rows[0]?.start_date || today;
  } else if (period.mode === "custom") {
    startDate = period.startDate;
    endDate = period.endDate;
  } else {
    const safeDays = Math.max(1, Math.min(365, Math.round(period.days)));
    startDate = shiftDate(today, -(safeDays - 1));
  }

  const dayCount = inclusiveDays(startDate, endDate);
  const previousStartDate = shiftDate(startDate, -dayCount);
  const previousEndDate = shiftDate(startDate, -1);

  const totalsResult = await db.query<TotalRow>(`
    SELECT
      COUNT(*)::int AS requests,
      COUNT(*) FILTER (WHERE status = 'success')::int AS successful_requests,
      COUNT(*) FILTER (WHERE status IN ('rate_limited', 'budget_exceeded'))::int AS blocked_requests,
      COUNT(*) FILTER (WHERE status IN ('configuration_error', 'provider_error', 'internal_error'))::int AS failed_requests,
      COALESCE(SUM(input_tokens), 0)::text AS input_tokens,
      COALESCE(SUM(cached_input_tokens), 0)::text AS cached_input_tokens,
      COALESCE(SUM(output_tokens), 0)::text AS output_tokens
    FROM ai_usage_events WHERE ${rangeSql}
  `, [startDate, endDate]);
  const totals = mapTotals(totalsResult.rows[0]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totals.requests / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.round(requestedPage) || 1));
  const offset = (page - 1) * pageSize;

  const [previousTotalsResult, dailyResult, servicesResult, recentResult] = await Promise.all([
    db.query<TotalRow>(`
      SELECT
        COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status = 'success')::int AS successful_requests,
        COUNT(*) FILTER (WHERE status IN ('rate_limited', 'budget_exceeded'))::int AS blocked_requests,
        COUNT(*) FILTER (WHERE status IN ('configuration_error', 'provider_error', 'internal_error'))::int AS failed_requests,
        COALESCE(SUM(input_tokens), 0)::text AS input_tokens,
        COALESCE(SUM(cached_input_tokens), 0)::text AS cached_input_tokens,
        COALESCE(SUM(output_tokens), 0)::text AS output_tokens
      FROM ai_usage_events WHERE ${rangeSql}
    `, [previousStartDate, previousEndDate]),
    db.query<DailyRow>(`
      WITH calendar AS (
        SELECT generate_series(
          $1::date,
          $2::date,
          interval '1 day'
        )::date AS day
      )
      SELECT
        to_char(calendar.day, 'YYYY-MM-DD') AS day,
        COUNT(events.id)::int AS requests,
        COUNT(events.id) FILTER (WHERE events.status = 'success')::int AS successful_requests,
        COALESCE(SUM(events.input_tokens), 0)::text AS input_tokens,
        COALESCE(SUM(events.cached_input_tokens), 0)::text AS cached_input_tokens,
        COALESCE(SUM(events.output_tokens), 0)::text AS output_tokens
      FROM calendar
      LEFT JOIN ai_usage_events events
        ON (events.occurred_at AT TIME ZONE 'America/Sao_Paulo')::date = calendar.day
      GROUP BY calendar.day ORDER BY calendar.day
    `, [startDate, endDate]),
    db.query<{ id: string; title: string; category: string; requests: number }>(`
      SELECT service->>'id' AS id, service->>'title' AS title,
        service->>'category' AS category, COUNT(*)::int AS requests
      FROM ai_usage_events
      CROSS JOIN LATERAL jsonb_array_elements(services) AS service
      WHERE ${rangeSql} AND status = 'success'
      GROUP BY 1, 2, 3 ORDER BY requests DESC, title LIMIT 10
    `, [startDate, endDate]),
    db.query<RecentRow>(`
      SELECT request_id, occurred_at, provider, model, status, input_tokens,
        cached_input_tokens, output_tokens, provider_calls,
        tool_calls, services, personal_data_removed, duration_ms
      FROM ai_usage_events WHERE ${rangeSql}
      ORDER BY occurred_at DESC LIMIT $3 OFFSET $4
    `, [startDate, endDate, pageSize, offset]),
  ]);

  const previousTotals = period.mode === "all" ? mapTotals() : mapTotals(previousTotalsResult.rows[0]);

  return {
    period: {
      mode: period.mode,
      startDate,
      endDate,
      dayCount,
      comparisonAvailable: period.mode !== "all",
    },
    generatedAt: new Date().toISOString(),
    totals,
    previousTotals,
    daily: dailyResult.rows.map((entry) => ({
      day: entry.day,
      requests: Number(entry.requests) || 0,
      successfulRequests: Number(entry.successful_requests) || 0,
      inputTokens: Number(entry.input_tokens) || 0,
      cachedInputTokens: Number(entry.cached_input_tokens) || 0,
      outputTokens: Number(entry.output_tokens) || 0,
    })),
    topServices: servicesResult.rows.map((entry) => ({ ...entry, requests: Number(entry.requests) || 0 })),
    pagination: {
      page,
      pageSize,
      totalItems: totals.requests,
      totalPages,
    },
    recent: recentResult.rows.map((entry) => ({
      requestId: entry.request_id,
      occurredAt: entry.occurred_at.toISOString(),
      provider: entry.provider,
      model: entry.model,
      status: entry.status,
      inputTokens: Number(entry.input_tokens) || 0,
      cachedInputTokens: Number(entry.cached_input_tokens) || 0,
      outputTokens: Number(entry.output_tokens) || 0,
      providerCalls: Number(entry.provider_calls) || 0,
      toolCalls: Number(entry.tool_calls) || 0,
      services: Array.isArray(entry.services) ? entry.services : [],
      personalDataRemoved: Boolean(entry.personal_data_removed),
      durationMs: Number(entry.duration_ms) || 0,
    })),
  };
}
