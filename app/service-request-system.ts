export type ServiceRequestSystem = "sei" | "other";

export const isBaGovUrl = (value?: string) =>
  Boolean(
    value &&
      /^https?:\/\/(?:ba\.gov\.br|(?:(?:www\.)?servicos|cpu\d+|www)\.ba\.gov\.br)(?:[/?#]|$)/i.test(value),
  );

export const baGovServiceLinks: Record<string, string> = {
  "1doc-extincao-ou-suspensao-de-execucao-extrajudicial-ou-judicial": "https://servicos.ba.gov.br/detalhe/servico/10092",
  "1doc-prescricao-de-credito-tributario-ou-de-renda-iptu-tll-tff": "https://servicos.ba.gov.br/detalhe/servico/10035",
  "1doc-certidao-de-valor-venal-urbano": "https://servicos.ba.gov.br/detalhe/servico/10031",
  "1doc-lancamento-de-inscricao-imobiliaria": "https://servicos.ba.gov.br/detalhe/servico/10029",
  "1doc-certidao-de-valor-venal-rural": "https://servicos.ba.gov.br/detalhe/servico/10043",
  "1doc-certidao-de-regularidade-fiscal-empresas": "https://servicos.ba.gov.br/detalhe/servico/10032",
  "1doc-certidao-de-comprovacao-de-endereco": "https://servicos.ba.gov.br/detalhe/servico/10028",
  "1doc-isencao-tributaria-cadastro-imobiliario": "https://servicos.ba.gov.br/detalhe/servico/10110",
  "1doc-isencao-tributaria-cadastro-economico": "https://servicos.ba.gov.br/detalhe/servico/10109",
};

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
