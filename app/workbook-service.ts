import type { Service } from "./service-catalog";

export type WorkbookCells = Record<string, string>;

/** The workbook is authoritative. Keep even placeholders and typos verbatim. */
export function applyWorkbookCells(service: Service, cells: WorkbookCells, sourceRow: number): Service {
  const get = (column: string) => cells[column] ?? "";
  const audience = get("Público");
  const audienceIds = [
    /cidad/i.test(audience) && "cidadao",
    /empresa/i.test(audience) && "empresa",
    /servidor/i.test(audience) && "servidor",
    /órgãos públicos|ongs/i.test(audience) && "orgaos-publicos-ongs",
  ].filter((id): id is string => Boolean(id));
  const documents = workbookDocumentColumns(cells).map(get);
  return {
    ...service,
    sourceRow,
    // Content updates preserve the existing page template.
    detailLayout: service.detailLayout ?? (service.id.startsWith("planilha-") ||
      (service.notice && service.documents?.length && service.steps?.length) ? "rich" : "standard"),
    workbookCells: cells,
    title: get("Nome do serviço consolidado"),
    // Keep known names searchable while displaying only the workbook title.
    searchTerms: [...new Set([...(service.searchTerms || []), service.title].filter(Boolean))],
    audienceLabel: audience,
    audienceIds,
    audienceId: audienceIds[0],
    summary: get("O que é"),
    eligibility: get("Quem pode solicitar2"),
    steps: get("Como solicitar - etapas") ? [get("Como solicitar - etapas")] : [],
    whereWhen: get("Onde e quando solicitar2"),
    documents,
    cost: get("Custo"),
    duration: get("Prazo"),
    department: get("Setor/Unidade responsável no SEI"),
    category: get("Categoria"),
    subject: get("Categoria"),
    destination: get("Plataforma"),
    url: get("Link de acesso"),
    contactOverride: {
      sector: get("Setor/Unidade responsável no SEI"),
      secretariat: get("Secretaria responsável"),
      phone: get("Telefone"),
      extension: get("Ramal"),
      email: get("E-mail do setor/unidade"),
    },
    // These facts came from other sources, not from this workbook row.
    whereWhenItems: undefined,
    channels: undefined,
    legislation: undefined,
    legislationNotice: undefined,
    relatedServiceIds: undefined,
    notice: undefined,
    noticeAction: undefined,
  };
}

/** Split only at numbered markers. Every character stays in prefix or text. */
export function workbookStepParts(value: string): { prefix: string; text: string }[] {
  const matches = [...value.matchAll(/(?:^|(?<=\s))\d+[.)]\s+/g)];
  if (!matches.length || matches[0].index !== 0) return value ? [{ prefix: "", text: value }] : [];
  return matches.map((match, index) => ({
    prefix: match[0],
    text: value.slice(match.index + match[0].length, matches[index + 1]?.index ?? value.length),
  }));
}

export function workbookDocumentColumns(cells: WorkbookCells): string[] {
  return cells["Documentos obrigatórios"] || cells["Documentos opcionais"]
    ? ["Documentos obrigatórios", "Documentos opcionais"].filter((column) => cells[column])
    : cells["Documentação necessária"] ? ["Documentação necessária"] : [];
}

/** Audit existing elements without replacing their structure or CSS. */
export function workbookFieldProps(service: Service, column: string) {
  return service.workbookCells ? {
    "data-workbook-column": column,
    style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as const,
  } : {};
}
