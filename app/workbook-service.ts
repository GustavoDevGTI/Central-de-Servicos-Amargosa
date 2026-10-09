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
  const documentation = get("Documentação necessária");
  const documents = [...new Set([get("Documentos obrigatórios"), get("Documentos opcionais"), documentation].filter(Boolean))];
  return {
    ...service,
    sourceRow,
    workbookCells: cells,
    title: get("Nome do serviço consolidado"),
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
