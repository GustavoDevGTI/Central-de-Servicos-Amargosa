/** Presentation only: original workbook cells and catalog properties stay intact. */
export const serviceSectionLabels = {
  about: "Descrição detalhada",
  audience: "Requisitos para solicitar o serviço",
  documents: "Documentos necessários",
  steps: "Etapa 1 - solicitação",
  cost: "Custo / taxa",
  duration: "Prazo máximo para conclusão",
} as const;

export function isPendingServiceValue(value: string | undefined | null) {
  return !value?.trim() || /^(?:a preencher[.!]?|\*?\s*informa[çc][aã]o a ser adicionada[.!]?|\*?\s*ser[aá] adicionado em breve[.!]?)$/i.test(value.trim());
}

export function serviceDisplayValue(value: string | undefined | null, column?: string) {
  return isPendingServiceValue(value) ? (column === "Prazo" ? "Indeterminado." : "Não informado.") : value!;
}
