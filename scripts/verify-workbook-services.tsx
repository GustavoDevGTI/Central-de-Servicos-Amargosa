import assert from "node:assert/strict";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { services, excludedSpreadsheetServiceRows } from "../app/service-catalog";
import { servicePageCopy } from "../app/service-page-copy";
import { WorkbookServiceContent } from "../app/workbook-service-content";
import { ServiceDetail } from "../app/internal-portal";
import { contactForService } from "../app/service-contacts";
import workbook from "../app/workbook-service-data.json";
import { applyWorkbookCells } from "../app/workbook-service";

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
const rendered: Record<string, string> = {};
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
  rendered[service.id] = renderToStaticMarkup(<WorkbookServiceContent service={displayed} />);
  fullPages[service.id] = renderToStaticMarkup(<ServiceDetail slug={displayed.slug!} />);
}
fs.writeFileSync(`${output}/rendered-fields.json`, JSON.stringify(rendered));
fs.writeFileSync(`${output}/rendered-pages.json`, JSON.stringify(fullPages));
fs.writeFileSync(`${output}/catalog-after.json`, JSON.stringify(services));

// Literal mapping must also preserve new links, placeholders and whitespace.
const fixture = services.find((service) => service.sourceRow === 138)!;
const changed = applyWorkbookCells(fixture, {
  ...fixture.workbookCells!,
  "Como solicitar - etapas": "  1. BA.GOV.BR / 1Doc.\n2. Nao se aplica!  ",
  "Link de acesso": "https://example.com/novo-link-da-planilha",
  "Telefone": "", "E-mail do setor/unidade": "",
}, 138);
assert.equal(changed.url, "https://example.com/novo-link-da-planilha");
assert.equal(changed.steps![0], "  1. BA.GOV.BR / 1Doc.\n2. Nao se aplica!  ");
assert.equal(contactForService(changed).phone, "");
assert.equal(contactForService(changed).email, undefined);
assert.equal(changed.legislation, undefined);
console.log(JSON.stringify({ activeWorkbookRows: expectedIds.length, matchedPages: matched.length, comparisons,
  extraPages: services.filter((service) => !service.workbookCells).length, literalMappingRegression: "passed" }));
