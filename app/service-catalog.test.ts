import assert from "node:assert/strict";
import test from "node:test";
import { excludedSpreadsheetServiceRows, services } from "./service-catalog.ts";
import { contactForService } from "./service-contacts.ts";
import spreadsheetServiceData from "./spreadsheet-service-data.json" with { type: "json" };
import spreadsheetServiceLinks from "./spreadsheet-service-links.json" with { type: "json" };
import { baGovServiceLinks } from "./service-request-system.ts";

test("serviços vermelhos ficam fora da Central; os demais mantêm o link correto", () => {
  const idsByRow = new Map<number, string[]>();
  for (const [id, detail] of Object.entries(spreadsheetServiceData.existing)) {
    idsByRow.set(detail.sourceRow, [...(idsByRow.get(detail.sourceRow) || []), id]);
  }
  for (const detail of spreadsheetServiceData.created) {
    idsByRow.set(detail.sourceRow, [...(idsByRow.get(detail.sourceRow) || []), detail.id]);
  }
  for (const [row, spreadsheetUrl] of Object.entries(spreadsheetServiceLinks.bySourceRow)) {
    const ids = idsByRow.get(Number(row));
    assert.ok(ids?.length, `Linha ${row} não mapeada`);
    for (const id of ids) {
      const service = services.find((entry) => entry.id === id);
      if (excludedSpreadsheetServiceRows.has(Number(row))) {
        assert.equal(service, undefined, `Serviço vermelho ${id} ainda está publicado`);
        continue;
      }
      assert.ok(service, `Serviço ${id} não encontrado`);
      assert.equal(service.url, baGovServiceLinks[id] || spreadsheetUrl, `Link incorreto em ${id}`);
    }
  }
});

test("férias usa os documentos e o setor atualizados na planilha", () => {
  const service = services.find((entry) => entry.id === "1doc-ferias-marcacao-e-alteracao");
  assert.ok(service);
  assert.deepEqual(service.documents, [
    "Requerimento de marcação ou alteração de férias (Disponível no momento do protocolo)",
  ]);
  assert.equal(service.department, "SEAFI.SUGEP");
  assert.equal(service.audienceLabel, "Servidor");
  assert.equal(contactForService(service).name, "SEAFI.SUGEP");
});

test("acesso à informação inicia na página específica do SEI", () => {
  const service = services.find((entry) => entry.id === "acesso-informacao");
  assert.ok(service);
  const seiUrl = "https://acesso.amargosa.ba.gov.br/acesso-informacao-lai-lei-no-125272011";
  assert.equal(service.url, seiUrl);
  assert.equal(service.requestSystem, "sei");
  assert.equal(service.channels?.find((channel) => channel.label === "Online")?.url, seiUrl);
  assert.match(service.steps?.join(" ") || "", /SEI|Protocolo Digital/);
  assert.doesNotMatch(JSON.stringify(service), /1doc|e-SIC/i);
});

test("pedido de certidão does not show the multi-service annex as its description", () => {
  const service = services.find((entry) => entry.id === "1doc-pedido-de-certidao");
  assert.ok(service);
  assert.ok(service.summary && service.summary.length < 300);
  assert.doesNotMatch(service.summary, /ANEXO ÚNICO|INSTRUÇÃO NORMATIVA/i);
  assert.ok(service.steps?.every((step) => !step.startsWith("*")));
});

test("serviços municipais usam suas etapas específicas no BA.gov", () => {
  const expected = new Map([
    ["1doc-transferencia-de-titularidade-imobiliaria", "solicitar-transferencia-de-titularidade-imobiliaria-amargosa/etapa/solicitar-o-servico"],
    ["1doc-solicitacao-de-reforma-de-carneira", "solicitar-reforma-de-carneiras-amargosa/etapa/solicitar-o-servico"],
    ["1doc-retirada-de-entulhos", "solicitar-retirada-de-entulhos-amargosa/etapa/solicitar-o-servico"],
    ["1doc-troca-de-lampadas", "solicitar-iluminacao-publica-amargosa/etapa/solicitar-o-servico"],
    ["ba-gov-limpeza-publica", "solicitar-limpeza-publica-amargosa/etapa/limpeza-publica"],
    ["ba-gov-transferencia-de-corpos", "solicitar-transferencia-de-corpos-amargosa/etapa/solicitar-o-servico"],
  ]);

  for (const [id, path] of expected) {
    const service = services.find((entry) => entry.id === id);
    assert.ok(service, `Serviço ausente: ${id}`);
    assert.equal(service.url, `https://www.ba.gov.br/servico/pm-amargosa/${path}`);
    assert.equal(service.destination, "BA.gov");
    assert.equal(service.requestSystem, "other");
    assert.ok(service.channels?.every((channel) => !channel.url || !/servicos\.ba\.gov\.br\/detalhe|acesso\.amargosa\.ba\.gov\.br/.test(channel.url)));
  }
});

test("coleta regular e solicitação de limpeza pública ficam em fichas distintas", () => {
  const collection = services.find((entry) => entry.id === "1doc-limpeza-publica");
  const cleaning = services.find((entry) => entry.id === "ba-gov-limpeza-publica");
  assert.ok(collection && cleaning);
  assert.equal(collection.title, "Coleta de Lixo");
  assert.equal(collection.slug, "coleta-de-lixo");
  assert.match(collection.summary || "", /coleta regular/i);
  assert.equal(collection.url, cleaning.url);
  assert.equal(collection.channels?.find((channel) => channel.label === "Online")?.url, cleaning.url);
  assert.equal(collection.channels?.find((channel) => channel.label === "Cronograma")?.url, "https://acesso.amargosa.ba.gov.br/coletalixo");
  assert.match(collection.notice || "", /A coleta não ocorreu conforme a rota/);
  assert.equal(cleaning.title, "Limpeza pública");
  assert.equal(cleaning.slug, "limpeza-publica");
  assert.match(cleaning.summary || "", /varrição.*capina.*roçagem/i);
});

test("iluminação e traslado mostram orientações adequadas ao serviço", () => {
  const lighting = services.find((entry) => entry.id === "1doc-troca-de-lampadas");
  const transfer = services.find((entry) => entry.id === "ba-gov-transferencia-de-corpos");
  assert.ok(lighting && transfer);
  assert.equal(lighting.title, "Iluminação pública");
  assert.equal(lighting.slug, "iluminacao-publica");
  assert.match(lighting.summary || "", /lâmpadas.*postes/i);
  assert.equal(transfer.slug, "transferencia-de-corpos");
  assert.match(transfer.documents?.join(" ") || "", /certidão de óbito.*autorização/i);
});
