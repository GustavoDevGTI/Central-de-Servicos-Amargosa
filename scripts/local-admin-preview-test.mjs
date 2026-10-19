import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";

const base = process.env.BETTER_AUTH_URL;
const source = process.argv[2];
if (!source || !base || !["127.0.0.1", "localhost"].includes(new URL(base).hostname) || process.env.LOCAL_ADMIN_SEED !== "true") {
  throw new Error("Use somente o admin local de testes e informe o XLSX base.");
}
const login = await fetch(`${base}/api/auth/sign-in/username`, {
  method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ username: process.env.LOCAL_ADMIN_USERNAME, password: process.env.LOCAL_ADMIN_PASSWORD }),
});
assert.equal(login.status, 200);
const cookie = login.headers.getSetCookie().map((part) => part.split(";", 1)[0]).join("; ");
const headers = { Origin: base, Cookie: cookie };
const current = await (await fetch(`${base}/api/catalog`)).json();
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(await readFile(source));
const sheet = workbook.getWorksheet("Catálogo consolidado");
assert.ok(sheet);
const columns = new Map();
sheet.getRow(1).eachCell((cell, column) => columns.set(String(cell.value).trim(), column));
const ids = sheet.getColumn(columns.get("ID")).values.filter((id) => typeof id === "number");
const id = Math.max(...ids) + 1;
const row = sheet.addRow([]);
const set = (column, value) => row.getCell(columns.get(column)).value = value;
set("ID", id);
set("Público", "Cidadãos");
set("Nome do serviço consolidado", "Prévia privada de teste local");
set("O que é", "Texto exclusivo do rascunho.\nAinda não publicado.");
set("Quem pode solicitar2", "A preencher");
set("Como solicitar - etapas", "1. Conferir a página.\n2. Revisar a planilha.");
set("Categoria", "Administração Pública");
set("Link de acesso", "https://example.com/previa?origem=planilha&teste=1");
const bytes = await workbook.xlsx.writeBuffer();
const form = new FormData();
form.append("file", new Blob([bytes]), "previa-local.xlsx");
const upload = await fetch(`${base}/api/admin/upload`, { method: "POST", headers, body: form });
assert.equal(upload.status, 200);
const draft = await upload.json();
assert.ok(draft.draftId);
assert.equal(draft.report.created, 1);
const service = draft.services.find((entry) => entry.id === `planilha-${id}`);
assert.ok(service);
const path = `/api/admin/drafts/${draft.draftId}`;
assert.equal((await fetch(`${base}${path}`)).status, 401);
const response = await fetch(`${base}${path}`, { headers });
assert.equal(response.status, 200);
assert.equal(response.headers.get("cache-control"), "no-store");
const preview = await response.json();
const created = preview.services.find((entry) => entry.id === service.id);
assert.equal(created.summary, "Texto exclusivo do rascunho.\nAinda não publicado.");
assert.equal(created.eligibility, "A preencher");
assert.equal(created.contactOverride.phone, "");
assert.equal(created.url, "https://example.com/previa?origem=planilha&teste=1");
for (const entry of preview.services.filter((entry) => entry.workbookCells)) {
  assert.equal(entry.title, entry.workbookCells["Nome do serviço consolidado"]);
  assert.equal(entry.url, entry.workbookCells["Link de acesso"]);
}
assert.equal((await fetch(`${base}/api/admin/drafts/not-a-uuid`, { headers })).status, 400);
assert.equal((await fetch(`${base}/api/admin/drafts/00000000-0000-4000-8000-000000000000`, { headers })).status, 404);
assert.equal((await fetch(`${base}/servicos/${service.slug}`)).status, 404);
const after = await (await fetch(`${base}/api/catalog`)).json();
assert.equal(after.version, current.version);
assert.ok(!after.services.some((entry) => entry.id === service.id));
const sourceResponse = await fetch(`${base}/api/admin/source`, { headers });
assert.equal(sourceResponse.status, 200);
const official = await sourceResponse.json();
assert.equal(new URL(official.embedUrl).searchParams.get("action"), "embedview");
const previewUrl = `${base}/admin/preview/${draft.draftId}/${service.slug}`;
assert.equal((await fetch(previewUrl)).status, 200);
await writeFile("tmp/admin-preview-fixture.xlsx", Buffer.from(bytes));
await writeFile("tmp/admin-preview-test-result.json", JSON.stringify({ draftId: draft.draftId, previewUrl, service, publishedVersion: current.version, checks: "passed" }, null, 2));
console.log(JSON.stringify({ previewUrl, checks: "passed", publicNewService: 404, catalogUnchanged: true }));
