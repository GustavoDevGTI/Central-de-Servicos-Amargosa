import { services as builtInServices } from "../app/service-catalog";
import { serviceEditFields, serviceFieldReportLabel, type ServiceEditValues, type ServiceEditField } from "../app/service-edit-fields";
import { serviceEditValues, serviceRecordSourceRow } from "../app/direct-service-content";
import { servicePageCopy } from "../app/service-page-copy";
import { contactForService } from "../app/service-contacts";
import { serviceWhereWhen, sameInPersonServiceOffice } from "../app/service-where-when";
import { snapshotServices } from "./catalog-preview";
import type { CatalogSnapshot, CatalogReport, CatalogChange } from "./catalog-db";
import workbook from "../app/workbook-service-data.json";
import { isBaGovUrl, serviceRequestNoticeText } from "../app/service-request-system";
import { serviceWhereWhenParts } from "../app/workbook-where-when";
import { audienceSelection } from "../app/service-audiences";
import { attendanceFieldKeys } from "../app/service-attendance";
import { collectionScheduleLimit, hasCollectionSchedule, readCollectionSchedule, collectionScheduleDifferences } from "../app/collection-schedule-data";

export class ServiceEditorError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function initialEditorSnapshot(): CatalogSnapshot {
  return {
    services: structuredClone(builtInServices),
    rows: Object.fromEntries(Object.entries(workbook.rows).map(([id, row]) => [id, { excelRow: row.sheetRow, cells: { ...row.cells }, excluded: !builtInServices.some((s) => s.sourceRow === Number(id)) }])),
    headers: Object.keys(Object.values(workbook.rows)[0].cells),
  };
}

export function validateServicePatch(input: unknown): Partial<ServiceEditValues> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ServiceEditorError("Campos inválidos.");
  const allowed = new Set<string>(serviceEditFields.map((f) => f.key));
  const entries = Object.entries(input);
  if (entries.length > allowed.size) throw new ServiceEditorError("Campos inválidos.");
  for (const [key, value] of entries) {
    if (!allowed.has(key)) throw new ServiceEditorError("Este campo é fixo ou não pode ser editado.");
    if (typeof value !== "string" || value.length > (key === "title" ? 300 : key === "collectionSchedule" ? collectionScheduleLimit : 20000) || value.includes("\0")) throw new ServiceEditorError("Texto inválido ou acima do limite permitido.");
    if (key === "collectionSchedule" && value) {
      try { readCollectionSchedule(value); } catch (reason) { throw new ServiceEditorError(reason instanceof Error ? reason.message : "Cronograma inválido."); }
    }
    if (key === "title" && !value.trim()) throw new ServiceEditorError("Informe o nome do serviço.");
    if (key === "audience" && !audienceSelection(value).valid) throw new ServiceEditorError("Selecione apenas os públicos disponíveis na Central, sem repetições.");
    const field = serviceEditFields.find((item) => item.key === key)!;
    if ("options" in field && !(field.options as readonly string[]).includes(value)) throw new ServiceEditorError(`Selecione uma opção válida para ${field.label}.`);
    if ("multiple" in field && value && (value.split("\n").some((item) => !(field.multiple as readonly string[]).includes(item)) || new Set(value.split("\n")).size !== value.split("\n").length)) throw new ServiceEditorError("Selecione modalidades de atendimento válidas.");
    if ("url" in field && value) {
      if (value.length > 2048) throw new ServiceEditorError("Endereço acima do limite permitido.");
      try { const url = new URL(value); if (!/^https?:\/\//i.test(value) || !/^https?:$/.test(url.protocol) || url.username || url.password || value.trim() !== value || /\s/.test(value) || value.includes("\\")) throw new Error(); }
      catch { throw new ServiceEditorError(`Informe um endereço HTTP ou HTTPS completo para ${field.label}.`); }
      if (key === "baGovUrl" && !isBaGovUrl(value)) throw new ServiceEditorError("Informe o endereço oficial do serviço no BA.GOV.");
    }
  }
  return Object.fromEntries(entries) as Partial<ServiceEditValues>;
}

function reportFor(changes: CatalogChange[]): CatalogReport {
  const count = (kind: CatalogChange["kind"]) => new Set(changes.filter((c) => c.kind === kind).map((c) => c.sourceRow ? `row-${c.sourceRow}` : c.serviceId)).size;
  return { created: 0, updated: count("updated"), deactivated: count("deactivated"), reactivated: count("reactivated"), columnsAdded: [], blockers: [], changes };
}
function fieldChanges(key: ServiceEditField, before: string, after: string) {
  return key === "collectionSchedule" ? collectionScheduleDifferences(before, after) : [{ column: serviceFieldReportLabel(key), before, after }];
}

export function editService(snapshot: CatalogSnapshot, serviceId: string, input: unknown) {
  const patch = validateServicePatch(input);
  const current = snapshotServices(snapshot);
  const selected = current.find((s) => s.id === serviceId);
  if (!selected) throw new ServiceEditorError("Serviço não encontrado.", 404);
  const before = serviceEditValues(selected);
  for (const key of Object.keys(patch)) {
    const field = serviceEditFields.find((item) => item.key === key)!;
    if ("special" in field && !hasCollectionSchedule(selected) && patch[field.key] !== before[field.key]) throw new ServiceEditorError("Este campo especial não pertence a este serviço.");
    if (key === "collectionSchedule" && hasCollectionSchedule(selected) && !patch.collectionSchedule) throw new ServiceEditorError("Cronograma inválido. Use uma lista vazia para remover os locais.");
  }
  const selectedRow = serviceRecordSourceRow(selected);
  const changed = (Object.keys(patch) as ServiceEditField[]).filter((key) => patch[key] !== before[key]);
  const changes: CatalogChange[] = changed.flatMap((key) => fieldChanges(key, before[key], patch[key]!).map((change) => ({ serviceId, serviceTitle: patch.title ?? selected.title, kind: key === "status" && patch.status === "Inativo" ? "deactivated" as const : key === "status" && before.status === "Inativo" ? "reactivated" as const : "updated" as const, ...change, sourceRow: selectedRow })));
  const next = structuredClone(snapshot);
  if (!changes.length) return { snapshot: next, report: reportFor([]), affectedIds: [] as string[] };
  next.mode = "direct";
  const affectedIds: string[] = [];
  next.services = current.map((service) => {
    const sameRecord = selectedRow !== undefined ? serviceRecordSourceRow(service) === selectedRow : service.id === serviceId;
    if (!sameRecord) return service;
    affectedIds.push(service.id);
    const base = servicePageCopy(service);
    const editedFields = { ...base.directEdit?.fields, ...Object.fromEntries(changed.map((key) => [key, patch[key]])) };
    // Freeze both sets on the first attendance edit so switching the choice never
    // recomputes or drops the other unit's original contact information.
    if (changed.some((key) => (attendanceFieldKeys as readonly string[]).includes(key))) {
      const defaults = before;
      for (const key of attendanceFieldKeys) if (editedFields[key] === undefined) editedFields[key] = defaults[key];
      editedFields.additional ??= defaults.additional;
    }
    editedFields.attendanceModes ??= serviceEditValues(base).attendanceModes;
    editedFields.baGovUrl ??= serviceEditValues(base).baGovUrl;
    if (base.directEdit && base.directEdit.schema !== "carta-1-2026") {
      const legacy = serviceEditValues(base);
      if (!changed.includes("requiredDocuments") && (base.directEdit.fields.requiredDocuments !== undefined || base.directEdit.fields.optionalDocuments !== undefined)) editedFields.requiredDocuments = legacy.requiredDocuments;
      if (!changed.includes("additional")) editedFields.additional = legacy.additional;
      if (!changed.includes("phone") && base.directEdit.fields.phone !== undefined) editedFields.phone = legacy.phone;
    }
    const contact = contactForService(base);
    const location = serviceWhereWhen(base, contact);
    const mergeContact = Boolean(base.whereWhen) && location.presencial && (!base.whereWhenItems?.length || location.digital) && sameInPersonServiceOffice(location.local, contact.name) && !(base.workbookCells && base.id === "1doc-limpeza-publica");
    return {
      ...base,
      detailLayout: base.detailLayout ?? (base.id.startsWith("planilha-") || (base.notice && base.documents?.length && base.steps?.length) ? "rich" : "standard"),
      directEdit: {
        schema: "carta-1-2026",
        fields: editedFields,
        layout: { ...(base.directEdit?.layout || { mergeContact, whereWhen: Boolean(base.whereWhen), digital: location.digital, presencial: location.presencial, manualHref: base.requestSystem === "sei" ? "/manual-sei" : mergeContact ? "#onde-quando" : "#canais" }), showManual: base.directEdit?.layout.showManual ?? Boolean(base.url && !isBaGovUrl(base.url)), requestNoticeText: base.directEdit?.layout.requestNoticeText ?? serviceRequestNoticeText(base), repeatedNoticeText: base.directEdit?.layout.repeatedNoticeText ?? serviceRequestNoticeText(base, true), ...(base.workbookCells ? { whereWhenParts: serviceWhereWhenParts(base) } : {}) },
      },
    };
  });
  return { snapshot: next, report: reportFor(changes), affectedIds };
}

/** Compare actual editorial values, including services without a spreadsheet ID. */
export function compareServiceContent(previous: CatalogSnapshot, next: CatalogSnapshot): CatalogReport {
  const before = new Map(snapshotServices(previous).map((s) => [s.id, s]));
  const changes: CatalogChange[] = [];
  const seenRows = new Set<number>();
  for (const service of snapshotServices(next)) {
    const old = before.get(service.id);
    const sourceRow = serviceRecordSourceRow(service);
    if (!old || (sourceRow && seenRows.has(sourceRow))) continue;
    if (sourceRow) seenRows.add(sourceRow);
    const oldFields = serviceEditValues(old), fields = serviceEditValues(service);
    for (const field of serviceEditFields) if (oldFields[field.key] !== fields[field.key]) for (const change of fieldChanges(field.key, oldFields[field.key], fields[field.key])) changes.push({ serviceId: service.id, serviceTitle: service.title, kind: field.key === "status" && fields.status === "Inativo" ? "deactivated" : field.key === "status" && oldFields.status === "Inativo" ? "reactivated" : "updated", ...change, sourceRow });
  }
  return reportFor(changes);
}

/** Restore editable content, access links and status while retaining page IDs, URLs and structure. */
export function restoreServiceContent(current: CatalogSnapshot, target: CatalogSnapshot): CatalogSnapshot {
  let result = structuredClone(current);
  const targetById = new Map(snapshotServices(target).map((s) => [s.id, s]));
  const seen = new Set<number>();
  for (const service of snapshotServices(current)) {
    const sourceRow = serviceRecordSourceRow(service);
    if (sourceRow && seen.has(sourceRow)) continue;
    if (sourceRow) seen.add(sourceRow);
    const wanted = targetById.get(service.id);
    if (wanted) {
      const before = serviceEditValues(service), after = serviceEditValues(wanted);
      const patch = Object.fromEntries(serviceEditFields.filter((f) => (!("special" in f) || hasCollectionSchedule(service)) && before[f.key] !== after[f.key]).map((f) => [f.key, after[f.key]]));
      result = editService(result, service.id, patch).snapshot;
      // Restore the original fallback presentation when an extra information
      // field had no editorial override in the chosen historical version.
      result.services = result.services.map((entry) => {
        if (!entry.directEdit || !(sourceRow !== undefined ? serviceRecordSourceRow(entry) === sourceRow : entry.id === service.id)) return entry;
        const original = targetById.get(entry.id);
        const fields = { ...entry.directEdit.fields };
        for (const field of serviceEditFields) {
          if (!("column" in field) && !["status", "additional", "attendanceModes", "attendanceUnit", "attendancePhone", "attendanceWhatsapp", "attendanceEmail", "responsibleAddress", "responsibleHours"].includes(field.key) && original?.directEdit?.fields[field.key] === undefined) delete fields[field.key];
        }
        if (!entry.workbookCells && original && original.directEdit?.fields.platform === undefined) {
          delete fields.platform;
          return { ...entry, destination: original.destination, directEdit: { ...entry.directEdit, fields } };
        }
        return { ...entry, directEdit: { ...entry.directEdit, fields } };
      });
    }
  }
  result.mode = "direct";
  return result;
}
