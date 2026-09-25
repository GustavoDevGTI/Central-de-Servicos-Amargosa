import { answerWithAgent } from "../../../agent/agent-service";
import {
  checkAgentRateLimit,
  isAgentBudgetAvailable,
  recordAgentUsage,
} from "../../../agent/agent-store";
import {
  MAX_AGENT_MESSAGE_LENGTH,
  removePersonalData,
  sanitizeAgentHistory,
} from "../../../agent/privacy";
import {
  AiProviderConfigurationError,
  AiProviderRequestError,
} from "../../../agent/providers/ai-provider";
import { createAiProvider } from "../../../agent/providers/chat-completions-provider";
import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentErrorResponse,
} from "../../../agent/types";

export const dynamic = "force-dynamic";

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;

function json(
  data: AgentChatResponse | AgentErrorResponse,
  status = 200,
  headers?: HeadersInit,
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim().toLocaleLowerCase("en-US") || "";
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLocaleLowerCase("en-US");
  } catch {
    return false;
  }

  const requestUrl = new URL(request.url);
  const allowedHosts = new Set([
    requestUrl.host.toLocaleLowerCase("en-US"),
    firstForwardedValue(request.headers.get("Host")),
    firstForwardedValue(request.headers.get("X-Forwarded-Host")),
  ]);
  allowedHosts.delete("");
  return allowedHosts.has(originHost);
}

async function clientKey(request: Request, sessionId: string) {
  const address =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "local";
  const bytes = new TextEncoder().encode(`${sessionId}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (!isSameOrigin(request)) {
    return json({ error: "Origem não permitida.", requestId }, 403);
  }
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
    return json({ error: "Formato inválido.", requestId }, 415);
  }
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 12_000) {
    return json({ error: "Requisição muito grande.", requestId }, 413);
  }

  let body: AgentChatRequest;
  try {
    body = (await request.json()) as AgentChatRequest;
  } catch {
    return json({ error: "JSON inválido.", requestId }, 400);
  }

  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const rawMessage = typeof body.message === "string" ? body.message.trim() : "";
  if (!SESSION_PATTERN.test(sessionId)) {
    return json({ error: "Sessão inválida.", requestId }, 400);
  }
  if (!rawMessage || rawMessage.length > MAX_AGENT_MESSAGE_LENGTH) {
    return json(
      {
        error: `A mensagem deve ter entre 1 e ${MAX_AGENT_MESSAGE_LENGTH} caracteres.`,
        requestId,
      },
      400,
    );
  }

  const sanitizedMessage = removePersonalData(rawMessage);
  const sanitizedHistory = sanitizeAgentHistory(body.history);
  const limit = await checkAgentRateLimit(await clientKey(request, sessionId));
  if (limit.limited) {
    return json(
      {
        error: "Muitas mensagens foram enviadas. Aguarde para tentar novamente.",
        requestId,
        retryAfter: limit.retryAfter,
      },
      429,
      { "Retry-After": String(limit.retryAfter) },
    );
  }
  if (!(await isAgentBudgetAvailable())) {
    return json(
      {
        error:
          "O limite mensal do assistente foi atingido. A busca e as páginas de serviços continuam disponíveis.",
        requestId,
      },
      503,
    );
  }

  try {
    const answer = await answerWithAgent(
      sanitizedMessage.text,
      sanitizedHistory.history,
      createAiProvider(),
    );
    const estimatedCostBrl = await recordAgentUsage(answer.provider, answer.usage);
    console.info(
      "[amanda-usage]",
      JSON.stringify({
        requestId,
        provider: answer.provider,
        providerCalls: answer.providerCalls,
        toolCalls: answer.toolCalls,
        inputTokens: answer.usage.inputTokens,
        cachedInputTokens: answer.usage.cachedInputTokens,
        outputTokens: answer.usage.outputTokens,
        estimatedCostBrl: Number(estimatedCostBrl.toFixed(6)),
        serviceIds: answer.services.map((service) => service.id),
        detailStatuses: answer.services.map((service) => service.detailsStatus),
        personalDataRemoved:
          sanitizedMessage.removed || sanitizedHistory.personalDataRemoved,
      }),
    );
    return json(
      {
        message: answer.message,
        services: answer.services,
        sessionId,
        requestId,
        personalDataRemoved:
          sanitizedMessage.removed || sanitizedHistory.personalDataRemoved || undefined,
      },
      200,
      {
        "X-Amanda-Provider-Calls": String(answer.providerCalls),
        "X-Amanda-Tool-Calls": String(answer.toolCalls),
        "X-Amanda-Input-Tokens": String(answer.usage.inputTokens),
        "X-Amanda-Cached-Input-Tokens": String(answer.usage.cachedInputTokens),
        "X-Amanda-Output-Tokens": String(answer.usage.outputTokens),
        "X-Amanda-Estimated-Cost-BRL": estimatedCostBrl.toFixed(6),
      },
    );
  } catch (error) {
    if (error instanceof AiProviderConfigurationError) {
      return json(
        {
          error:
            "O assistente ainda não está configurado. Use a busca tradicional da Central de Serviços.",
          requestId,
        },
        503,
      );
    }
    if (error instanceof AiProviderRequestError) {
      return json(
        {
          error:
            "O assistente está temporariamente indisponível. Tente novamente ou use a busca tradicional.",
          requestId,
        },
        502,
      );
    }
    return json(
      {
        error:
          "Não foi possível consultar o assistente agora. A busca tradicional continua disponível.",
        requestId,
      },
      500,
    );
  }
}
