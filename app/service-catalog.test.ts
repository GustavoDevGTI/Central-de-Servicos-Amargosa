import assert from "node:assert/strict";
import test from "node:test";
import { services } from "./service-catalog.ts";

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

test("reported services show concise descriptions instead of imported instructions and links", () => {
  const ids = [
    "1doc-alvara-sanitario",
    "1doc-ampliacao-de-carga-horaria-enquadramento",
    "1doc-descompatibilizacao-eleitoral",
    "1doc-contracheque",
    "1doc-ferias-marcacao-e-alteracao",
    "1doc-gratificacao-por-estimulo-ao-aperfeicoamento-gea-semed",
    "planilha-50-inscricao-processo-seletivo-para-coordenador-de-polo-uab",
    "1doc-atestado-medico-licenca-tratamento-de-saude",
    "1doc-licenca-por-motivo-de-doenca-em-pessoa-da-familia",
    "1doc-pedido-de-certidao",
    "1doc-progressao-na-carreira",
    "1doc-pedido-de-reajuste-reequilibrio-contratual",
    "1doc-requerimento-gratificacao-estimulo-aperfeicoamento",
    "1doc-ressarcimento-e-indenizacoes",
  ];

  for (const id of ids) {
    const service = services.find((entry) => entry.id === id);
    assert.ok(service, `Service not found: ${id}`);
    assert.ok(service.summary && service.summary.length < 300, `Invalid description: ${id}`);
    assert.doesNotMatch(service.summary, /\n|https?:\/\/|ANEXO|REGULAMENTO|DOCUMENTOS EXIGIDOS/i, id);
    assert.ok(service.description && service.description.length > service.summary.length + 60, `Missing detailed explanation: ${id}`);
    assert.doesNotMatch(service.description, /\n|https?:\/\/|ANEXO ÚNICO|DOCUMENTOS EXIGIDOS/i, id);
    assert.ok(service.steps?.length && service.steps.every((step) => !step.startsWith("*")), `Invalid steps: ${id}`);
  }

  const contracheque = services.find((entry) => entry.id === "1doc-contracheque");
  assert.ok(contracheque);
  assert.ok(contracheque.documents?.every((document) => !/CNPJ|ato constitutivo|procuração/i.test(document)));
});
