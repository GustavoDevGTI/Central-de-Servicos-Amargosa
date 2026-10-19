import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";

const workbookPath = process.argv[2];
const base = process.env.BETTER_AUTH_URL;
if (!workbookPath || !base || !["127.0.0.1", "localhost"].includes(new URL(base).hostname) || process.env.LOCAL_ADMIN_SEED !== "true") {
  throw new Error("Use somente o banco local de testes e informe o XLSX base.");
}

const login = await fetch(`${base}/api/auth/sign-in/username`, {
  method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ username: process.env.LOCAL_ADMIN_USERNAME, password: process.env.LOCAL_ADMIN_PASSWORD }),
});
if (!login.ok) throw new Error(`Login: HTTP ${login.status}`);
const cookie = login.headers.getSetCookie().map((part) => part.split(";", 1)[0]).join("; ");
const headers = { Origin: base, Cookie: cookie };
const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}: ${body.error}`);
  return body;
};

const original = await request("/api/admin/history");
const active = original.versions.find((version) => version.active);
if (!active) throw new Error("Publique uma planilha base antes de testar.");
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(await readFile(workbookPath));
const sheet = workbook.getWorksheet("Catálogo consolidado");
if (!sheet) throw new Error("Aba ausente");
const index = new Map();
sheet.getRow(1).eachCell((cell, column) => index.set(String(cell.value).trim(), column));
let maxId = 0;
let removedRow;
sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return;
  const id = Number(row.getCell(index.get("ID")).value);
  if (id > maxId) maxId = id;
  if (id === 22) removedRow = rowNumber;
});
if (!removedRow) throw new Error("Linha de controle ausente.");
sheet.spliceRows(removedRow, 1);
const hiddenPaths = ["certidao-de-regularidade-fiscal-empresas", "certidao-de-regularidade-fiscal-iptu", "certidao-negativa-de-pessoa-fisica"];
const newId = maxId + 1;
const row = sheet.addRow([]);
const set = (name, value) => row.getCell(index.get(name)).value = value;
set("ID", newId);
set("Público", "Cidadãos");
set("Nome do serviço consolidado", "Serviço de teste local");
set("O que é", "Serviço criado apenas para o teste do admin local.");
set("Quem pode solicitar2", "Cidadãos");
set("Como solicitar - etapas", "1. Preencha a solicitação.");
set("Categoria", "Administração");
const bytes = await workbook.xlsx.writeBuffer();
const form = new FormData();
form.append("file", new Blob([bytes]), "admin-workflow-fixture.xlsx");
const preview = await request("/api/admin/upload", { method: "POST", body: form });
if (preview.report.created !== 1 || preview.report.deactivated !== 1 || preview.report.blockers.length) {
  throw new Error(`Prévia inesperada: ${JSON.stringify({ created: preview.report.created, deactivated: preview.report.deactivated, deactivatedIds: preview.report.changes.filter((change) => change.kind === "deactivated").map((change) => change.serviceId), blockers: preview.report.blockers })}`);
}
let published;
let restored;
const createdPath = `/servicos/servico-de-teste-local`;
try {
  published = await request("/api/admin/publish", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId: preview.draftId }),
  });
  const created = await fetch(`${base}${createdPath}`);
  const hidden = await Promise.all(hiddenPaths.map((slug) => fetch(`${base}/servicos/${slug}`).then((response) => response.status)));
  if (created.status !== 200 || hidden.some((status) => status !== 404)) throw new Error(`Rotas após publicação: novo ${created.status}, excluídos ${hidden}`);
  const archived = await request(`/api/admin/history/${published.version}/preview`);
  if (!archived.services.filter((service) => service.sourceRow === 22).every((service) => service.inactive && service.workbookCells)) throw new Error("Espelhos não foram preservados.");
  const duplicateForm = new FormData();
  duplicateForm.append("file", new Blob([bytes]), "admin-workflow-fixture.xlsx");
  const duplicate = await request("/api/admin/upload", { method: "POST", body: duplicateForm });
  if (!duplicate.identical || duplicate.draftId) throw new Error("Exclusão repetida gerou outra alteração.");
  if (!(await created.text()).includes("Serviço criado apenas para o teste do admin local.")) throw new Error("Página nova sem conteúdo da planilha.");
  const consumed = await fetch(`${base}/api/admin/drafts/${preview.draftId}`, { headers });
  if (consumed.status !== 404) throw new Error("Rascunho publicado continuou disponível.");
} finally {
  restored = await request("/api/admin/restore", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionId: Number(active.id) }),
  });
}
const removed = await fetch(`${base}${createdPath}`);
const returned = await Promise.all(hiddenPaths.map((slug) => fetch(`${base}/servicos/${slug}`).then((response) => response.status)));
if (removed.status !== 404 || returned.some((status) => status !== 200)) throw new Error(`Rotas após restauração: novo ${removed.status}, reativados ${returned}`);
const history = await request("/api/admin/history");
if (history.versions.length < 3 || !history.versions.find((version) => version.active && Number(version.id) === restored.version)) {
  throw new Error("Histórico após restauração incompleto.");
}
console.log(JSON.stringify({ created: newId, published: published.version, restored: restored.version, history: history.versions.length, newRoute: removed.status, reactivatedRoutes: returned, archivedMirrors: 3, duplicateDeletionIgnored: true }));
