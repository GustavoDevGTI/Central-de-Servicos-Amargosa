export const serviceEditFields = [
  { key: "title", label: "Nome do serviço", group: "Informações do serviço", column: "Nome do serviço consolidado", rows: 2 },
  { key: "summary", label: "O que é?", group: "Informações do serviço", column: "O que é", rows: 4 },
  { key: "audience", label: "Público", group: "Informações do serviço", column: "Público", rows: 2 },
  { key: "eligibility", label: "Quem Pode Solicitar?", group: "Informações do serviço", column: "Quem pode solicitar2", rows: 4 },
  { key: "requiredDocuments", label: "Documentos obrigatórios", group: "Informações do serviço", column: "Documentos obrigatórios", rows: 5 },
  { key: "optionalDocuments", label: "Documentos opcionais", group: "Informações do serviço", column: "Documentos opcionais", rows: 3 },
  { key: "steps", label: "Quais as etapas?", group: "Informações do serviço", column: "Como solicitar - etapas", rows: 6 },
  { key: "whereWhen", label: "Onde e quando solicitar", group: "Atendimento", column: "Onde e quando solicitar2", rows: 5 },
  { key: "cost", label: "Taxas", group: "Atendimento", column: "Custo", rows: 2 },
  { key: "duration", label: "Quanto tempo leva?", group: "Atendimento", column: "Prazo", rows: 2 },
  { key: "department", label: "Setor responsável", group: "Atendimento", column: "Setor/Unidade responsável no SEI", rows: 2 },
  { key: "secretariat", label: "Secretaria", group: "Atendimento", column: "Secretaria responsável", rows: 2 },
  { key: "phone", label: "Telefone", group: "Atendimento", column: "Telefone", rows: 2 },
  { key: "extension", label: "Ramal", group: "Atendimento", column: "Ramal", rows: 2 },
  { key: "email", label: "E-mail", group: "Atendimento", column: "E-mail do setor/unidade", rows: 2 },
  { key: "category", label: "Categoria", group: "Informações do serviço", column: "Categoria", rows: 2 },
  { key: "consultation", label: "Consulta ou acesso", group: "Quer saber mais?", rows: 4 },
  { key: "communication", label: "Comunicação", group: "Quer saber mais?", rows: 4 },
  { key: "waitingTime", label: "Previsão de espera", group: "Quer saber mais?", rows: 2 },
  { key: "maximumTime", label: "Prazo máximo estimado", group: "Quer saber mais?", rows: 2 },
  { key: "contactMeans", label: "Meios de Contato", group: "Quer saber mais?", rows: 4 },
  { key: "procedures", label: "Procedimentos", group: "Quer saber mais?", rows: 4 },
  { key: "priorities", label: "Prioridades de atendimento", group: "Quer saber mais?", rows: 4 },
  { key: "legislation", label: "Legislação pertinente", group: "Quer saber mais?", rows: 4 },
  { key: "additional", label: "Informações adicionais", group: "Quer saber mais?", rows: 4 },
] as const;

export type ServiceEditField = typeof serviceEditFields[number]["key"];
export type ServiceEditValues = Record<ServiceEditField, string>;
export type DirectServiceEdit = {
  fields: Partial<ServiceEditValues>;
  layout: { mergeContact: boolean; whereWhen: boolean; digital: boolean; presencial: boolean; manualHref: string };
};
