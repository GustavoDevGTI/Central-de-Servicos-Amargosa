import assert from "node:assert/strict";
import test from "node:test";
import { services } from "./service-catalog.ts";

test("pedido de certidão does not show the multi-service annex as its description", () => {
  const service = services.find((entry) => entry.id === "1doc-pedido-de-certidao");
  assert.ok(service);
  assert.ok(service.summary && service.summary.length < 300);
  assert.doesNotMatch(service.summary, /ANEXO ÚNICO|INSTRUÇÃO NORMATIVA/i);
  assert.ok(service.steps?.every((step) => !step.startsWith("*")));
});
