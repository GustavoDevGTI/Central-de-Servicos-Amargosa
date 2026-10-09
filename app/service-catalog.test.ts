import assert from "node:assert/strict";
import test from "node:test";
import { excludedSpreadsheetServiceRows, services } from "./service-catalog.ts";
import { contactForService } from "./service-contacts.ts";
import { servicePageCopy } from "./service-page-copy.ts";
import workbook from "./workbook-service-data.json" with { type: "json" };

test("every active workbook row is represented; excluded rows remain absent", () => {
  const rows = new Set(services.filter((service) => service.workbookCells).map((service) => service.sourceRow));
  for (const id of Object.keys(workbook.rows).map(Number)) {
    assert.equal(rows.has(id), !excludedSpreadsheetServiceRows.has(id), `Workbook ID ${id}`);
  }
});

test("all mapped pages use literal workbook text, including placeholders and links", () => {
  for (const service of services.filter((entry) => entry.workbookCells)) {
    const row = workbook.rows[String(service.sourceRow) as keyof typeof workbook.rows].cells;
    const rendered = servicePageCopy(service);
    assert.equal(rendered.title, row["Nome do serviço consolidado"], service.id);
    assert.equal(rendered.summary, row["O que é"], service.id);
    assert.equal(rendered.eligibility, row["Quem pode solicitar2"], service.id);
    assert.deepEqual(rendered.steps, row["Como solicitar - etapas"] ? [row["Como solicitar - etapas"]] : [], service.id);
    assert.equal(rendered.whereWhen, row["Onde e quando solicitar2"], service.id);
    assert.equal(rendered.cost, row.Custo, service.id);
    assert.equal(rendered.duration, row.Prazo, service.id);
    assert.equal(rendered.url, row["Link de acesso"], service.id);
    assert.equal(rendered.department, row["Setor/Unidade responsável no SEI"], service.id);
    assert.equal(rendered.legislation, undefined, service.id);
    assert.equal(rendered.whereWhenItems, undefined, service.id);
    const contact = contactForService(rendered);
    assert.equal(contact.phone, row.Telefone, service.id);
    assert.equal(contact.email || "", row["E-mail do setor/unidade"], service.id);
    assert.equal(contact.address, "", service.id);
  }
});

test("environmental licensing never adds studies, inspection or SEAMA contacts", () => {
  const service = services.find((entry) => entry.id === "1doc-solicitacao-de-licenca-ambiental")!;
  assert.equal(service.sourceRow, 138);
  assert.match(service.steps![0], /Central de Serviços \/ 1Doc/);
  assert.doesNotMatch(service.steps![0], /vistoria|estudos/i);
  assert.equal(contactForService(service).email, "A preencher");
  assert.equal(service.contactOverride?.extension, "");
});

test("legacy numbers do not associate unrelated services with workbook rows", () => {
  for (const id of ["1doc-camara-de-vereadores", "1doc-concurso", "1doc-convenios-diversos", "1doc-isencao-de-iptu", "1doc-isencao-de-taxas", "1doc-outros-orgaos-publicos-e-ongs", "1doc-requerimento-gabinete-seafi", "1doc-solicitacoes-para-eventos-esportivos-caminhadas-carreatas-e-etc"]) {
    const service = services.find((entry) => entry.id === id);
    assert.ok(service, `Exception must remain published: ${id}`);
    assert.equal(service.workbookCells, undefined, id);
  }
});
