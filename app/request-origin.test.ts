import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedRequestOrigin } from "./request-origin";

const internalUrl = "http://portal:3000/api/popular";

test("accepts the new public origin behind the reverse proxy", () => {
  const request = new Request(internalUrl, {
    method: "POST",
    headers: {
      Origin: "https://servicos.amargosa.ba.gov.br",
      Host: "portal:3000",
      "X-Forwarded-Host": "maisdigital.amargosa.ba.gov.br",
      "X-Forwarded-Proto": "https",
    },
  });
  assert.equal(isAllowedRequestOrigin(request), true);
});

test("rejects lookalike, insecure and malformed origins", () => {
  for (const origin of [
    "https://servicos.amargosa.ba.gov.br.attacker.invalid",
    "http://servicos.amargosa.ba.gov.br",
    "https://servicos.amargosa.ba.gov.br:444",
    "not-a-url",
  ]) {
    const request = new Request(internalUrl, {
      method: "POST",
      headers: { Origin: origin, Host: "portal:3000" },
    });
    assert.equal(isAllowedRequestOrigin(request), false, origin);
  }
});
