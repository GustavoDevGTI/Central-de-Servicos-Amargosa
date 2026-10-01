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
