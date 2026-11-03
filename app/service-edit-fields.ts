/** The labels and grouping follow Carta de Serviço SEI nº 1/2026. */
export const serviceEditGroups = [
  "1. INFORMAÇÕES GERAIS DO SERVIÇO", "2. PRAZOS, CUSTOS E ATENDIMENTO",
  "3. CANAIS DE ACESSO, CONTATO E ACOMPANHAMENTO", "4. REQUISITOS, DOCUMENTOS E ETAPAS DO SERVIÇO",
  "5. BASE LEGAL, PRIORIDADES E MANIFESTAÇÕES", "6. CONTROLE DA ATUALIZAÇÃO",
] as const;
export const serviceEditFields = [
  { key: "title", label: "NOME DO SERVIÇO", group: 0, column: "Nome do serviço consolidado", rows: 2 },
  { key: "popularNames", label: "NOME(S) POPULAR(ES)", group: 0, rows: 2 },
  { key: "secretariat", label: "ÓRGÃO / SECRETARIA / SETOR", group: 0, column: "Secretaria responsável", rows: 2 },
  { key: "category", label: "CATEGORIA(S)", group: 0, column: "Categoria", rows: 2 },
  { key: "audience", label: "PÚBLICO-ALVO / USUÁRIO", group: 0, column: "Público", rows: 2 },
  { key: "deliveryChannel", label: "CANAL DE PRESTAÇÃO", group: 0, options: ["", "Presencial", "Digital", "Híbrido"], rows: 2 },
  { key: "status", label: "STATUS DO SERVIÇO", group: 0, options: ["Ativo", "Inativo", "Em manutenção"], rows: 2 },
  { key: "department", label: "ÁREA RESPONSÁVEL", group: 0, column: "Setor/Unidade responsável no SEI", rows: 2 },
  { key: "filledBy", label: "RESPONSÁVEL PELO PREENCHIMENTO", group: 0, private: true, rows: 2 },
  { key: "summary", label: "DESCRIÇÃO DETALHADA", group: 0, column: "O que é", rows: 4 },
  { key: "waitingTime", label: "PREVISÃO DE ESPERA PARA ATENDIMENTO", group: 1, rows: 2 },
  { key: "duration", label: "PRAZO MÁXIMO PARA CONCLUSÃO", group: 1, column: "Prazo", rows: 2 },
  { key: "cost", label: "CUSTO / TAXA", group: 1, column: "Custo", rows: 2 },
  { key: "attendanceModes", label: "MODALIDADES DE ATENDIMENTO", group: 1, multiple: ["Presencial", "Site ou sistema", "E-mail", "WhatsApp", "Telefone"], rows: 2 },
  { key: "address", label: "ENDEREÇO PRESENCIAL", group: 2, rows: 3 },
  { key: "hours", label: "HORÁRIO DE ATENDIMENTO", group: 2, rows: 3 },
  { key: "phone", label: "TELEFONE / WHATSAPP", group: 2, column: "Telefone", rows: 2 },
  { key: "email", label: "E-MAIL OFICIAL", group: 2, column: "E-mail do setor/unidade", rows: 2 },
  { key: "accessUrl", label: "SITE / LINK DE ACESSO", group: 2, column: "Link de acesso", url: true, rows: 2 },
  { key: "consultation", label: "MECANISMOS DE CONSULTA E ACOMPANHAMENTO", group: 2, rows: 4 },
  { key: "baGovUrl", label: "LINK ATUAL DO SERVIÇO NO BA.GOV", group: 2, url: true, rows: 2 },
  { key: "eligibility", label: "REQUISITOS PARA SOLICITAR O SERVIÇO", group: 3, column: "Quem pode solicitar2", rows: 4 },
  { key: "steps", label: "DESCRIÇÃO DA ETAPA", group: 3, stage: "ETAPA 1 - SOLICITAÇÃO", column: "Como solicitar - etapas", rows: 6 },
  { key: "requiredDocuments", label: "DOCUMENTOS NECESSÁRIOS", group: 3, stage: "ETAPA 1 - SOLICITAÇÃO", column: "Documentos obrigatórios", rows: 5 },
  { key: "stage2Description", label: "DESCRIÇÃO DA ETAPA", group: 3, stage: "ETAPA 2 - ANÁLISE E CONCLUSÃO", rows: 5 },
  { key: "stage2Documents", label: "DOCUMENTOS NECESSÁRIOS", group: 3, stage: "ETAPA 2 - ANÁLISE E CONCLUSÃO", rows: 4 },
  { key: "additional", label: "OUTRAS ETAPAS / INFORMAÇÕES ADICIONAIS", group: 3, rows: 4 },
  { key: "legislation", label: "BASE LEGAL", group: 4, rows: 4 },
  { key: "priorities", label: "PRIORIDADES DE ATENDIMENTO", group: 4, rows: 4 },
  { key: "ombudsman", label: "CANAL DA OUVIDORIA", group: 4, rows: 3 },
  { key: "procedures", label: "PROCEDIMENTOS PARA REGISTRO DE MANIFESTAÇÕES", group: 4, rows: 4 },
  { key: "updatedDate", label: "DATA DO PREENCHIMENTO / ATUALIZAÇÃO", group: 5, private: true, rows: 2 },
  { key: "responsibleContact", label: "CONTATO DO RESPONSÁVEL", group: 5, private: true, rows: 3 },
  { key: "simpNotes", label: "OBSERVAÇÕES PARA A SIMP", group: 5, private: true, rows: 4 },
] as const;

export type ServiceEditField = typeof serviceEditFields[number]["key"];
export type ServiceEditValues = Record<ServiceEditField, string>;
/** Historical fields remain readable; the current editor cannot submit them. */
export type LegacyServiceEditFields = Partial<Record<"optionalDocuments" | "whereWhen" | "extension" | "communication" | "maximumTime" | "contactMeans", string>>;
export type DirectServiceEdit = {
  schema?: "carta-1-2026";
  fields: Partial<ServiceEditValues> & LegacyServiceEditFields;
  layout: { mergeContact: boolean; whereWhen: boolean; digital: boolean; presencial: boolean; manualHref: string; showManual?: boolean; requestNoticeText?: string; repeatedNoticeText?: string; whereWhenParts?: import("./workbook-where-when").WhereWhenPart[] };
};
export const privateServiceEditFields = serviceEditFields.filter((field) => "private" in field).map((field) => field.key);
export function serviceFieldLabel(key: ServiceEditField) { return serviceEditFields.find((field) => field.key === key)!.label; }
export function serviceFieldReportLabel(key: ServiceEditField) {
  const field = serviceEditFields.find((item) => item.key === key)!;
  return "stage" in field ? `${field.stage} · ${field.label}` : field.label;
}
