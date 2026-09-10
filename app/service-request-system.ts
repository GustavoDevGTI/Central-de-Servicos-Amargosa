export type ServiceRequestSystem = "sei" | "other";

export const nonSeiServiceIds = new Set([
  "1doc-ouvidoria-geral",
  "1doc-extincao-ou-suspensao-de-execucao-extrajudicial-ou-judicial",
  "1doc-prescricao-de-credito-tributario-ou-de-renda-iptu-tll-tff",
  "1doc-certidao-de-valor-venal-urbano",
  "1doc-lancamento-de-inscricao-imobiliaria",
  "1doc-certidao-de-valor-venal-rural",
  "1doc-certidao-de-regularidade-fiscal-empresas",
  "1doc-certidao-de-comprovacao-de-endereco",
  "1doc-isencao-tributaria-cadastro-imobiliario",
  "1doc-isencao-tributaria-cadastro-economico",
]);

export const requestSystemForService = (serviceId: string): ServiceRequestSystem =>
  nonSeiServiceIds.has(serviceId) ? "other" : "sei";
