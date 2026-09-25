import assert from "node:assert/strict";
import test from "node:test";
import { approvedServiceDetails } from "../approved-service-details";
import { isSameOrigin } from "../api/agent/chat/route";
import { services } from "../service-catalog";
import { answerWithAgent } from "./agent-service";
import { removePersonalData, sanitizeAgentHistory } from "./privacy";
import { findServices, getServiceById } from "./service-repository";
import { executeAgentTool } from "./tools";
import type {
  AiCompletion,
  AiMessage,
  AiProvider,
  AiToolDefinition,
} from "./providers/ai-provider";

const emptyUsage = { inputTokens: 10, cachedInputTokens: 0, outputTokens: 5 };

class FakeProvider implements AiProvider {
  readonly name = "deepseek";
  private turn = 0;

  async complete(
    messages: AiMessage[],
    tools: readonly AiToolDefinition[],
  ): Promise<AiCompletion> {
    void messages;
    void tools;
    this.turn += 1;
    if (this.turn === 1) {
      return {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call-search",
              type: "function",
              function: {
                name: "buscar_servicos",
                arguments: JSON.stringify({ termo: "2ª via do IPTU" }),
              },
            },
          ],
        },
        usage: emptyUsage,
      };
    }
    if (this.turn === 2) {
      return {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call-detail",
              type: "function",
              function: {
                name: "obter_servico",
                arguments: JSON.stringify({ id: "carta-segunda-via-iptu" }),
              },
            },
          ],
        },
        usage: emptyUsage,
      };
    }
    return {
      message: {
        role: "assistant",
        content: "Encontrei o serviço de 2ª via do IPTU.",
      },
      usage: emptyUsage,
    };
  }
}

class PendingHallucinationProvider implements AiProvider {
  readonly name = "deepseek";
  private turn = 0;

  async complete(): Promise<AiCompletion> {
    this.turn += 1;
    if (this.turn === 1) {
      return {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call-search-pending",
              type: "function",
              function: {
                name: "buscar_servicos",
                arguments: JSON.stringify({ termo: "alvará sanitário" }),
              },
            },
          ],
        },
        usage: emptyUsage,
      };
    }
    if (this.turn === 2) {
      return {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call-detail-pending",
              type: "function",
              function: {
                name: "obter_servico",
                arguments: JSON.stringify({ id: "1doc-alvara-sanitario" }),
              },
            },
          ],
        },
        usage: emptyUsage,
      };
    }
    return {
      message: {
        role: "assistant",
        content:
          "Leve CPF, comprovante de endereço e pague uma taxa de R$ 100,00.",
      },
      usage: emptyUsage,
    };
  }
}

class OutOfScopeHallucinationProvider implements AiProvider {
  readonly name = "deepseek";

  async complete(): Promise<AiCompletion> {
    return {
      message: {
        role: "assistant",
        content:
          "Claro! Para fazer um bolo, misture farinha, ovos, açúcar e leite.",
      },
      usage: emptyUsage,
    };
  }
}

class MissingServiceHallucinationProvider implements AiProvider {
  readonly name = "deepseek";
  private turn = 0;

  async complete(): Promise<AiCompletion> {
    this.turn += 1;
    if (this.turn === 1) {
      return {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call-search-missing",
              type: "function",
              function: {
                name: "buscar_servicos",
                arguments: JSON.stringify({ termo: "carteira municipal de pescador" }),
              },
            },
          ],
        },
        usage: emptyUsage,
      };
    }
    return {
      message: {
        role: "assistant",
        content:
          "A carteira municipal de pescador pode ser emitida levando RG e CPF à Secretaria de Agricultura.",
      },
      usage: emptyUsage,
    };
  }
}

class ExistingServiceWithoutToolProvider implements AiProvider {
  readonly name = "deepseek";

  async complete(): Promise<AiCompletion> {
    return {
      message: {
        role: "assistant",
        content:
          "Para obter a segunda via do IPTU, leve seus documentos ao setor responsável.",
      },
      usage: emptyUsage,
    };
  }
}

test("remove CPF, telefone e e-mail antes de enviar ao provedor", () => {
  const result = removePersonalData(
    "Meu CPF é 123.456.789-10, telefone (75) 99999-1234 e e-mail teste@exemplo.com.",
  );
  assert.equal(result.removed, true);
  assert.doesNotMatch(result.text, /123\.456|99999|teste@/);
  assert.match(result.text, /\[CPF removido\]/);
  assert.match(result.text, /\[telefone removido\]/);
  assert.match(result.text, /\[e-mail removido\]/);
});

test("aceita a origem pública encaminhada pelo proxy reverso", () => {
  const request = new Request("http://portal:3000/api/agent/chat", {
    headers: {
      Origin: "https://maisdigital.amargosa.ba.gov.br",
      Host: "portal:3000",
      "X-Forwarded-Host": "maisdigital.amargosa.ba.gov.br",
      "X-Forwarded-Proto": "https",
    },
  });
  assert.equal(isSameOrigin(request), true);
});

test("recusa uma origem externa mesmo atrás do proxy", () => {
  const request = new Request("http://portal:3000/api/agent/chat", {
    headers: {
      Origin: "https://exemplo-malicioso.invalid",
      Host: "portal:3000",
      "X-Forwarded-Host": "maisdigital.amargosa.ba.gov.br",
    },
  });
  assert.equal(isSameOrigin(request), false);
});

test("limita e valida o histórico curto", () => {
  const input = Array.from({ length: 12 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    text: `mensagem ${index}`,
  }));
  const result = sanitizeAgentHistory(input);
  assert.equal(result.history.length, 8);
  assert.equal(result.history[0].text, "mensagem 4");
});

test("entende frases indiretas de IPTU e abertura de estabelecimento", () => {
  const iptu = findServices("perdi o boleto da casa");
  const business = findServices("quero abrir uma loja");
  assert.match(iptu[0]?.title || "", /IPTU/i);
  assert.equal(business[0]?.title, "Alvará de funcionamento");
});

test("encontra a limpeza pública por coleta de lixo e disponibiliza as rotas à Amanda", () => {
  const found = findServices("coleta de lixo na Minguara");
  assert.equal(found[0]?.id, "1doc-limpeza-publica");

  const detail = getServiceById("1doc-limpeza-publica");
  assert.equal(detail?.collectionSchedule?.sourceUrl, "https://acesso.amargosa.ba.gov.br/coletalixo");
  const routes = detail?.collectionSchedule?.groups.flatMap((group) =>
    group.places.flatMap((place) => place.routes),
  ) || [];
  assert.equal(routes.length, 43);
  assert.deepEqual(routes.find((route) => route.name === "Rua Rio de Janeiro, Minguara")?.slots, [
    { day: "Terça-feira", time: "10:40" },
    { day: "Quinta-feira", time: "10:40" },
    { day: "Sábado", time: "10:40" },
  ]);
});

test("não expõe placeholders como informação oficial", () => {
  const approvedIds = new Set(Object.keys(approvedServiceDetails));
  const pending = services.find((service) => !approvedIds.has(service.id));
  assert.ok(pending);
  const detail = getServiceById(pending.id);
  assert.equal(detail?.detailsStatus, "pending");
  assert.equal(detail?.summary, null);
  assert.deepEqual(detail?.documents, []);
});

test("recusa ferramenta e identificador que não pertencem ao sistema", () => {
  const unknownTool = executeAgentTool("execute_sql", "{}");
  const unknownService = executeAgentTool(
    "obter_servico",
    JSON.stringify({ id: "nao-existe" }),
  );
  assert.match(unknownTool.output, /não permitida/i);
  assert.match(unknownService.output, /inexistente/i);
});

test("executa o ciclo de busca e detalhe sem entregar o catálogo inteiro", async () => {
  const answer = await answerWithAgent(
    "Perdi o carnê da minha casa.",
    [],
    new FakeProvider(),
  );
  assert.match(answer.message, /2ª via do IPTU/i);
  assert.equal(answer.services.length, 1);
  assert.match(answer.services[0].title, /IPTU/i);
  assert.equal(answer.usage.inputTokens, 30);
});

test("substitui por resposta segura qualquer detalhe inventado de serviço pendente", async () => {
  const answer = await answerWithAgent(
    "Quais documentos preciso para obter alvará sanitário?",
    [],
    new PendingHallucinationProvider(),
  );
  assert.match(answer.message, /não possui informações detalhadas aprovadas/i);
  assert.doesNotMatch(answer.message, /CPF|R\$ 100/i);
  assert.equal(answer.services[0]?.detailsStatus, "pending");
  assert.equal(answer.providerCalls, 3);
  assert.equal(answer.toolCalls, 2);
});

test("descarta resposta fora do escopo quando nenhum serviço foi consultado", async () => {
  const answer = await answerWithAgent(
    "Preciso de uma receita de bolo.",
    [],
    new OutOfScopeHallucinationProvider(),
  );
  assert.match(answer.message, /não encontrei um serviço relacionado/i);
  assert.doesNotMatch(answer.message, /farinha|ovos|açúcar|leite/i);
  assert.deepEqual(answer.services, []);
  assert.equal(answer.providerCalls, 1);
  assert.equal(answer.toolCalls, 1);
});

test("descarta detalhes inventados para serviço inexistente no catálogo", async () => {
  const answer = await answerWithAgent(
    "Como faço uma carteira municipal de pescador?",
    [],
    new MissingServiceHallucinationProvider(),
  );
  assert.match(answer.message, /não encontrei um serviço relacionado/i);
  assert.doesNotMatch(answer.message, /RG|CPF|Secretaria de Agricultura/i);
  assert.deepEqual(answer.services, []);
  assert.equal(answer.providerCalls, 2);
  assert.equal(answer.toolCalls, 1);
});

test("faz busca local segura quando o modelo responde sem consultar um serviço existente", async () => {
  const answer = await answerWithAgent(
    "Perdi o carnê da minha casa e preciso de outra via.",
    [],
    new ExistingServiceWithoutToolProvider(),
  );
  assert.match(answer.message, /encontrei estes serviços relacionados/i);
  assert.doesNotMatch(answer.message, /leve seus documentos/i);
  assert.match(answer.services[0]?.title || "", /IPTU/i);
  assert.equal(answer.providerCalls, 1);
  assert.equal(answer.toolCalls, 1);
});
