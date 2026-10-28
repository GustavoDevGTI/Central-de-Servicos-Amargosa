import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { services as builtInServices, excludedSpreadsheetServiceRows, type Service } from "../app/service-catalog";
import { applyWorkbookCells } from "../app/workbook-service";
import spreadsheetServiceData from "../app/spreadsheet-service-data.json" with { type: "json" };
import { searchSlug } from "../app/search-url";
import { redExclusionMarker } from "./workbook-exclusion";
import { compareServiceContent } from "./service-editor";
import type { CatalogChange, CatalogReport, CatalogSnapshot } from "./catalog-db";

export const CATALOG_SHEET = "Catálogo consolidado";
export const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024;

const knownColumns = [
  "ID", "Público", "Nome do serviço consolidado", "O que é", "Quem pode solicitar2",
  "Como solicitar - etapas", "Onde e quando solicitar2", "Documentos obrigatórios",
  "Documentos opcionais", "Custo", "Prazo", "Setor/Unidade responsável no SEI",
  "E-mail do setor/unidade", "Telefone", "Ramal", "Informações da Central até aqui.",
  "Secretaria responsável", "É digital?", "Plataforma", "Link de acesso",
  "Situação e status", "Serviços de origem agrupados", "Critério da informação",
  "Categoria", "Documentação necessária",
];
const knownColumnSet = new Set(knownColumns);
const existingRows = new Map<number, string>();
for (const [id, item] of Object.entries(spreadsheetServiceData.existing)) {
  const row = (item as { sourceRow?: number }).sourceRow;
  if (row && !existingRows.has(row)) existingRows.set(row, id);
}
const rowByExistingId = new Map([
  ...Object.entries(spreadsheetServiceData.existing).map(([id, item]) => [id, item.sourceRow] as const),
  ...spreadsheetServiceData.created.map((item) => [item.id, item.sourceRow] as const),
]);

const textOf = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return textOf(value.result as ExcelJS.CellValue);
  }
  return String(value);
};

const value = (cells: Record<string, string>, name: string) => cells[name] || "";

function mapService(cells: Record<string, string>, sourceRow: number, base: Service | undefined, usedSlugs: Set<string>): Service {
  const title = value(cells, "Nome do serviço consolidado");
  const rowId = Number(value(cells, "ID"));
  const originalSlug = base?.slug;
  let slug = originalSlug || searchSlug(title) || `servico-${rowId}`;
  if (!originalSlug && usedSlugs.has(slug)) slug = `${slug}-${rowId}`;
  usedSlugs.add(slug);
  return applyWorkbookCells({
    ...base,
    id: base?.id || `planilha-${rowId}`,
    slug,
    title,
    category: "",
    department: "",
    destination: "",
    url: "",
    publishedFromWorkbook: true,
  }, cells, sourceRow);
}

export async function analyzeWorkbook(bytes: Buffer, previous?: CatalogSnapshot): Promise<{
  sha256: string; snapshot: CatalogSnapshot; report: CatalogReport;
}> {
  if (bytes.length === 0 || bytes.length > MAX_WORKBOOK_BYTES || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("Envie um arquivo XLSX válido de até 10 MB.");
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as never);
  const sheet = workbook.getWorksheet(CATALOG_SHEET);
  if (!sheet) throw new Error(`A aba ${CATALOG_SHEET} não foi encontrada.`);
  if (sheet.rowCount > 2000 || sheet.columnCount > 80) throw new Error("A planilha excede os limites do catálogo.");
  const headers: string[] = [];
  const index = new Map<string, number>();
  for (let column = 1; column <= sheet.columnCount; column++) {
    const name = textOf(sheet.getRow(1).getCell(column).value).trim();
    if (!name) continue;
    if (index.has(name)) throw new Error(`Coluna repetida: ${name}`);
    index.set(name, column);
    headers.push(name);
  }
  for (const required of ["ID", "Público", "Nome do serviço consolidado"]) {
    if (!index.has(required)) throw new Error(`Coluna obrigatória ausente: ${required}`);
  }
  const columnsAdded = headers.filter((header) => !knownColumnSet.has(header));
  const blockers = columnsAdded.map((name) => `Mapear a nova coluna “${name}” antes de publicar.`);
  const rows: CatalogSnapshot["rows"] = {};
  const hasRedFill = redExclusionMarker(workbook);
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const rawId = row.getCell(index.get("ID")!).value;
    if (rawId == null || textOf(rawId).trim() === "") continue;
    if (typeof rawId !== "number" || !Number.isSafeInteger(rawId) || rawId <= 0 || rows[String(rawId)]) {
      throw new Error(`ID inválido ou repetido na linha ${rowNumber}.`);
    }
    const titleCell = row.getCell(index.get("Nome do serviço consolidado")!);
    if (!textOf(titleCell.value).trim()) throw new Error(`Título ausente na linha ${rowNumber}.`);
    const cells: Record<string, string> = {};
    for (const [header, column] of index) cells[header] = textOf(row.getCell(column).value);
    const old = previous?.rows[String(rawId)];
    // The ID/title identify the row's exclusion color. Other columns contain
    // red editorial notes even on active services in the official workbook.
    const markedRed = hasRedFill(row.getCell(index.get("ID")!)) || hasRedFill(titleCell);
    const legacyExcluded = old ? old.excluded && !old.removed && !old.markedRed : excludedSpreadsheetServiceRows.has(rawId);
    const excluded = markedRed || legacyExcluded;
    rows[String(rawId)] = { excelRow: rowNumber, cells, excluded, markedRed };
  }
  if (Object.keys(rows).length < 1 && !previous) throw new Error("A planilha não contém serviços.");
  const previousRows = previous?.rows || {};
  for (const [id, old] of Object.entries(previousRows)) {
    // Archive the original cells and ID so repeated imports stay inactive and
    // reintroducing this ID restores every page with its original URL.
    if (!rows[id]) rows[id] = { ...old, excluded: true, removed: true };
  }
  const initialServices = previous?.services || builtInServices;
  const byRow = new Map<number, Service>();
  for (const service of initialServices) {
    const row = rowByExistingId.get(service.id) ||
      (service.id.startsWith("planilha-") ? service.sourceRow : undefined);
    if (row) byRow.set(row, service);
  }
  const usedSlugs = new Set(initialServices.map((service) => service.slug).filter((slug): slug is string => Boolean(slug)));
  const services = initialServices.map((service) => ({ ...service }));
  const positionById = new Map(services.map((service, position) => [service.id, position]));
  for (const [id, row] of Object.entries(rows)) {
    const rowId = Number(id);
    const base = byRow.get(rowId);
    const service = mapService(row.cells, rowId, base, usedSlugs);
    service.inactive = row.excluded;
    const position = positionById.get(service.id);
    if (position === undefined) {
      positionById.set(service.id, services.length);
      services.push(service);
    } else services[position] = service;
  }
  // A consolidated row can have multiple existing public URLs. Update every
  // alias, rather than leaving all but the last one with an older snapshot.
  for (let index = 0; index < services.length; index++) {
    const service = services[index];
    const sourceRow = rowByExistingId.get(service.id) || (service.publishedFromWorkbook ? service.sourceRow : undefined);
    const row = sourceRow && rows[String(sourceRow)];
    if (row) services[index] = { ...applyWorkbookCells(service, row.cells, sourceRow), inactive: row.excluded };
  }
  const changes: CatalogChange[] = [];
  for (const [id, row] of Object.entries(rows)) {
    const old = previousRows[id];
    const base = byRow.get(Number(id));
    const serviceId = base?.id || `planilha-${id}`;
    const title = row.cells["Nome do serviço consolidado"];
    if (!old && !base && !row.excluded) changes.push({ serviceId, serviceTitle: title, kind: "created", sourceRow: Number(id) });
    if (!old && !base && row.markedRed && !excludedSpreadsheetServiceRows.has(Number(id))) {
      changes.push({ serviceId, serviceTitle: title, kind: "deactivated", sourceRow: Number(id), column: "Marcação de exclusão",
        before: null, after: "Linha vermelha; página oculta e preservada para retorno" });
    }
    if (old && ((row.removed && !old.removed) || old.excluded !== row.excluded)) {
      changes.push({ serviceId, serviceTitle: title, kind: row.excluded ? "deactivated" : "reactivated", sourceRow: Number(id),
        ...(row.removed || old.removed ? { column: "Presença na planilha", before: old.removed ? "Linha ausente; página oculta" : "Linha presente", after: row.removed ? "Linha removida; página oculta e preservada para retorno" : row.excluded ? "Linha reincluída em vermelho; página permanece oculta" : "Linha reincluída; página reativada" } :
          row.markedRed || old.markedRed ? { column: "Marcação de exclusão", before: old.markedRed ? "Linha vermelha; página oculta" : "Linha sem marcação vermelha", after: row.markedRed ? "Linha vermelha; página oculta e preservada para retorno" : "Marcação vermelha removida; página reativada" } : {}),
      });
    }
    if (!old && base && row.excluded && !base.inactive) changes.push({ serviceId, serviceTitle: title, kind: "deactivated", sourceRow: Number(id) });
    if (old) {
      for (const header of headers) {
        const before = old.cells[header] || "";
        const after = row.cells[header] || "";
        if (before !== after) changes.push({ serviceId, serviceTitle: title, kind: "updated", column: header, before, after, sourceRow: Number(id) });
      }
    } else if (base && !row.excluded) {
      changes.push({ serviceId, serviceTitle: title, kind: "updated", column: "Importação inicial", before: null, after: title, sourceRow: Number(id) });
    }
  }
  for (const name of columnsAdded) changes.push({ serviceId: "—", serviceTitle: "Estrutura da planilha", kind: "column", column: name });
  const report: CatalogReport = {
    created: changes.filter((change) => change.kind === "created").length,
    updated: new Set(changes.filter((change) => change.kind === "updated").map((change) => change.serviceId)).size,
    deactivated: changes.filter((change) => change.kind === "deactivated").length,
    reactivated: changes.filter((change) => change.kind === "reactivated").length,
    columnsAdded, changes, blockers,
  };
  return { sha256: createHash("sha256").update(bytes).digest("hex"), snapshot: { services, rows, headers }, report };
}

/** Audit a restoration against the currently published workbook. */
export function compareCatalogSnapshots(previous: CatalogSnapshot, next: CatalogSnapshot): CatalogReport {
  if (previous.mode === "direct" || next.mode === "direct") return compareServiceContent(previous, next);
  const changes: CatalogChange[] = [];
  for (const id of new Set([...Object.keys(previous.rows), ...Object.keys(next.rows)])) {
    const before = previous.rows[id];
    const after = next.rows[id];
    const service = next.services.find((item) => item.sourceRow === Number(id)) ||
      previous.services.find((item) => item.sourceRow === Number(id));
    const serviceId = service?.id || `planilha-${id}`;
    const serviceTitle = after?.cells["Nome do serviço consolidado"] || before?.cells["Nome do serviço consolidado"] || serviceId;
    if (!before && after && !after.excluded) changes.push({ serviceId, serviceTitle, kind: "created", sourceRow: Number(id) });
    if (before && !after && !before.excluded) changes.push({ serviceId, serviceTitle, kind: "deactivated", sourceRow: Number(id) });
    if (before && after && ((after.removed && !before.removed) || before.excluded !== after.excluded)) {
      changes.push({ serviceId, serviceTitle, kind: after.excluded ? "deactivated" : "reactivated", sourceRow: Number(id) });
    }
    if (before && after) for (const column of new Set([...Object.keys(before.cells), ...Object.keys(after.cells)])) {
      const oldValue = before.cells[column] || "";
      const newValue = after.cells[column] || "";
      if (oldValue !== newValue) changes.push({ serviceId, serviceTitle, kind: "updated", column, before: oldValue, after: newValue, sourceRow: Number(id) });
    }
  }
  const columnsAdded = next.headers.filter((column) => !previous.headers.includes(column));
  for (const column of columnsAdded) changes.push({ serviceId: "—", serviceTitle: "Estrutura da planilha", kind: "column", column });
  return {
    created: changes.filter((change) => change.kind === "created").length,
    updated: new Set(changes.filter((change) => change.kind === "updated").map((change) => change.serviceId)).size,
    deactivated: changes.filter((change) => change.kind === "deactivated").length,
    reactivated: changes.filter((change) => change.kind === "reactivated").length,
    columnsAdded, changes, blockers: [],
  };
}
