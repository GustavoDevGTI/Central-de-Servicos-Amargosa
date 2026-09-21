import {
  findServices,
  getServiceById,
  knownAudienceIds,
  type AgentServiceDetail,
} from "./service-repository";
import type { AgentServiceCard } from "./types";

export const agentTools = [
  {
    type: "function",
    name: "buscar_servicos",
    description:
      "Localiza até cinco serviços municipais relacionados à necessidade descrita pelo usuário. Use antes de afirmar que um serviço existe.",
    parameters: {
      type: "object",
      properties: {
        termo: {
          type: "string",
          description:
            "Termos curtos e objetivos que representem a intenção, incluindo sinônimos úteis.",
        },
        publico: {
          type: "string",
          description: "Identificador do público, somente quando estiver claro.",
        },
      },
      required: ["termo"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "obter_servico",
    description:
      "Obtém a ficha oficial de um serviço previamente localizado. Campos ausentes são retornados como null ou listas vazias.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Identificador exato retornado por buscar_servicos.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
] as const;

export type AgentToolResult = {
  output: string;
  services: AgentServiceCard[];
};

function parseArguments(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function executeAgentTool(name: string, rawArguments: string): AgentToolResult {
  const args = parseArguments(rawArguments);

  if (name === "buscar_servicos") {
    const term = typeof args.termo === "string" ? args.termo.trim().slice(0, 200) : "";
    const requestedAudience =
      typeof args.publico === "string" && knownAudienceIds.includes(args.publico)
        ? args.publico
        : undefined;
    if (!term) {
      return { output: JSON.stringify({ error: "Termo de busca inválido." }), services: [] };
    }
    const results = findServices(term, requestedAudience);
    return {
      output: JSON.stringify({ results }),
      services: results,
    };
  }

  if (name === "obter_servico") {
    const id = typeof args.id === "string" ? args.id.trim().slice(0, 120) : "";
    const service: AgentServiceDetail | null = id ? getServiceById(id) : null;
    return {
      output: JSON.stringify(
        service || { error: "Serviço inexistente ou identificador inválido." },
      ),
      services: service ? [service] : [],
    };
  }

  return {
    output: JSON.stringify({ error: "Ferramenta não permitida." }),
    services: [],
  };
}

