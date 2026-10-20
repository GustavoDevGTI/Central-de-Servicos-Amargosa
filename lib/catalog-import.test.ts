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
type Mark = { id: number; column?: number; color?: Partial<ExcelJS.Color> & { indexed?: number }; fontOnly?: boolean };
async function workbook(rows: Row[], mark?: Mark) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(CATALOG_SHEET);
  sheet.addRow(headers);
  for (const values of rows) {
    const row = sheet.addRow(values);
    if (values[0] === mark?.id) {
      const color = mark.color || { theme: 5, tint: 0.3999755851924192 } as ExcelJS.Color & { tint: number };
      if (mark.fontOnly) row.getCell(mark.column || 3).font = { color };
      else row.getCell(mark.column || 3).fill = { type: "pattern", pattern: "solid", fgColor: color };
    }
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

test("red rows hide every mirror once, preserve cells and reactivate with the same URLs when cleared", async () => {
  const initial = await analyzeWorkbook(await workbook([water, tax]));
  const untouched = structuredClone(initial.snapshot);
  const colored = await analyzeWorkbook(await workbook([water, tax], { id: 22 }), initial.snapshot);
  assert.equal(colored.report.deactivated, 1);
  assert.deepEqual(colored.report.blockers, []);
  assert.equal(colored.snapshot.rows["22"].markedRed, true);
  assert.deepEqual(colored.snapshot.rows["22"].cells, initial.snapshot.rows["22"].cells);
  assert.match(colored.report.changes[0].after!, /Linha vermelha/);
  const mirrors = snapshotServices(colored.snapshot).filter((s) => s.sourceRow === 22);
  assert.equal(mirrors.length, 3);
  assert.ok(mirrors.every((s) => s.inactive));
  const repeated = await analyzeWorkbook(await workbook([water, tax], { id: 22 }), colored.snapshot);
  assert.deepEqual(repeated.report.changes, []);
  const cleared = await analyzeWorkbook(await workbook([water, tax]), repeated.snapshot);
  assert.equal(cleared.report.reactivated, 1);
  assert.equal(cleared.report.created, 0);
  for (const mirror of mirrors) {
    const active = snapshotServices(cleared.snapshot).find((s) => s.id === mirror.id)!;
    assert.equal(active.inactive, false);
    assert.equal(active.slug, mirror.slug);
    assert.deepEqual(active.workbookCells, mirror.workbookCells);
  }
  assert.deepEqual(initial.snapshot, untouched);
  assert.equal(compareCatalogSnapshots(initial.snapshot, colored.snapshot).deactivated, 1);
  assert.equal(compareCatalogSnapshots(colored.snapshot, cleared.snapshot).reactivated, 1);
});

test("RGB, indexed and theme red markers work in the ID or title; notes and red text do not exclude", async () => {
  const initial = await analyzeWorkbook(await workbook([water, tax]));
  for (const mark of [
    { id: 1, color: { argb: "FFFF0000" } },
    { id: 1, column: 1, color: { argb: "FF800000" } },
    { id: 1, color: { indexed: 10 } },
    { id: 1, color: { argb: "FFF4CCCC" } },
  ]) {
    const colored = await analyzeWorkbook(await workbook([water, tax], mark), initial.snapshot);
    assert.equal(colored.report.deactivated, 1);
    assert.equal(colored.snapshot.rows["1"].excluded, true);
  }
  for (const mark of [
    { id: 1, column: 4, color: { argb: "FFFF0000" } },
    { id: 1, fontOnly: true, color: { argb: "FFFF0000" } },
    { id: 1, color: { argb: "FFFFC000" } },
    { id: 1, color: { argb: "FFED7D31" } },
    { id: 1, color: { argb: "FFFCE4D6" } },
    { id: 1, color: { argb: "FF800080" } },
    { id: 1, color: { theme: 6 } },
  ]) {
    const colored = await analyzeWorkbook(await workbook([water, tax], mark), initial.snapshot);
    assert.equal(colored.snapshot.rows["1"].excluded, false);
    assert.deepEqual(colored.report.changes, []);
  }
});

test("the workbook theme is resolved instead of assuming accent2 always means red", async () => {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await workbook([water], { id: 1, color: { theme: 5 } }) as never);
  const model = book.model;
  const themes = model.themes as unknown as Record<string, string>;
  const before = themes.theme1;
  themes.theme1 = before.replace(/(<a:accent2>\s*<a:srgbClr val=")[^"]+/, "$100B050");
  assert.notEqual(themes.theme1, before);
  book.model = model;
  const green = await analyzeWorkbook(Buffer.from(await book.xlsx.writeBuffer()));
  assert.equal(green.snapshot.rows["1"].excluded, false);
});

test("a new red service is archived, then reactivated with its original ID and URL", async () => {
  const initial = await analyzeWorkbook(await workbook([water]));
  const hidden = await analyzeWorkbook(await workbook([water, fresh], { id: fresh[0] }), initial.snapshot);
  assert.equal(hidden.report.created, 0);
  assert.equal(hidden.report.deactivated, 1);
  const archived = hidden.snapshot.services.find((s) => s.sourceRow === fresh[0])!;
  assert.equal(archived.inactive, true);
  const renamed = [...fresh] as Row;
  renamed[2] = "Novo título";
  const returned = await analyzeWorkbook(await workbook([water, renamed]), hidden.snapshot);
  const active = returned.snapshot.services.find((s) => s.id === archived.id)!;
  assert.equal(returned.report.created, 0);
  assert.equal(returned.report.reactivated, 1);
  assert.equal(active.slug, archived.slug);
  assert.equal(active.title, renamed[2]);
});

test("historical exclusions survive migration and returning removed IDs remain hidden while red", async () => {
  const legacy: Row = [17, "Cidadão", "Exclusão anterior", "Texto original", ""];
  const initial = await analyzeWorkbook(await workbook([water, legacy]));
  const colored = await analyzeWorkbook(await workbook([water, legacy]), initial.snapshot);
  assert.equal(colored.snapshot.rows["17"].excluded, true);
  assert.equal(colored.report.changes.length, 0);
  const removed = await analyzeWorkbook(await workbook([water]), colored.snapshot);
  assert.equal(removed.report.deactivated, 1);
  assert.equal(removed.snapshot.rows["17"].removed, true);
  const stillHidden = await analyzeWorkbook(await workbook([water, legacy], { id: 17 }), removed.snapshot);
  assert.equal(stillHidden.snapshot.rows["17"].excluded, true);
  assert.equal(stillHidden.report.reactivated, 0);
  const returned = await analyzeWorkbook(await workbook([water, legacy]), stillHidden.snapshot);
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
