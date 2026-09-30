export type ServiceRequestSystem = "sei" | "other";

export const isBaGovUrl = (value?: string) =>
  Boolean(
    value &&
      /^https?:\/\/(?:ba\.gov\.br|(?:(?:www\.)?servicos|cpu\d+|www)\.ba\.gov\.br)(?:[/?#]|$)/i.test(value),
  );

export const baGovServiceLinks: Record<string, string> = {
  "1doc-certidao-de-inexigibilidade-ci": "https://servicos.ba.gov.br/detalhe/servico/2559",
  "1doc-extincao-ou-suspensao-de-execucao-extrajudicial-ou-judicial": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-extincao-suspensao-de-execucao-amargosa/etapa/solicitar-servico",
  "1doc-prescricao-de-credito-tributario-ou-de-renda-iptu-tll-tff": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-prescricao-de-debitos-tributarios-municipais-amargosa/etapa/prescricao-de-debitos",
  "1doc-certidao-de-valor-venal-urbano": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-certidao-de-valor-venal-urbano-amargosa/etapa/certidao-de-valor-venal",
  "1doc-lancamento-de-inscricao-imobiliaria": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-criacao-de-inscricao-imobiliaria-amargosa/etapa/certidao-de-lancamento",
  "1doc-certidao-de-valor-venal-rural": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-certidao-de-valor-venal-rural-amargosa/etapa/certidao-de-valor-venal",
  "1doc-certidao-de-regularidade-fiscal-empresas": "https://www.ba.gov.br/servico/pm-amargosa/emitir-certidao-regularidade-fiscal-amargosa/etapa/regularidade-fiscal",
  "1doc-certidao-de-comprovacao-de-endereco": "https://www.ba.gov.br/servico/pm-amargosa/emitir-certidao-de-comprovacao-de-endereco-amargosa/etapa/comprovacao-endereco",
  "1doc-isencao-tributaria-cadastro-imobiliario": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-isencao-tributaria-de-cadastro-imobiliario-amargosa/etapa/solicitar-isencao",
  "1doc-isencao-tributaria-cadastro-economico": "https://www.ba.gov.br/servico/pm-amargosa/solicitar-isencao-tributaria-de-cadastro-economico-amargosa/etapa/solicitar-isencao",
};

export const nonSeiServiceIds = new Set([
  "1doc-ouvidoria-geral",
  "1doc-certidao-de-inexigibilidade-ci",
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
