import type { Service } from "./service-catalog";
import { serviceEditFields, type ServiceEditValues } from "./service-edit-fields";
import { applyWorkbookCells } from "./workbook-service";
import { contactForService } from "./service-contacts";
import { servicePageCopy } from "./service-page-copy";
import { isPendingServiceValue } from "./service-presentation";

/** A single canonical read for the form, reports and restoration. */
export function serviceEditValues(original: Service): ServiceEditValues {
  const service = servicePageCopy(applyDirectServiceContent(original));
  const cells = service.workbookCells;
  const contact = contactForService(service);
  const base: ServiceEditValues = {
    title: service.title, summary: service.summary || "", audience: service.audienceLabel || "",
    eligibility: service.eligibility || "", requiredDocuments: cells
      ? cells["Documentos obrigatórios"] || (!cells["Documentos opcionais"] ? cells["Documentação necessária"] || "" : "")
      : (service.documents || []).join("\n"),
    optionalDocuments: cells?.["Documentos opcionais"] || "", steps: cells?.["Como solicitar - etapas"] ?? (service.steps || []).join("\n"),
    whereWhen: service.whereWhen || "", cost: service.cost || "", duration: service.duration || "",
    department: cells?.["Setor/Unidade responsável no SEI"] ?? contact.name,
    secretariat: cells?.["Secretaria responsável"] ?? contact.officeName ?? "",
    phone: cells?.Telefone ?? contact.phone.replace(/,\s*ramal\s*\d+\s*$/i, ""), extension: cells?.Ramal || service.contactOverride?.extension || contact.phone.match(/,\s*ramal\s*(\d+)\s*$/i)?.[1] || "",
    email: cells?.["E-mail do setor/unidade"] ?? contact.email ?? "", category: service.category,
    consultation: "", communication: "", waitingTime: "", maximumTime: "", contactMeans: "", procedures: "", priorities: "", legislation: "", additional: "",
  };
  const ownPhone = cells?.Telefone ?? contact.phone;
  const ownEmail = cells?.["E-mail do setor/unidade"] ?? contact.email;
  base.consultation = [service.destination, service.url].filter((value) => !isPendingServiceValue(value)).join("\n");
  base.communication = [ownPhone, ownEmail].filter((value) => !isPendingServiceValue(value)).join("\n");
  base.maximumTime = service.duration || "";
  base.contactMeans = [cells?.["Setor/Unidade responsável no SEI"] ?? contact.address, ownPhone, ownEmail].filter((value) => !isPendingServiceValue(value)).join("\n");
  base.legislation = service.legislation?.map((law) => `${law.label}\n${law.url}`).join("\n") || service.legislationNotice || "";
  base.additional = service.notice || "";
  return { ...base, ...service.directEdit?.fields };
}

/** Overlay editorial content last; legacy workbook data remains archival. */
export function applyDirectServiceContent(service: Service): Service {
  const edit = service.directEdit;
  if (!edit) return service;
  const fields = edit.fields;
  if (service.workbookCells) {
    const cells = { ...service.workbookCells };
    const fallbackDocuments = !cells["Documentos obrigatórios"] && !cells["Documentos opcionais"] ? cells["Documentação necessária"] || "" : "";
    for (const field of serviceEditFields) {
      if ("column" in field && fields[field.key] !== undefined) cells[field.column] = fields[field.key]!;
    }
    if (fields.requiredDocuments !== undefined || fields.optionalDocuments !== undefined) {
      // Materialize the existing fallback before taking ownership of this field.
      if (fields.requiredDocuments === undefined && fallbackDocuments) cells["Documentos obrigatórios"] = fallbackDocuments;
      cells["Documentação necessária"] = "";
    }
    return { ...applyWorkbookCells(service, cells, service.sourceRow!), directEdit: edit };
  }
  const next = { ...service };
  for (const key of ["title", "summary", "eligibility", "whereWhen", "cost", "duration", "department", "category"] as const) {
    if (fields[key] !== undefined) next[key] = fields[key];
  }
  if (fields.audience !== undefined) {
    next.audienceLabel = fields.audience;
    next.audienceIds = [/cidad/i.test(fields.audience) && "cidadao", /empresa/i.test(fields.audience) && "empresa", /servidor/i.test(fields.audience) && "servidor", /órgãos públicos|ongs/i.test(fields.audience) && "orgaos-publicos-ongs"].filter((id): id is string => Boolean(id));
    next.audienceId = next.audienceIds[0];
  }
  if (fields.category !== undefined) next.subject = fields.category;
  if (fields.requiredDocuments !== undefined || fields.optionalDocuments !== undefined) next.documents = [fields.requiredDocuments ?? (service.documents || []).join("\n"), fields.optionalDocuments || ""].filter(Boolean).flatMap((text) => text.split(/\r?\n/));
  if (fields.steps !== undefined) next.steps = fields.steps ? fields.steps.split(/\r?\n/) : [];
  return next;
}
