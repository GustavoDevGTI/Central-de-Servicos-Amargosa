import assert from "node:assert/strict";
import test from "node:test";
import { downloadOfficialCatalog } from "./catalog-link-download";
import { OFFICIAL_CATALOG_LINK } from "./catalog-source-url";

test("aceita a planilha oficial e mantém o cookie no redirecionamento", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.hostname, "prodeboffice365-my.sharepoint.com");
    if (calls === 1) {
      assert.equal(url.search, "?download=1");
      return new Response(null, { status: 302, headers: { Location: "/personal/catalog.xlsx", "Set-Cookie": "downloadToken=valid; Path=/; HttpOnly" } });
    }
    assert.equal((init?.headers as Record<string, string>)?.Cookie, "downloadToken=valid");
    return new Response(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), { status: 200 });
  };
  try {
    const bytes = await downloadOfficialCatalog(OFFICIAL_CATALOG_LINK);
    assert.deepEqual([...bytes], [0x50, 0x4b, 0x03, 0x04]);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test("bloqueia links externos antes de fazer qualquer requisição", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("fetch inesperado"); };
  try {
    await assert.rejects(downloadOfficialCatalog("http://127.0.0.1:9000/admin"), /planilha oficial/);
    await assert.rejects(downloadOfficialCatalog("https://prodeboffice365-my.sharepoint.com/outro-arquivo"), /planilha oficial/);
    assert.equal(called, false);
  } finally { globalThis.fetch = originalFetch; }
});

test("recusa redirecionamento para outro domínio", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, {
    status: 302, headers: { Location: "https://example.com/catalog.xlsx" },
  });
  try {
    await assert.rejects(downloadOfficialCatalog(OFFICIAL_CATALOG_LINK), /destino inesperado/);
  } finally { globalThis.fetch = originalFetch; }
});
