/** Presentation only: original workbook cells and catalog properties stay intact. */
export const serviceSectionLabels = {
  about: "O que é?",
  audience: "Quem Pode Solicitar?",
  documents: "Pré requisitos e documentos necessários",
  steps: "Quais as etapas?",
  cost: "Taxas",
  duration: "Quanto tempo leva?",
} as const;

export function isPendingServiceValue(value: string | undefined | null) {
  return !value?.trim() || /^(?:a preencher[.!]?|\*?\s*informa[çc][aã]o a ser adicionada[.!]?|\*?\s*ser[aá] adicionado em breve[.!]?)$/i.test(value.trim());
}

export function serviceDisplayValue(value: string | undefined | null, column?: string) {
  return isPendingServiceValue(value) ? (column === "Prazo" ? "Indeterminado." : "Não informado.") : value!;
}
