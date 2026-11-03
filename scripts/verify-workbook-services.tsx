import assert from "node:assert/strict";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { services, excludedSpreadsheetServiceRows } from "../app/service-catalog";
import { servicePageCopy } from "../app/service-page-copy";
import { workbookStepParts, workbookDocumentColumns } from "../app/workbook-service";
import { ServiceDetail } from "../app/internal-portal";
import { contactForService } from "../app/service-contacts";
import workbook from "../app/workbook-service-data.json";
import { analyzeWorkbook } from "../lib/catalog-import";
import { snapshotServices } from "../lib/catalog-preview";
import { CatalogPreviewProvider } from "../app/catalog-provider";

const output = "tmp/workbook-audit";
fs.mkdirSync(output, { recursive: true });
const fields = {
  title: "Nome do serviço consolidado", summary: "O que é", eligibility: "Quem pode solicitar2",
  whereWhen: "Onde e quando solicitar2", cost: "Custo", duration: "Prazo",
  department: "Setor/Unidade responsável no SEI", category: "Categoria", audienceLabel: "Público",
  destination: "Plataforma", url: "Link de acesso",
} as const;
const matched = services.filter((service) => service.workbookCells);
const expectedIds = Object.keys(workbook.rows).map(Number).filter((id) => !excludedSpreadsheetServiceRows.has(id));
assert.deepEqual([...new Set(matched.map((service) => service.sourceRow))].sort((a, b) => a! - b!), expectedIds.sort((a, b) => a - b));
const fullPages: Record<string, string> = {};
let comparisons = 0;
for (const service of matched) {
  const cells = workbook.rows[String(service.sourceRow) as keyof typeof workbook.rows].cells;
  const displayed = servicePageCopy(service);
  for (const [field, column] of Object.entries(fields)) {
    assert.equal(displayed[field as keyof typeof fields], cells[column as keyof typeof cells], `${service.id}: ${column}`);
    comparisons++;
  }
  assert.deepEqual(displayed.steps, cells["Como solicitar - etapas"] ? [cells["Como solicitar - etapas"]] : []);
  assert.deepEqual(displayed.workbookCells, cells);
  const contact = contactForService(displayed);
  assert.equal(contact.phone, cells.Telefone);
  assert.equal(contact.email || "", cells["E-mail do setor/unidade"]);
  assert.equal(contact.address, "");
  assert.equal(displayed.legislation, undefined);
  assert.equal(displayed.whereWhenItems, undefined);
  assert.equal(workbookStepParts(cells["Como solicitar - etapas"]).map(part => part.prefix + part.text).join(""), cells["Como solicitar - etapas"]);
  assert.deepEqual(displayed.documents, workbookDocumentColumns(cells).map(column => cells[column as keyof typeof cells]));
  fullPages[service.id] = renderToStaticMarkup(<ServiceDetail slug={displayed.slug!} />);
}
fs.writeFileSync(`${output}/rendered-pages.json`, JSON.stringify(fullPages));
fs.writeFileSync(`${output}/catalog-after.json`, JSON.stringify(services));

// Import a deliberately changed workbook to prove new uploads do not keep old
// destinations, rewrite placeholders, remove numbering or fill empty contacts.
const ExcelJS = (await import("exceljs")).default;
const source = new ExcelJS.Workbook();
await source.xlsx.readFile(process.argv[2] || "tmp/catalog-current.xlsx");
// Check the actual administrative import as well as the built-in catalog.
const originalImport = await analyzeWorkbook(Buffer.from(await source.xlsx.writeBuffer()));
const importedPages: Record<string, string> = {};
const previewServices = snapshotServices(originalImport.snapshot).filter(service => !service.inactive);
const activeImported = previewServices.filter(service => service.workbookCells);
assert.equal(activeImported.length, matched.length);
for (const service of activeImported) {
  const cells = originalImport.snapshot.rows[String(service.sourceRow)].cells;
  for (const [field, column] of Object.entries(fields)) {
    assert.equal(service[field as keyof typeof fields], cells[column], `Imported ${service.id}: ${column}`);
  }
  importedPages[service.id] = renderToStaticMarkup(<CatalogPreviewProvider services={previewServices}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
}
fs.writeFileSync(`${output}/rendered-import-pages.json`, JSON.stringify(importedPages));
fs.writeFileSync(`${output}/catalog-import-after.json`, JSON.stringify(activeImported));
const sheet = source.getWorksheet("Catálogo consolidado")!;
const row = sheet.getRow(135);
row.getCell("F").value = "  1. BA.GOV.BR / 1Doc.\n2. Nao se aplica!  ";
row.getCell("G").value = "Horário: A preencher.  \nLocal: confirmar.";
row.getCell("J").value = "Não se aplica (R$ 0,00)";
row.getCell("M").value = "";
row.getCell("N").value = "";
row.getCell("T").value = "https://example.com/novo-link-da-planilha";
const aliasRow = sheet.getRows(2, sheet.rowCount - 1)!.find(item => item.getCell("A").value === 22)!;
aliasRow.getCell("D").value = "  Texto novo para todos os espelhos.\nSem alterações!  ";
const freshRow = sheet.addRow(sheet.getRow(2).values);
const freshId = Math.max(...Object.keys(originalImport.snapshot.rows).map(Number)) + 1;
freshRow.getCell("A").value = freshId;
freshRow.getCell("C").value = "Serviço novo — conteúdo literal";
freshRow.getCell("D").value = "  Descrição nova.\nExatamente como na fonte!  ";
const analysis = await analyzeWorkbook(Buffer.from(await source.xlsx.writeBuffer()));
const imported = analysis.snapshot.services.find((service) => service.sourceRow === 138)!;
assert.equal(imported.url, "https://example.com/novo-link-da-planilha");
assert.equal(imported.steps![0], "  1. BA.GOV.BR / 1Doc.\n2. Nao se aplica!  ");
assert.equal(servicePageCopy(imported).cost, "Não se aplica (R$ 0,00)");
assert.equal(contactForService(imported).phone, "");
assert.equal(contactForService(imported).email, undefined);
assert.equal(imported.legislation, undefined);
const importedHtml = renderToStaticMarkup(<ServiceDetail slug={imported.slug!} initialService={imported} />);
assert.match(importedHtml, /https:\/\/example\.com\/novo-link-da-planilha/);
assert.match(importedHtml, /Nao se aplica!/);
for (const alias of analysis.snapshot.services.filter((service) => service.sourceRow === 22)) {
  assert.deepEqual(alias.workbookCells, analysis.snapshot.rows["22"].cells);
  assert.equal(alias.summary, "  Texto novo para todos os espelhos.\nSem alterações!  ");
}
const fresh = analysis.snapshot.services.find(service => service.sourceRow === freshId)!;
assert.equal(fresh.summary, "  Descrição nova.\nExatamente como na fonte!  ");
assert.equal(fresh.detailLayout, "rich");
const freshHtml = renderToStaticMarkup(<ServiceDetail slug={fresh.slug!} initialService={fresh} />);
assert.match(freshHtml, /class="service-steps"/);
assert.match(freshHtml, /<section id="documentos"><h2>Documentos necessários<\/h2><ul>/);
console.log(JSON.stringify({ activeWorkbookRows: expectedIds.length, matchedPages: matched.length, comparisons,
  extraPages: services.filter((service) => !service.workbookCells).length, importRegression: "passed" }));
