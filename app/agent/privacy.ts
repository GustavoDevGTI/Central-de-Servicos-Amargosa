import type { AgentHistoryMessage } from "./types";

export const MAX_AGENT_MESSAGE_LENGTH = 1000;
export const MAX_AGENT_HISTORY_MESSAGES = 8;

const personalDataPatterns = [
  {
    label: "CPF",
    pattern: /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g,
  },
  {
    label: "e-mail",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    label: "telefone",
    pattern: /(?<!\d)(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}(?!\d)/g,
  },
];

export function removePersonalData(value: string) {
  let text = value;
  let removed = false;

  for (const { label, pattern } of personalDataPatterns) {
    text = text.replace(pattern, () => {
      removed = true;
      return `[${label} removido]`;
    });
  }

  return { text, removed };
}

export function sanitizeAgentHistory(value: unknown): {
  history: AgentHistoryMessage[];
  personalDataRemoved: boolean;
} {
  if (!Array.isArray(value)) {
    return { history: [], personalDataRemoved: false };
  }

  let personalDataRemoved = false;
  const history = value
    .slice(-MAX_AGENT_HISTORY_MESSAGES)
    .flatMap((entry): AgentHistoryMessage[] => {
      if (!entry || typeof entry !== "object") return [];
      const { role, text } = entry as { role?: unknown; text?: unknown };
      if ((role !== "user" && role !== "assistant") || typeof text !== "string") {
        return [];
      }
      const trimmed = text.trim().slice(0, MAX_AGENT_MESSAGE_LENGTH);
      if (!trimmed) return [];
      const sanitized = removePersonalData(trimmed);
      personalDataRemoved ||= sanitized.removed;
      return [{ role, text: sanitized.text }];
    });

  return { history, personalDataRemoved };
}

