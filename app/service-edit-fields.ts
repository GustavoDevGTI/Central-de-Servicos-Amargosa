/** Carta de Serviço SEI nº 1/2026 fields plus the editable platform label. */
export const serviceEditGroups = [
  "1. Informações gerais do serviço", "2. Prazos, custos e atendimento",
  "3. Canais de acesso, contato e acompanhamento", "4. Requisitos, documentos e etapas do serviço",
  "5. Base legal, prioridades e manifestações", "6. Controle da atualização",
] as const;
export const serviceEditFields = [
  { key: "title", label: "Nome do serviço", group: 0, column: "Nome do serviço consolidado", rows: 2 },
  { key: "popularNames", label: "Nome(s) popular(es)", group: 0, rows: 2 },
  { key: "secretariat", label: "Órgão / secretaria / setor", group: 0, column: "Secretaria responsável", rows: 2 },
  { key: "category", label: "Categoria(s)", group: 0, column: "Categoria", rows: 2 },
  { key: "audience", label: "Público-alvo / usuário", group: 0, column: "Público", rows: 2 },
  { key: "deliveryChannel", label: "Canal de prestação", group: 0, options: ["", "Presencial", "Digital", "Híbrido"], rows: 2 },
  { key: "status", label: "Status do serviço", group: 0, options: ["Ativo", "Inativo", "Em manutenção"], rows: 2 },
  { key: "department", label: "Área responsável", group: 0, column: "Setor/Unidade responsável no SEI", rows: 2 },
  { key: "filledBy", label: "Responsável pelo preenchimento", group: 0, private: true, rows: 2 },
  { key: "summary", label: "Descrição detalhada", group: 0, column: "O que é", rows: 4 },
  { key: "waitingTime", label: "Previsão de espera para atendimento", group: 1, rows: 2 },
  { key: "duration", label: "Prazo máximo para conclusão", group: 1, column: "Prazo", rows: 2 },
  { key: "cost", label: "Custo / taxa", group: 1, column: "Custo", rows: 2 },
  { key: "attendanceModes", label: "Modalidades de atendimento", group: 1, multiple: ["Presencial", "Site ou sistema", "E-mail", "WhatsApp", "Telefone"], rows: 2 },
  { key: "address", label: "Endereço presencial", group: 2, rows: 3 },
  { key: "hours", label: "Horário de atendimento", group: 2, rows: 3 },
  { key: "phone", label: "Telefone / WhatsApp", group: 2, column: "Telefone", rows: 2 },
  { key: "email", label: "E-mail oficial", group: 2, column: "E-mail do setor/unidade", rows: 2 },
  { key: "platform", label: "Plataforma", group: 2, column: "Plataforma", rows: 2 },
  { key: "accessUrl", label: "Site / link de acesso", group: 2, column: "Link de acesso", url: true, rows: 2 },
  { key: "consultation", label: "Mecanismos de consulta e acompanhamento", group: 2, rows: 4 },
  { key: "baGovUrl", label: "Link atual do serviço no BA.GOV", group: 2, url: true, rows: 2 },
  { key: "eligibility", label: "Requisitos para solicitar o serviço", group: 3, column: "Quem pode solicitar2", rows: 4 },
  { key: "steps", label: "Descrição da etapa", group: 3, stage: "Etapa 1 - solicitação", column: "Como solicitar - etapas", list: "numbered", rows: 6 },
  { key: "requiredDocuments", label: "Documentos necessários", group: 3, stage: "Etapa 1 - solicitação", column: "Documentos obrigatórios", list: "bulleted", rows: 5 },
  { key: "stage2Description", label: "Descrição da etapa", group: 3, stage: "Etapa 2 - análise e conclusão", list: "numbered", rows: 5 },
  { key: "stage2Documents", label: "Documentos necessários", group: 3, stage: "Etapa 2 - análise e conclusão", list: "bulleted", rows: 4 },
  { key: "additional", label: "Outras etapas / informações adicionais", group: 3, rows: 4 },
  { key: "legislation", label: "Base legal", group: 4, rows: 4 },
  { key: "priorities", label: "Prioridades de atendimento", group: 4, rows: 4 },
  { key: "ombudsman", label: "Canal da ouvidoria", group: 4, rows: 3 },
  { key: "procedures", label: "Procedimentos para registro de manifestações", group: 4, rows: 4 },
  { key: "updatedDate", label: "Data do preenchimento / atualização", group: 5, private: true, rows: 2 },
  { key: "responsibleContact", label: "Contato do responsável", group: 5, private: true, rows: 3 },
  { key: "simpNotes", label: "Observações para a SIMP", group: 5, private: true, rows: 4 },
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
