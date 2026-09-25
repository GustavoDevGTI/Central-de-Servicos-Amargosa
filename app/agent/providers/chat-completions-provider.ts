import { runtimeEnv, runtimeNumber } from "../runtime-env";
import type {
  AiAssistantMessage,
  AiCompletion,
  AiMessage,
  AiProvider,
  AiToolDefinition,
  AiToolCall,
} from "./ai-provider";
import {
  AiProviderConfigurationError,
  AiProviderRequestError,
} from "./ai-provider";

type ProviderName = AiProvider["name"];

type ChatCompletionResponse = {
  choices?: { message?: AiAssistantMessage }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
    prompt_cache_hit_tokens?: number;
  };
  error?: { message?: string };
};

const providerDefaults = {
  deepseek: {
    apiKeyName: "DEEPSEEK_API_KEY",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-flash",
  },
  openai: {
    apiKeyName: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5.4-nano",
  },
} as const;

function validToolCalls(value: unknown): AiToolCall[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const calls = value.flatMap((entry): AiToolCall[] => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Partial<AiToolCall>;
    if (
      typeof candidate.id !== "string" ||
      candidate.type !== "function" ||
      !candidate.function ||
      typeof candidate.function.name !== "string" ||
      typeof candidate.function.arguments !== "string"
    ) {
      return [];
    }
    return [candidate as AiToolCall];
  });
  return calls.length ? calls : undefined;
}

export class ChatCompletionsProvider implements AiProvider {
  readonly name: ProviderName;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(name: ProviderName) {
    this.name = name;
    const defaults = providerDefaults[name];
    const apiKey = runtimeEnv(defaults.apiKeyName);
    if (!apiKey) {
      throw new AiProviderConfigurationError(
        `O provedor ${name} não possui uma chave configurada.`,
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = (
      runtimeEnv(`${name.toLocaleUpperCase("en-US")}_BASE_URL`) || defaults.baseUrl
    ).replace(/\/$/, "");
    this.model = runtimeEnv("AI_MODEL") || defaults.model;
  }

  async complete(
    messages: AiMessage[],
    tools: readonly AiToolDefinition[],
  ): Promise<AiCompletion> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      tools: tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
      tool_choice: "auto",
      max_tokens: runtimeNumber("AI_MAX_OUTPUT_TOKENS", 800),
      stream: false,
    };

    if (this.name === "deepseek") {
      body.thinking = { type: "disabled" };
      body.reasoning_effort = "none";
    } else {
      body.reasoning_effort = "none";
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(runtimeNumber("AI_TIMEOUT_MS", 25_000)),
      });
    } catch {
      throw new AiProviderRequestError("O provedor de IA não respondeu a tempo.");
    }

    let payload: ChatCompletionResponse;
    try {
      payload = (await response.json()) as ChatCompletionResponse;
    } catch {
      throw new AiProviderRequestError(
        "O provedor de IA retornou uma resposta inválida.",
        response.status,
      );
    }

    if (!response.ok) {
      throw new AiProviderRequestError(
        payload.error?.message || "O provedor de IA recusou a solicitação.",
        response.status,
      );
    }

    const providerMessage = payload.choices?.[0]?.message;
    if (!providerMessage) {
      throw new AiProviderRequestError("O provedor de IA não retornou uma mensagem.");
    }
    const message: AiAssistantMessage = {
      role: "assistant",
      content:
        typeof providerMessage.content === "string" ? providerMessage.content : null,
      tool_calls: validToolCalls(providerMessage.tool_calls),
    };

    return {
      message,
      usage: {
        inputTokens: Math.max(0, payload.usage?.prompt_tokens || 0),
        cachedInputTokens: Math.max(
          0,
          payload.usage?.prompt_tokens_details?.cached_tokens ||
            payload.usage?.prompt_cache_hit_tokens ||
            0,
        ),
        outputTokens: Math.max(0, payload.usage?.completion_tokens || 0),
      },
    };
  }
}

export function createAiProvider(): AiProvider {
  const configured = runtimeEnv("AI_PROVIDER")?.toLocaleLowerCase("en-US") || "deepseek";
  if (configured !== "deepseek" && configured !== "openai") {
    throw new AiProviderConfigurationError(
      "AI_PROVIDER deve ser deepseek ou openai.",
    );
  }
  return new ChatCompletionsProvider(configured);
}

