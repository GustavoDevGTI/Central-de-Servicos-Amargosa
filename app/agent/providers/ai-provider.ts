import type { AgentUsage } from "../types";

export type AiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type AiAssistantMessage = {
  role: "assistant";
  content: string | null;
  tool_calls?: AiToolCall[];
  reasoning_content?: string | null;
};

export type AiMessage =
  | { role: "system" | "user"; content: string }
  | AiAssistantMessage
  | { role: "tool"; tool_call_id: string; content: string };

export type AiToolDefinition = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AiCompletion = {
  message: AiAssistantMessage;
  usage: AgentUsage;
};

export interface AiProvider {
  readonly name: "deepseek" | "openai";
  complete(messages: AiMessage[], tools: readonly AiToolDefinition[]): Promise<AiCompletion>;
}

export class AiProviderConfigurationError extends Error {}
export class AiProviderRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

