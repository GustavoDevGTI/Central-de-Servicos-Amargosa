import type { Service } from "./service-catalog";
import { privateServiceEditFields, serviceEditFields, type ServiceEditValues } from "./service-edit-fields";
import { applyWorkbookCells, workbookDocumentColumns } from "./workbook-service";
import { contactForService } from "./service-contacts";
import { serviceWhereWhen } from "./service-where-when";
import { servicePageCopy } from "./service-page-copy";
import { serviceWhereWhenParts } from "./workbook-where-when";
import { isBaGovUrl } from "./service-request-system";
import { isPendingServiceValue } from "./service-presentation";
import { audienceSelection } from "./service-audiences";
import { initialAttendanceUnitMode } from "./service-attendance";

/** Only explicit workbook links identify mirrors; inherited legacy numbers do not. */
export function serviceRecordSourceRow(service: Service) { return service.workbookCells || service.publishedFromWorkbook ? service.sourceRow : undefined; }

/** Canonical editorial values. Legacy source data is never reclassified into a second stage. */
export function serviceEditValues(original: Service): ServiceEditValues {
  const service = servicePageCopy(applyDirectServiceContent(original));
  const cells = service.workbookCells;
  const contact = contactForService(service);
  const location = serviceWhereWhen(service, contact);
  const fields = service.directEdit?.fields;
  const layout = service.directEdit?.layout;
  const rawHours = cells ? serviceWhereWhenParts(service).filter((p) => p.placement === "hours").map((p) => cells["Onde e quando solicitar2"].slice(p.start, p.end)).join("") : location.hours;
  const phone = cells?.Telefone ?? contact.phone;
  const extension = cells?.Ramal;
  const ownPhone = [phone, extension && !isPendingServiceValue(extension) ? `ramal ${extension}` : ""].filter(Boolean).join(", ");
  const fullPhone = [...new Set([ownPhone, location.phone && location.phone !== phone ? location.phone : "", location.whatsapp && location.whatsapp !== phone ? `WhatsApp: ${location.whatsapp}` : ""].filter(Boolean))].join("\n");
  const ownEmail = cells?.["E-mail do setor/unidade"] ?? contact.email ?? "";
  const digital = layout?.digital ?? location.digital, presencial = layout?.presencial ?? location.presencial;
  const intro = cells ? serviceWhereWhenParts(service).filter((p) => p.placement === "intro").map((p) => cells["Onde e quando solicitar2"].slice(p.start, p.end)).join("") : service.whereWhen;
  const base: ServiceEditValues = {
    title: service.title, popularNames: "", summary: service.summary || "", audience: service.audienceLabel || "",
    eligibility: service.eligibility || "", requiredDocuments: cells ? workbookDocumentColumns(cells).map((column) => cells[column]).join("\n") : (service.documents || []).join("\n"),
    steps: cells?.["Como solicitar - etapas"] ?? (service.steps || []).join("\n"),
    cost: service.cost || "", duration: service.duration || "",
    department: cells?.["Setor/Unidade responsável no SEI"] ?? contact.name,
    secretariat: cells?.["Secretaria responsável"] ?? contact.officeName ?? "", phone: ownPhone,
    email: ownEmail, category: service.category, platform: cells?.Plataforma ?? service.destination,
    address: location.address, hours: rawHours || "",
    attendanceUnitMode: initialAttendanceUnitMode(service, location, contact.name),
    attendanceUnit: location.local, attendancePhone: location.phone || "", attendanceWhatsapp: location.whatsapp || "", attendanceEmail: location.emails.join("\n"),
    responsibleAddress: contact.address, responsibleHours: "",
    accessUrl: service.url, baGovUrl: isBaGovUrl(service.url) ? service.url : "",
    consultation: "", waitingTime: "", stage2Description: "", stage2Documents: "",
    deliveryChannel: digital && presencial ? "Híbrido" : digital ? "Digital" : presencial ? "Presencial" : "",
    status: service.inactive ? "Inativo" : "Ativo",
    attendanceModes: [presencial && "Presencial", digital && "Site ou sistema", !isPendingServiceValue(contact.email) && "E-mail", location.whatsapp && "WhatsApp", !isPendingServiceValue(phone) && "Telefone"].filter(Boolean).join("\n"),
    legislation: service.legislation?.map((law) => `${law.label}\n${law.url}`).join("\n") || service.legislationNotice || "",
    priorities: "", additional: [service.notice, !isPendingServiceValue(intro) ? intro : ""].filter(Boolean).join("\n"), ombudsman: "https://falabr.cgu.gov.br/web/home",
    procedures: "", filledBy: "", updatedDate: service.updatedAt || "", responsibleContact: "", simpNotes: "",
  };
  for (const field of serviceEditFields) {
    if (fields?.[field.key] !== undefined) base[field.key] = fields[field.key]!;
  }
  if (service.directEdit?.schema !== "carta-1-2026") {
    base.additional = [...new Set([base.additional, fields?.additional !== undefined && !isPendingServiceValue(intro) ? intro : "", fields?.communication, fields?.contactMeans,
      fields?.maximumTime !== base.duration ? fields?.maximumTime : ""].filter((text): text is string => Boolean(text)))].join("\n");
    base.phone = fields ? fullPhone : ownPhone;
  }
  if (service.directEdit?.schema !== "carta-1-2026" && fields && (fields.requiredDocuments !== undefined || fields.optionalDocuments !== undefined)) {
    base.requiredDocuments = cells ? workbookDocumentColumns(cells).map((column) => cells[column]).join("\n") : [fields.requiredDocuments, fields.optionalDocuments].filter(Boolean).join("\n");
  }
  return base;
}

/** Overlay content last, leaving original rows archived in the snapshot. */
export function applyDirectServiceContent(service: Service): Service {
  const edit = service.directEdit;
  if (!edit) return service;
  const fields = edit.fields;
  let next = { ...service };
  if (service.workbookCells) {
    const cells = { ...service.workbookCells };
    const fallbackDocuments = !cells["Documentos obrigatórios"] && !cells["Documentos opcionais"] ? cells["Documentação necessária"] || "" : "";
    for (const field of serviceEditFields) if ("column" in field && fields[field.key] !== undefined) cells[field.column] = fields[field.key]!;
    if (fields.requiredDocuments !== undefined || fields.optionalDocuments !== undefined) {
      if (fields.requiredDocuments === undefined && fallbackDocuments) cells["Documentos obrigatórios"] = fallbackDocuments;
      cells["Documentação necessária"] = "";
      if (edit.schema === "carta-1-2026") cells["Documentos opcionais"] = "";
      else if (fields.optionalDocuments !== undefined) cells["Documentos opcionais"] = fields.optionalDocuments;
    }
    if (edit.schema !== "carta-1-2026" && fields.whereWhen !== undefined) cells["Onde e quando solicitar2"] = fields.whereWhen;
    if (edit.schema !== "carta-1-2026" && fields.extension !== undefined) cells.Ramal = fields.extension;
    if (edit.schema === "carta-1-2026" && fields.phone !== undefined) cells.Ramal = "";
    next = { ...applyWorkbookCells(service, cells, service.sourceRow!), directEdit: edit };
  } else {
    for (const key of ["title", "summary", "eligibility", "cost", "duration", "department", "category"] as const) if (fields[key] !== undefined) next[key] = fields[key];
    if (fields.whereWhen !== undefined) next.whereWhen = fields.whereWhen;
    if (fields.audience !== undefined) {
      next.audienceLabel = fields.audience;
      next.audienceIds = audienceSelection(fields.audience).ids;
      next.audienceId = next.audienceIds[0];
    }
    if (fields.category !== undefined) next.subject = fields.category;
    if (fields.requiredDocuments !== undefined || fields.optionalDocuments !== undefined) next.documents = [fields.requiredDocuments ?? (service.documents || []).join("\n"), edit.schema === "carta-1-2026" ? "" : fields.optionalDocuments || ""].filter(Boolean).flatMap((text) => text.split(/\r?\n/));
    if (fields.steps !== undefined) next.steps = fields.steps ? fields.steps.split(/\r?\n/) : [];
    if (fields.accessUrl !== undefined) next.url = fields.accessUrl;
    if (fields.platform !== undefined) next.destination = fields.platform;
  }
  if (fields.audience !== undefined && service.workbookCells) {
    next.audienceIds = audienceSelection(fields.audience).ids;
    next.audienceId = next.audienceIds[0];
  }
  if (fields.status !== undefined) next.inactive = fields.status === "Inativo";
  if (fields.popularNames !== undefined) next.searchTerms = [...new Set([...(service.searchTerms || []), fields.popularNames].filter(Boolean))];
  return next;
}

/** Called before public serialization, including SSR, search and AI tools. */
export function publicServiceContent(service: Service): Service {
  if (!service.directEdit) return service;
  const fields = { ...service.directEdit.fields };
  for (const key of privateServiceEditFields) delete fields[key];
  return { ...service, directEdit: { ...service.directEdit, fields } };
}
