"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import type { AiUsageDashboard, AiUsageStatus } from "../../lib/ai-usage";

const integer = new Intl.NumberFormat("pt-BR");

const statusNames: Record<AiUsageStatus, string> = {
  success: "Concluída",
  rate_limited: "Limite de mensagens",
  budget_exceeded: "Limite operacional",
  configuration_error: "Configuração",
  provider_error: "Provedor indisponível",
  internal_error: "Erro interno",
};

function totalTokens(data: AiUsageDashboard) {
  return data.totals.inputTokens + data.totals.outputTokens;
}

function tokenBreakdown(data: AiUsageDashboard) {
  const cached = Math.min(data.totals.inputTokens, data.totals.cachedInputTokens);
  const uncached = Math.max(0, data.totals.inputTokens - cached);
  const output = data.totals.outputTokens;
  const total = Math.max(1, uncached + cached + output);
  return {
    cached,
    uncached,
    output,
    cachedPercent: (cached / total) * 100,
    uncachedPercent: (uncached / total) * 100,
    outputPercent: (output / total) * 100,
  };
}

function localDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

type ChartMetric = "requests" | "tokens";
type PeriodFilter =
  | { mode: "days"; days: number }
  | { mode: "all" }
  | { mode: "custom"; startDate: string; endDate: string };

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

function shortDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function periodLabel(data: AiUsageDashboard) {
  if (data.period.mode === "all") return "Todo o histórico";
  if (data.period.mode === "custom") return `${shortDate(data.period.startDate)} a ${shortDate(data.period.endDate)}`;
  return data.period.dayCount === 365 ? "Último ano" : `Últimos ${data.period.dayCount} dias`;
}

function rate(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function average(total: number, count: number) {
  return count > 0 ? total / count : 0;
}

function percentChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

function visiblePages(current: number, total: number) {
  const count = Math.min(5, total);
  const start = Math.max(1, Math.min(current - 2, total - count + 1));
  return Array.from({ length: count }, (_, index) => start + index);
}

function KpiCard({
  label,
  value,
  context,
  delta,
  deltaKind = "percent",
  positiveIsGood,
  comparisonAvailable = true,
}: {
  label: string;
  value: ReactNode;
  context: string;
  delta: number | null;
  deltaKind?: "percent" | "points";
  positiveIsGood?: boolean;
  comparisonAvailable?: boolean;
}) {
  const direction = delta === null || delta === 0 ? "steady" : delta > 0 ? "up" : "down";
  const tone = positiveIsGood === undefined || direction === "steady"
    ? "neutral"
    : (direction === "up") === positiveIsGood ? "good" : "bad";
  const formattedDelta = !comparisonAvailable
    ? "Acumulado de todo o histórico"
    : delta === null
    ? "Sem base anterior"
    : `${delta > 0 ? "↑" : delta < 0 ? "↓" : "•"} ${Math.abs(delta).toFixed(1)}${deltaKind === "points" ? " p.p." : "%"} vs. período anterior`;

  return <article>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{context}</small>
    <small className={`admin-ai-delta admin-ai-delta-${tone}`}>{formattedDelta}</small>
  </article>;
}

export function AiUsagePanel() {
  const today = saoPauloToday();
  const [period, setPeriod] = useState<PeriodFilter>({ mode: "days", days: 30 });
  const [customVisible, setCustomVisible] = useState(false);
  const [customStart, setCustomStart] = useState(shiftDate(today, -29));
  const [customEnd, setCustomEnd] = useState(today);
  const [page, setPage] = useState(1);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("requests");
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<AiUsageDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (period.mode === "all") params.set("period", "all");
    else if (period.mode === "custom") {
      params.set("period", "custom");
      params.set("start", period.startDate);
      params.set("end", period.endDate);
    } else params.set("days", String(period.days));
    params.set("page", String(page));

    void fetch(`/api/admin/ai-usage?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as AiUsageDashboard & { error?: string };
        if (!response.ok) throw new Error(body.error || "Métricas indisponíveis.");
        if (!controller.signal.aborted) {
          setData(body);
          if (body.pagination.page !== page) setPage(body.pagination.page);
          setError("");
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Métricas indisponíveis.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [page, period, revision]);

  const maxDailyValue = useMemo(() => Math.max(1, ...(data?.daily.map((entry) => {
    if (chartMetric === "tokens") return entry.inputTokens + entry.outputTokens;
    return entry.requests;
  }) || [1])), [data, chartMetric]);
  const maxServiceRequests = Math.max(1, ...(data?.topServices.map((entry) => entry.requests) || [1]));
  const tokens = data ? tokenBreakdown(data) : null;
  const successRate = data ? rate(data.totals.successfulRequests, data.totals.requests) : 0;
  const previousSuccessRate = data ? rate(data.previousTotals.successfulRequests, data.previousTotals.requests) : 0;
  const currentTokens = data ? totalTokens(data) : 0;
  const previousTokens = data ? data.previousTotals.inputTokens + data.previousTotals.outputTokens : 0;
  const averageTokens = data ? average(currentTokens, data.totals.successfulRequests) : 0;
  const previousAverageTokens = data ? average(previousTokens, data.previousTotals.successfulRequests) : 0;

  function dailyValue(entry: AiUsageDashboard["daily"][number]) {
    if (chartMetric === "tokens") return entry.inputTokens + entry.outputTokens;
    return entry.requests;
  }

  function formatDailyValue(value: number) {
    return integer.format(value);
  }

  function selectDays(value: number) {
    setLoading(true);
    setCustomVisible(false);
    setPage(1);
    setPeriod({ mode: "days", days: value });
  }

  function selectAll() {
    setLoading(true);
    setCustomVisible(false);
    setPage(1);
    setPeriod({ mode: "all" });
  }

  function applyCustomPeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (customStart > customEnd) {
      setError("A data inicial deve ser anterior ou igual à data final.");
      return;
    }
    setError("");
    setLoading(true);
    setPage(1);
    setPeriod({ mode: "custom", startDate: customStart, endDate: customEnd });
  }

  function selectPage(value: number) {
    setLoading(true);
    setPage(value);
  }

  function refresh() {
    setLoading(true);
    setRevision((value) => value + 1);
  }

  return <section className="admin-section admin-ai-usage" aria-labelledby="ai-usage-title">
    <div className="admin-ai-heading">
      <div>
        <h2 id="ai-usage-title">Uso da Amanda</h2>
        <p>Consumo técnico sem armazenar perguntas, respostas, endereço IP ou identificação do cidadão.</p>
      </div>
      <button type="button" className="admin-ai-refresh" onClick={refresh} disabled={loading}>Atualizar</button>
    </div>
    <div className="admin-ai-period" aria-label="Período das métricas">
      {[7, 30, 90, 365].map((value) => <button key={value} type="button" aria-pressed={period.mode === "days" && period.days === value}
        onClick={() => selectDays(value)}>{value === 365 ? "1 ano" : `${value} dias`}</button>)}
      <button type="button" aria-pressed={period.mode === "all"} onClick={selectAll}>Total</button>
      <button type="button" aria-pressed={period.mode === "custom"} onClick={() => setCustomVisible((visible) => !visible)}>Personalizar</button>
    </div>
    {customVisible && <form className="admin-ai-custom-period" onSubmit={applyCustomPeriod}>
      <label>Data inicial<input type="date" required max={customEnd} value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
      <label>Data final<input type="date" required min={customStart} max={today} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
      <button type="submit" disabled={loading}>Aplicar período</button>
    </form>}
    {error ? <p className="admin-error" role="alert">{error}</p> : loading && !data ? <p role="status">Carregando uso da Amanda…</p> : data && <div className="admin-ai-results" key={data.generatedAt}>
      {loading && <p className="admin-ai-updating" role="status">Atualizando…</p>}
      <div className="admin-ai-cards">
        <KpiCard label="Requisições" value={integer.format(data.totals.requests)}
          context={`${integer.format(data.totals.successfulRequests)} concluídas`}
          delta={percentChange(data.totals.requests, data.previousTotals.requests)}
          comparisonAvailable={data.period.comparisonAvailable} />
        <KpiCard label="Taxa de sucesso" value={`${successRate.toFixed(1)}%`}
          context={`${integer.format(data.totals.blockedRequests)} bloqueadas · ${integer.format(data.totals.failedRequests)} falhas`}
          delta={data.previousTotals.requests ? successRate - previousSuccessRate : null}
          deltaKind="points" positiveIsGood comparisonAvailable={data.period.comparisonAvailable} />
        <KpiCard label="Tokens no período" value={integer.format(currentTokens)}
          context={`${integer.format(data.totals.cachedInputTokens)} reaproveitados do cache`}
          delta={percentChange(currentTokens, previousTokens)}
          comparisonAvailable={data.period.comparisonAvailable} />
        <KpiCard label="Média de tokens" value={integer.format(Math.round(averageTokens))}
          context="Por resposta concluída"
          delta={percentChange(averageTokens, previousAverageTokens)}
          comparisonAvailable={data.period.comparisonAvailable} />
      </div>

      <section className="admin-ai-alerts" aria-labelledby="ai-alerts-title">
        <div className="admin-ai-section-heading">
          <div><h3 id="ai-alerts-title">Situação operacional</h3><p>Ocorrências que podem exigir acompanhamento no período selecionado.</p></div>
          <span>{periodLabel(data)}</span>
        </div>
        <div className="admin-ai-alert-list">
          <article className={data.totals.failedRequests ? "admin-ai-alert-error" : "admin-ai-alert-ok"}>
            <strong>{integer.format(data.totals.failedRequests)} falhas</strong>
            <p>{data.totals.failedRequests ? "Consulte a lista recente para identificar erros do provedor, configuração ou sistema." : "Nenhuma falha técnica registrada."}</p>
          </article>
          <article className={data.totals.blockedRequests ? "admin-ai-alert-warning" : "admin-ai-alert-ok"}>
            <strong>{integer.format(data.totals.blockedRequests)} bloqueios</strong>
            <p>{data.totals.blockedRequests ? "Ocorreram bloqueios por limites operacionais ou excesso de mensagens." : "Nenhum bloqueio por limites operacionais."}</p>
          </article>
        </div>
      </section>

      <div className="admin-ai-grid">
        <section className="admin-ai-block" aria-labelledby="daily-usage-title">
          <div className="admin-ai-chart-heading">
            <div><h3 id="daily-usage-title">Evolução diária</h3><p>Selecione a medida para comparar os dias.</p></div>
            <div className="admin-ai-chart-controls" role="group" aria-label="Medida do gráfico">
              {(["requests", "tokens"] as ChartMetric[]).map((metric) => <button type="button" key={metric}
                aria-pressed={chartMetric === metric} onClick={() => setChartMetric(metric)}>
                {metric === "requests" ? "Requisições" : "Tokens"}
              </button>)}
            </div>
          </div>
          {!data.daily.length ? <p>Nenhuma requisição registrada no período.</p> : <div className="admin-ai-chart" role="img" aria-label={`Gráfico diário de ${chartMetric === "requests" ? "requisições" : "tokens"}`}>
            {data.daily.map((entry, index) => {
              const value = dailyValue(entry);
              return <div className="admin-ai-bar-column" key={entry.day} title={`${entry.day}: ${formatDailyValue(value)}; ${entry.requests} requisições; ${entry.successfulRequests} concluídas`}>
              {data.period.dayCount <= 30 && <span>{formatDailyValue(value)}</span>}
              <div style={{
                height: `${value ? Math.max(5, (value / maxDailyValue) * 150) : 2}px`,
                "--ai-delay": `${Math.min(index, 12) * 25}ms`,
              } as CSSProperties} />
              <small>{entry.day.slice(5).split("-").reverse().join("/")}</small>
            </div>})}
          </div>}
        </section>
        <section className="admin-ai-block" aria-labelledby="top-services-title">
          <h3 id="top-services-title">Serviços mais identificados</h3>
          {!data.topServices.length ? <p>Ainda não há serviços identificados no período.</p> : <ol className="admin-ai-ranking">
            {data.topServices.map((service, index) => <li key={service.id} style={{ "--ai-delay": `${index * 45}ms` } as CSSProperties}>
              <div><strong>{service.title}</strong><small>{service.category || "Sem categoria"}</small></div>
              <span>{integer.format(service.requests)}</span>
              <progress max={maxServiceRequests} value={service.requests}>{service.requests}</progress>
            </li>)}
          </ol>}
        </section>
      </div>

      {tokens && <div className="admin-ai-token-split">
        <h3>Distribuição de tokens</h3>
        <div className="admin-ai-token-bar" role="img" aria-label={`${integer.format(tokens.uncached)} tokens de entrada sem cache, ${integer.format(tokens.cached)} tokens em cache e ${integer.format(tokens.output)} tokens de saída`}>
          <span className="admin-ai-input" style={{ width: `${tokens.uncachedPercent}%` }} title="Entrada sem cache" />
          <span className="admin-ai-cache" style={{ width: `${tokens.cachedPercent}%` }} title="Entrada em cache" />
          <span className="admin-ai-output" style={{ width: `${tokens.outputPercent}%` }} title="Saída" />
        </div>
        <div className="admin-ai-token-legend">
          <span><i className="admin-ai-input" />Entrada sem cache: <strong>{integer.format(tokens.uncached)}</strong></span>
          <span><i className="admin-ai-cache" />Entrada em cache: <strong>{integer.format(tokens.cached)}</strong></span>
          <span><i className="admin-ai-output" />Saída: <strong>{integer.format(tokens.output)}</strong></span>
        </div>
      </div>}

      <section className="admin-ai-recent" aria-labelledby="recent-requests-title">
        <h3 id="recent-requests-title">Requisições do período</h3>
        <p>A coluna “Serviços” indica o assunto reconhecido pela Amanda; o texto digitado pelo cidadão não é armazenado.</p>
        <div className="admin-table-scroll"><table className="admin-changes-table admin-ai-table">
          <thead><tr><th>Data</th><th>Requisição</th><th>Status</th><th>Serviços</th><th>Tokens</th><th>Duração</th></tr></thead>
          <tbody>{data.recent.length ? data.recent.map((entry) => <tr key={entry.requestId}>
            <td>{localDate(entry.occurredAt)}</td>
            <td><code title={entry.requestId}>{entry.requestId.slice(0, 8)}</code><small>{entry.provider} · {entry.model}</small></td>
            <td><span className={`admin-ai-status admin-ai-status-${entry.status}`}>{statusNames[entry.status]}</span>{entry.personalDataRemoved && <small>Dados pessoais removidos</small>}</td>
            <td>{entry.services.length ? entry.services.map((service) => service.title).join(", ") : "Nenhum serviço identificado"}</td>
            <td>{integer.format(entry.inputTokens + entry.outputTokens)}<small>{integer.format(entry.cachedInputTokens)} em cache</small></td>
            <td>{entry.durationMs ? `${(entry.durationMs / 1000).toFixed(1)} s` : "—"}</td>
          </tr>) : <tr><td colSpan={6}>Nenhuma requisição registrada no período.</td></tr>}</tbody>
        </table></div>
        {data.pagination.totalItems > 0 && <nav className="admin-ai-pagination" aria-label="Paginação das requisições">
          <p>
            Exibindo {integer.format((data.pagination.page - 1) * data.pagination.pageSize + 1)}–{integer.format(Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems))}
            {" de "}{integer.format(data.pagination.totalItems)} requisições
          </p>
          <div>
            <button type="button" disabled={loading || data.pagination.page === 1} onClick={() => selectPage(data.pagination.page - 1)}>Anterior</button>
            {visiblePages(data.pagination.page, data.pagination.totalPages).map((value) => <button type="button" key={value}
              aria-label={`Página ${value}`} aria-current={value === data.pagination.page ? "page" : undefined}
              disabled={loading} onClick={() => selectPage(value)}>{value}</button>)}
            <button type="button" disabled={loading || data.pagination.page === data.pagination.totalPages} onClick={() => selectPage(data.pagination.page + 1)}>Próxima</button>
          </div>
        </nav>}
      </section>
      <p className="admin-ai-footnote">Atualizado em {localDate(data.generatedAt)}. Período exibido: {periodLabel(data)}.</p>
    </div>}
  </section>;
}
