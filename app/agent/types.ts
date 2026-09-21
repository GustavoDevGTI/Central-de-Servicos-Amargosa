export type AgentMessageRole = "user" | "assistant";

export type AgentHistoryMessage = {
  role: AgentMessageRole;
  text: string;
};

export type AgentChatRequest = {
  sessionId: string;
  message: string;
  history?: AgentHistoryMessage[];
};

export type AgentServiceCard = {
  id: string;
  title: string;
  url: string;
  category: string;
  department: string;
  summary: string | null;
  detailsStatus: "approved" | "pending";
};

export type AgentChatResponse = {
  message: string;
  services: AgentServiceCard[];
  sessionId: string;
  requestId: string;
  personalDataRemoved?: boolean;
};

export type AgentErrorResponse = {
  error: string;
  requestId?: string;
  retryAfter?: number;
};

export type AgentUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
};

