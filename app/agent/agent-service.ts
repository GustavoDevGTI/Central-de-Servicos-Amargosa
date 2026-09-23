import { AGENT_SYSTEM_PROMPT } from "./system-prompt";
import { agentTools, executeAgentTool } from "./tools";
import type { AgentHistoryMessage, AgentServiceCard, AgentUsage } from "./types";
import type { AiMessage, AiProvider } from "./providers/ai-provider";

const MAX_TOOL_CALLS = 4;
const NO_SERVICE_MATCH_MESSAGE =
  "Não encontrei um serviço relacionado na Central de Serviços com as informações fornecidas. Isso não significa necessariamente que a Prefeitura não ofereça esse atendimento. Descreva um pouco melhor o que você precisa ou utilize a busca tradicional da Central.";

export type AgentAnswer = {
  message: string;
  services: AgentServiceCard[];
  usage: AgentUsage;
  provider: AiProvider["name"];
  providerCalls: number;
  toolCalls: number;
};

function mergeUsage(total: AgentUsage, addition: AgentUsage) {
  total.inputTokens += addition.inputTokens;
  total.cachedInputTokens += addition.cachedInputTokens;
  total.outputTokens += addition.outputTokens;
}

function preferredServices(
  detailed: Map<string, AgentServiceCard>,
  candidates: Map<string, AgentServiceCard>,
) {
  const source = detailed.size ? detailed : candidates;
  return [...source.values()].slice(0, 5);
}

function serviceNames(services: AgentServiceCard[]) {
  return services.map((service) => `“${service.title}”`).join(", ");
}

function groundedMessage(
  detailed: Map<string, AgentServiceCard>,
  candidates: Map<string, AgentServiceCard>,
) {
  const pending = [...detailed.values()].filter(
    (service) => service.detailsStatus === "pending",
  );
  if (pending.length) {
    return `Encontrei ${serviceNames(pending)}, mas a ficha oficial ainda não possui informações detalhadas aprovadas. Por isso, não posso informar documentos, requisitos, etapas, custo, prazo ou canais desse serviço. Abra a página indicada abaixo para acompanhar futuras atualizações.`;
  }

  if (!detailed.size && candidates.size) {
    const found = [...candidates.values()].slice(0, 5);
    return `Encontrei estes serviços relacionados: ${serviceNames(found)}. Abra uma das opções abaixo ou detalhe um pouco mais o que você precisa.`;
  }

  if (!detailed.size && !candidates.size) {
    return NO_SERVICE_MATCH_MESSAGE;
  }

  return null;
}

export async function answerWithAgent(
  message: string,
  history: AgentHistoryMessage[],
  provider: AiProvider,
): Promise<AgentAnswer> {
  const messages: AiMessage[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    ...history.map((entry) => ({ role: entry.role, content: entry.text }) as AiMessage),
    { role: "user", content: message },
  ];
  const usage: AgentUsage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
  const candidates = new Map<string, AgentServiceCard>();
  const detailed = new Map<string, AgentServiceCard>();
  let toolCallCount = 0;
  let providerCallCount = 0;
  let searchedCatalog = false;

  while (toolCallCount <= MAX_TOOL_CALLS) {
    providerCallCount += 1;
    const completion = await provider.complete(messages, agentTools);
    mergeUsage(usage, completion.usage);
    messages.push(completion.message);

    const calls = completion.message.tool_calls || [];
    if (!calls.length) {
      const text = completion.message.content?.trim();
      if (!searchedCatalog && !detailed.size && !candidates.size) {
        searchedCatalog = true;
        toolCallCount += 1;
        const fallbackSearch = executeAgentTool(
          "buscar_servicos",
          JSON.stringify({ termo: message }),
        );
        for (const service of fallbackSearch.services) {
          candidates.set(service.id, service);
        }
      }
      const guardedText = groundedMessage(detailed, candidates);
      return {
        message:
          guardedText ||
          text ||
          "Não consegui formular uma resposta segura agora. Você pode tentar escrever sua necessidade de outra forma.",
        services: preferredServices(detailed, candidates),
        usage,
        provider: provider.name,
        providerCalls: providerCallCount,
        toolCalls: toolCallCount,
      };
    }

    for (const call of calls) {
      toolCallCount += 1;
      if (toolCallCount > MAX_TOOL_CALLS) {
        return {
          message:
            "Encontrei informações relacionadas, mas preciso que você detalhe um pouco mais o que deseja fazer.",
          services: preferredServices(detailed, candidates),
          usage,
          provider: provider.name,
          providerCalls: providerCallCount,
          toolCalls: toolCallCount,
        };
      }

      const result = executeAgentTool(call.function.name, call.function.arguments);
      if (call.function.name === "buscar_servicos") searchedCatalog = true;
      const destination =
        call.function.name === "obter_servico" ? detailed : candidates;
      for (const service of result.services) destination.set(service.id, service);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result.output,
      });
    }
  }

  return {
    message:
      "Não consegui concluir a consulta agora. Use a busca tradicional da Central de Serviços ou tente novamente em instantes.",
    services: preferredServices(detailed, candidates),
    usage,
    provider: provider.name,
    providerCalls: providerCallCount,
    toolCalls: toolCallCount,
  };
}
