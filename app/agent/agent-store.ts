import { runtimeNumber } from "./runtime-env";
import type { AgentUsage } from "./types";

type MemoryWindow = { count: number; resetAt: number };
const memoryLimits = new Map<string, MemoryWindow>();
const memoryUsage = new Map<string, number>();
let schemaReady: Promise<void> | undefined;

async function optionalDatabase() {
  try {
    // O nome em variável impede o bundler Docker de transformar este binding
    // opcional em um import obrigatório do runtime Cloudflare.
    const cloudflareModule = "cloudflare:workers";
    const { env } = await import(/* @vite-ignore */ cloudflareModule);
    const database = (env as Cloudflare.Env & { DB?: D1Database }).DB;
    return database || null;
  } catch {
    return null;
  }
}

async function ensureSchema(database: D1Database) {
  schemaReady ??= database
    .batch([
      database.prepare(`CREATE TABLE IF NOT EXISTS ai_agent_rate_limits (
        client_key TEXT NOT NULL,
        bucket TEXT NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (client_key, bucket)
      )`),
      database.prepare(`CREATE TABLE IF NOT EXISTS ai_agent_monthly_usage (
        month TEXT PRIMARY KEY,
        estimated_cost_brl REAL NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        cached_input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      )`),
    ])
    .then(() => undefined)
    .catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  return schemaReady;
}

function windowBucket(now: Date, durationMs: number) {
  return String(Math.floor(now.getTime() / durationMs));
}

async function incrementD1Limit(
  database: D1Database,
  clientKey: string,
  bucket: string,
) {
  const now = new Date().toISOString();
  const result = await database
    .prepare(
      `INSERT INTO ai_agent_rate_limits (client_key, bucket, request_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(client_key, bucket) DO UPDATE SET
         request_count = request_count + 1,
         updated_at = excluded.updated_at
       RETURNING request_count AS count`,
    )
    .bind(clientKey, bucket, now)
    .first<{ count: number }>();
  return Number(result?.count) || 1;
}

function incrementMemoryLimit(key: string, resetAt: number) {
  const current = memoryLimits.get(key);
  if (!current || current.resetAt <= Date.now()) {
    memoryLimits.set(key, { count: 1, resetAt });
    return 1;
  }
  current.count += 1;
  return current.count;
}

export async function checkAgentRateLimit(clientKey: string) {
  const now = new Date();
  const fiveMinutesMs = 5 * 60 * 1000;
  const shortLimit = runtimeNumber("AI_RATE_LIMIT_MESSAGES", 10);
  const dailyLimit = runtimeNumber("AI_DAILY_SESSION_LIMIT", 30);
  const shortBucket = `5m:${windowBucket(now, fiveMinutesMs)}`;
  const dailyBucket = `day:${now.toISOString().slice(0, 10)}`;
  const database = await optionalDatabase();

  let shortCount: number;
  let dailyCount: number;
  if (database) {
    await ensureSchema(database);
    [shortCount, dailyCount] = await Promise.all([
      incrementD1Limit(database, clientKey, shortBucket),
      incrementD1Limit(database, clientKey, dailyBucket),
    ]);
  } else {
    const shortReset = (Math.floor(now.getTime() / fiveMinutesMs) + 1) * fiveMinutesMs;
    const nextDay = new Date(now);
    nextDay.setUTCHours(24, 0, 0, 0);
    shortCount = incrementMemoryLimit(`${clientKey}:${shortBucket}`, shortReset);
    dailyCount = incrementMemoryLimit(
      `${clientKey}:${dailyBucket}`,
      nextDay.getTime(),
    );
  }

  if (shortCount > shortLimit) return { limited: true, retryAfter: 300 };
  if (dailyCount > dailyLimit) return { limited: true, retryAfter: 86_400 };
  return { limited: false, retryAfter: 0 };
}

function providerRates(provider: "deepseek" | "openai") {
  if (provider === "deepseek") {
    return {
      input: runtimeNumber("AI_INPUT_USD_PER_MILLION", 0.3),
      cached: runtimeNumber("AI_CACHED_INPUT_USD_PER_MILLION", 0.006),
      output: runtimeNumber("AI_OUTPUT_USD_PER_MILLION", 1.2),
    };
  }
  return {
    input: runtimeNumber("AI_INPUT_USD_PER_MILLION", 0.2),
    cached: runtimeNumber("AI_CACHED_INPUT_USD_PER_MILLION", 0.02),
    output: runtimeNumber("AI_OUTPUT_USD_PER_MILLION", 1.25),
  };
}

function estimateCostBrl(provider: "deepseek" | "openai", usage: AgentUsage) {
  const rates = providerRates(provider);
  const uncachedInput = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  const usd =
    (uncachedInput * rates.input +
      usage.cachedInputTokens * rates.cached +
      usage.outputTokens * rates.output) /
    1_000_000;
  return usd * runtimeNumber("AI_USD_TO_BRL", 6);
}

export async function isAgentBudgetAvailable() {
  const budget = runtimeNumber("AI_MONTHLY_BUDGET_BRL", 100);
  if (budget <= 0) return true;
  const month = new Date().toISOString().slice(0, 7);
  const database = await optionalDatabase();
  if (database) {
    await ensureSchema(database);
    const row = await database
      .prepare(
        "SELECT estimated_cost_brl AS cost FROM ai_agent_monthly_usage WHERE month = ?",
      )
      .bind(month)
      .first<{ cost: number }>();
    return (Number(row?.cost) || 0) < budget;
  }
  return (memoryUsage.get(month) || 0) < budget;
}

export async function recordAgentUsage(
  provider: "deepseek" | "openai",
  usage: AgentUsage,
) {
  const month = new Date().toISOString().slice(0, 7);
  const cost = estimateCostBrl(provider, usage);
  const database = await optionalDatabase();
  if (database) {
    await ensureSchema(database);
    await database
      .prepare(
        `INSERT INTO ai_agent_monthly_usage
          (month, estimated_cost_brl, input_tokens, cached_input_tokens, output_tokens, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(month) DO UPDATE SET
          estimated_cost_brl = estimated_cost_brl + excluded.estimated_cost_brl,
          input_tokens = input_tokens + excluded.input_tokens,
          cached_input_tokens = cached_input_tokens + excluded.cached_input_tokens,
          output_tokens = output_tokens + excluded.output_tokens,
          updated_at = excluded.updated_at`,
      )
      .bind(
        month,
        cost,
        usage.inputTokens,
        usage.cachedInputTokens,
        usage.outputTokens,
        new Date().toISOString(),
      )
      .run();
    return;
  }
  memoryUsage.set(month, (memoryUsage.get(month) || 0) + cost);
}
