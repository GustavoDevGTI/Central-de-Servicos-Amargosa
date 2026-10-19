import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { analyzeWorkbook, compareCatalogSnapshots, CATALOG_SHEET } from "./catalog-import";
import { snapshotServices } from "./catalog-preview";

const headers = ["ID", "Público", "Nome do serviço consolidado", "O que é", "Link de acesso"];
type Row = [number, string, string, string, string];
const water: Row = [1, "Cidadão", "Água", "  Texto literal.\nSem alterações!  ", "https://example.com/agua"];
const tax: Row = [22, "Cidadão", "Certidão", "Conteúdo da certidão", "https://example.com/certidao"];
const fresh: Row = [900001, "Cidadão", "Serviço novo", "Texto novo", ""];
async function workbook(rows: Row[], redId?: number) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(CATALOG_SHEET);
  sheet.addRow(headers);
  for (const values of rows) {
    const row = sheet.addRow(values);
    if (values[0] === redId) row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { theme: 5, tint: 0.3999755851924192 } as ExcelJS.Color & { tint: number } };
  }
  return Buffer.from(await book.xlsx.writeBuffer());
}

test("missing IDs archive every mirror, report deletion once and preserve the source snapshot", async () => {
  const initial = await analyzeWorkbook(await workbook([water, tax]));
  const untouched = structuredClone(initial.snapshot);
  const deleted = await analyzeWorkbook(await workbook([water]), initial.snapshot);
  assert.deepEqual(deleted.report.blockers, []);
  assert.equal(deleted.report.deactivated, 1);
  assert.equal(deleted.report.changes[0].column, "Presença na planilha");
  assert.match(deleted.report.changes[0].after!, /oculta e preservada/);
  assert.deepEqual(deleted.snapshot.rows["22"].cells, initial.snapshot.rows["22"].cells);
  assert.equal(deleted.snapshot.rows["22"].removed, true);
  const aliases = snapshotServices(deleted.snapshot).filter((service) => service.sourceRow === 22);
  assert.equal(aliases.length, 3);
  assert.ok(aliases.every((service) => service.inactive));
  assert.ok(snapshotServices(deleted.snapshot).some((service) => !service.sourceRow && !service.inactive));
  assert.deepEqual(initial.snapshot, untouched);
  const repeat = await analyzeWorkbook(await workbook([water]), deleted.snapshot);
  assert.deepEqual(repeat.report.changes, []);
  assert.ok(snapshotServices(repeat.snapshot).filter((service) => service.sourceRow === 22).every((service) => service.inactive));
  const returned: Row = [22, "Cidadão", "Certidão revisada", "  Nova descrição!\nLiteral.  ", ""];
  const reactivated = await analyzeWorkbook(await workbook([water, returned]), repeat.snapshot);
  assert.equal(reactivated.report.reactivated, 1);
  assert.equal(reactivated.report.created, 0);
  for (const before of aliases) {
    const after = snapshotServices(reactivated.snapshot).find((service) => service.id === before.id)!;
    assert.equal(after.inactive, false);
    assert.equal(after.slug, before.slug);
    assert.equal(after.title, returned[2]);
    assert.equal(after.summary, returned[3]);
    assert.equal(after.url, "");
    assert.deepEqual(after.workbookCells, reactivated.snapshot.rows["22"].cells);
  }
  assert.equal(compareCatalogSnapshots(initial.snapshot, deleted.snapshot).deactivated, 1);
  assert.equal(compareCatalogSnapshots(deleted.snapshot, initial.snapshot).reactivated, 1);
});

test("a newly imported page returns with its original ID and URL even if renamed", async () => {
  const initial = await analyzeWorkbook(await workbook([water, fresh]));
  const original = initial.snapshot.services.find((service) => service.sourceRow === fresh[0])!;
  const deleted = await analyzeWorkbook(await workbook([water]), initial.snapshot);
  const renamed = [...fresh] as Row;
  renamed[2] = "Outro título";
  const returned = await analyzeWorkbook(await workbook([water, renamed]), deleted.snapshot);
  const service = returned.snapshot.services.find((entry) => entry.id === original.id)!;
  assert.equal(returned.report.reactivated, 1);
  assert.equal(returned.report.created, 0);
  assert.equal(service.slug, original.slug);
  assert.equal(service.title, renamed[2]);
  assert.equal(service.inactive, false);
});

test("colors no longer exclude services and legacy exclusions survive migration", async () => {
  const legacy: Row = [17, "Cidadão", "Exclusão anterior", "Texto original", ""];
  const initial = await analyzeWorkbook(await workbook([water, legacy]));
  const colored = await analyzeWorkbook(await workbook([water, legacy], 1), initial.snapshot);
  assert.equal(colored.snapshot.rows["1"].excluded, false);
  assert.equal(colored.snapshot.rows["17"].excluded, true);
  assert.equal(colored.report.changes.length, 0);
  const removed = await analyzeWorkbook(await workbook([water]), colored.snapshot);
  assert.equal(removed.report.deactivated, 1);
  assert.equal(removed.snapshot.rows["17"].removed, true);
  const returned = await analyzeWorkbook(await workbook([water, legacy]), removed.snapshot);
  assert.equal(returned.snapshot.rows["17"].excluded, false);
  assert.equal(returned.report.reactivated, 1);
});

test("removing all spreadsheet rows hides the pages without losing archived content", async () => {
  const initial = await analyzeWorkbook(await workbook([water, tax]));
  const empty = await analyzeWorkbook(await workbook([]), initial.snapshot);
  assert.deepEqual(empty.report.blockers, []);
  assert.equal(empty.report.deactivated, 2);
  assert.ok(Object.values(empty.snapshot.rows).every((row) => row.removed && row.excluded));
  const again = await analyzeWorkbook(await workbook([]), empty.snapshot);
  assert.equal(again.report.changes.length, 0);
  await assert.rejects(analyzeWorkbook(await workbook([])), /não contém serviços/);
});
