import assert from "node:assert/strict";
import test from "node:test";
import { approvedServiceDetails } from "../approved-service-details";
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
