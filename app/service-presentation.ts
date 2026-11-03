/** Presentation only: original workbook cells and catalog properties stay intact. */
export const serviceSectionLabels = {
  about: "DESCRIÇÃO DETALHADA",
  audience: "REQUISITOS PARA SOLICITAR O SERVIÇO",
  documents: "DOCUMENTOS NECESSÁRIOS",
  steps: "ETAPA 1 - SOLICITAÇÃO",
  cost: "CUSTO / TAXA",
  duration: "PRAZO MÁXIMO PARA CONCLUSÃO",
} as const;

export function isPendingServiceValue(value: string | undefined | null) {
  return !value?.trim() || /^(?:a preencher[.!]?|\*?\s*informa[çc][aã]o a ser adicionada[.!]?|\*?\s*ser[aá] adicionado em breve[.!]?)$/i.test(value.trim());
}

export function serviceDisplayValue(value: string | undefined | null, column?: string) {
  return isPendingServiceValue(value) ? (column === "Prazo" ? "Indeterminado." : "Não informado.") : value!;
}
