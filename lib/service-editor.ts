import { services as builtInServices } from "../app/service-catalog";
import { serviceEditFields, type ServiceEditValues, type ServiceEditField } from "../app/service-edit-fields";
import { serviceEditValues } from "../app/direct-service-content";
import { servicePageCopy } from "../app/service-page-copy";
import { contactForService } from "../app/service-contacts";
import { serviceWhereWhen, sameInPersonServiceOffice } from "../app/service-where-when";
import { snapshotServices } from "./catalog-preview";
import type { CatalogSnapshot, CatalogReport, CatalogChange } from "./catalog-db";
import workbook from "../app/workbook-service-data.json";

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
    if (typeof value !== "string" || value.length > (key === "title" ? 300 : 20000) || value.includes("\0")) throw new ServiceEditorError("Texto inválido ou acima do limite permitido.");
    if (key === "title" && !value.trim()) throw new ServiceEditorError("Informe o nome do serviço.");
  }
  return Object.fromEntries(entries) as Partial<ServiceEditValues>;
}

function reportFor(changes: CatalogChange[]): CatalogReport {
  return { created: 0, updated: new Set(changes.map((c) => c.sourceRow ? `row-${c.sourceRow}` : c.serviceId)).size, deactivated: 0, reactivated: 0, columnsAdded: [], blockers: [], changes };
}

export function editService(snapshot: CatalogSnapshot, serviceId: string, input: unknown) {
  const patch = validateServicePatch(input);
  const current = snapshotServices(snapshot);
  const selected = current.find((s) => s.id === serviceId && !s.inactive);
  if (!selected) throw new ServiceEditorError("Serviço não encontrado ou oculto.", 404);
  const before = serviceEditValues(selected);
  const changed = (Object.keys(patch) as ServiceEditField[]).filter((key) => patch[key] !== before[key]);
  const changes: CatalogChange[] = changed.map((key) => ({ serviceId, serviceTitle: patch.title ?? selected.title, kind: "updated", column: serviceEditFields.find((f) => f.key === key)!.label, before: before[key], after: patch[key], sourceRow: selected.sourceRow }));
  const next = structuredClone(snapshot);
  if (!changes.length) return { snapshot: next, report: reportFor([]), affectedIds: [] as string[] };
  next.mode = "direct";
  const affectedIds: string[] = [];
  next.services = current.map((service) => {
    const sameRecord = selected.sourceRow !== undefined ? service.sourceRow === selected.sourceRow : service.id === serviceId;
    if (!sameRecord) return service;
    affectedIds.push(service.id);
    const base = servicePageCopy(service);
    const editedFields = { ...base.directEdit?.fields, ...Object.fromEntries(changed.map((key) => [key, patch[key]])) };
    if (changed.includes("optionalDocuments") && editedFields.requiredDocuments === undefined) editedFields.requiredDocuments = serviceEditValues(base).requiredDocuments;
    const contact = contactForService(base);
    const location = serviceWhereWhen(base, contact);
    const mergeContact = Boolean(base.whereWhen) && location.presencial && (!base.whereWhenItems?.length || location.digital) && sameInPersonServiceOffice(location.local, contact.name) && !(base.workbookCells && base.id === "1doc-limpeza-publica");
    return {
      ...base,
      detailLayout: base.detailLayout ?? (base.id.startsWith("planilha-") || (base.notice && base.documents?.length && base.steps?.length) ? "rich" : "standard"),
      directEdit: {
        fields: editedFields,
        layout: base.directEdit?.layout || { mergeContact, whereWhen: Boolean(base.whereWhen), digital: location.digital, presencial: location.presencial, manualHref: base.requestSystem === "sei" ? "/manual-sei" : mergeContact ? "#onde-quando" : "#canais" },
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
    if (!old || (service.sourceRow && seenRows.has(service.sourceRow))) continue;
    if (service.sourceRow) seenRows.add(service.sourceRow);
    const oldFields = serviceEditValues(old), fields = serviceEditValues(service);
    for (const field of serviceEditFields) if (oldFields[field.key] !== fields[field.key]) changes.push({ serviceId: service.id, serviceTitle: service.title, kind: "updated", column: field.label, before: oldFields[field.key], after: fields[field.key], sourceRow: service.sourceRow });
  }
  return reportFor(changes);
}

/** Restore editable content while retaining current URLs, actions and structure. */
export function restoreServiceContent(current: CatalogSnapshot, target: CatalogSnapshot): CatalogSnapshot {
  let result = structuredClone(current);
  const targetById = new Map(snapshotServices(target).map((s) => [s.id, s]));
  const seen = new Set<number>();
  for (const service of snapshotServices(current)) {
    if (service.inactive || (service.sourceRow && seen.has(service.sourceRow))) continue;
    if (service.sourceRow) seen.add(service.sourceRow);
    const wanted = targetById.get(service.id);
    if (wanted) {
      const before = serviceEditValues(service), after = serviceEditValues(wanted);
      const patch = Object.fromEntries(serviceEditFields.filter((f) => before[f.key] !== after[f.key]).map((f) => [f.key, after[f.key]]));
      result = editService(result, service.id, patch).snapshot;
      // Restore the original fallback presentation when an extra information
      // field had no editorial override in the chosen historical version.
      result.services = result.services.map((entry) => {
        if (!entry.directEdit || !(service.sourceRow !== undefined ? entry.sourceRow === service.sourceRow : entry.id === service.id)) return entry;
        const original = targetById.get(entry.id);
        const fields = { ...entry.directEdit.fields };
        for (const field of serviceEditFields) {
          if (!("column" in field) && original?.directEdit?.fields[field.key] === undefined) delete fields[field.key];
        }
        return { ...entry, directEdit: { ...entry.directEdit, fields } };
      });
    }
  }
  result.mode = "direct";
  return result;
}
