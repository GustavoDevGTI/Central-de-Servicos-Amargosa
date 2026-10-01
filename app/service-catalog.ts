import siteContent from "../content/site.json";
import { approvedServiceDetails } from "./approved-service-details";
import pendingServiceDetails from "./pending-service-details.json" with { type: "json" };
import spreadsheetServiceData from "./spreadsheet-service-data.json" with { type: "json" };
import { PENDING_SERVICE_INFORMATION } from "./pending-information";
import {
  cartaOnlyServices,
  cartaServiceDestination,
  cartaServiceLinks,
} from "./carta-service-catalog";
import {
  baGovServiceLinks,
  isBaGovUrl,
  requestSystemForService,
  type ServiceRequestSystem,
} from "./service-request-system";

export type Service = {
  id: string;
  type?: string;
  role?: string;
  slug?: string;
  title: string;
  category: string;
  subject?: string;
  audienceId?: string;
  audienceIds?: string[];
  department: string;
  destination: string;
  url: string;
  summary?: string;
  eligibility?: string;
  documents?: string[];
  steps?: string[];
  whereWhen?: string;
  whereWhenItems?: {
    label: string;
    schedule?: string;
    description: string;
    wide?: boolean;
  }[];
  cost?: string;
  duration?: string;
  channels?: { label: string; value: string; url?: string }[];
  legislation?: { label: string; url: string }[];
  legislationNotice?: string;
  relatedServiceIds?: string[];
  searchTerms?: string[];
  notice?: string;
  noticeAction?: string;
  requestLabel?: string;
  requestSystem?: ServiceRequestSystem;
  accessMode?: "digital" | "presencial" | "a-confirmar";
  updatedAt?: string;
  initials?: string;
  sourceRow?: number;
};

export { PENDING_SERVICE_INFORMATION } from "./pending-information";

const legacyOneDocUrlPattern =
  /(?:https?:\/\/)?(?:amargosa\.1doc\.com\.br|servicos\.amargosa\.ba\.gov\.br\/b\.php)/i;
const legacyOneDocTextPattern = /\b1doc\b/i;
const legacyOneDocUrlGlobalPattern =
  /https?:\/\/(?:amargosa\.1doc\.com\.br|servicos\.amargosa\.ba\.gov\.br\/b\.php)[^\s),;]*/gi;

const servicesWithoutSeiGuide = new Set([
  "acesso-informacao",
  "1doc-ouvidoria-geral",
]);

const hasLegacyOneDocReference = (value?: string) =>
  Boolean(
    value &&
      (legacyOneDocTextPattern.test(value) || legacyOneDocUrlPattern.test(value)),
  );

const isLegacyOneDocUrl = (value?: string) =>
  Boolean(value && legacyOneDocUrlPattern.test(value));

function replaceKnownCartaReference(value: string, cartaUrl: string) {
  return value
    .replace(legacyOneDocUrlGlobalPattern, cartaUrl)
    .replace(
      /(?:Central de Atendimento|Central|Portal de Protocolos|Ouvidoria Municipal no)\s+1Doc/gi,
      cartaServiceDestination,
    )
    .replace(/\b1Doc\b/gi, cartaServiceDestination);
}

function replacePendingReference(value: string) {
  if (!hasLegacyOneDocReference(value)) return value;

  const sentences = value.split(/(?<=[.!?])\s+/);
  const sanitized = sentences.map((sentence) =>
    hasLegacyOneDocReference(sentence)
      ? PENDING_SERVICE_INFORMATION
      : sentence,
  );

  return sanitized.filter((sentence, index) => sentence !== sanitized[index - 1]).join(" ");
}

function sanitizeServiceReferences(service: Service, cartaUrl?: string): Service {
  // O e-SIC continua usando o canal 1Doc indicado pela Prefeitura.
  if (service.id === "acesso-informacao") return service;

  const sanitizeText = (value?: string) => {
    if (!value) return value;
    const normalized = value
      .replaceAll("* Será adicionado em breve.", PENDING_SERVICE_INFORMATION)
      .replaceAll(
        "O prazo estimado deste serviço ainda não foi definido.",
        PENDING_SERVICE_INFORMATION,
      )
      .replaceAll(
        "Horários de atendimento ainda não informados.",
        `Horário de atendimento: ${PENDING_SERVICE_INFORMATION}`,
      )
      .replaceAll("não há prazo específico informado.", PENDING_SERVICE_INFORMATION);
    return cartaUrl
      ? replaceKnownCartaReference(normalized, cartaUrl)
      : replacePendingReference(normalized);
  };

  const legislation = service.legislation?.filter(
    (item) =>
      !hasLegacyOneDocReference(item.label) &&
      !isLegacyOneDocUrl(item.url),
  );
  const removedLegislation =
    (service.legislation?.length || 0) > (legislation?.length || 0);

  return {
    ...service,
    destination: sanitizeText(service.destination) || PENDING_SERVICE_INFORMATION,
    url: isLegacyOneDocUrl(service.url) ? cartaUrl || "" : service.url,
    summary: sanitizeText(service.summary),
    eligibility: sanitizeText(service.eligibility),
    documents: service.documents?.map((item) => sanitizeText(item) || item),
    steps: service.steps?.map((item) => sanitizeText(item) || item),
    whereWhen: sanitizeText(service.whereWhen),
    whereWhenItems: service.whereWhenItems?.map((item) => ({
      ...item,
      schedule: sanitizeText(item.schedule),
      description: sanitizeText(item.description) || item.description,
    })),
    cost: sanitizeText(service.cost),
    duration: sanitizeText(service.duration),
    channels: service.channels?.map((channel) => {
      const isLegacyChannel =
        hasLegacyOneDocReference(channel.value) ||
        isLegacyOneDocUrl(channel.url);
      if (!isLegacyChannel) return channel;
      if (cartaUrl) {
        return {
          ...channel,
          value: cartaServiceDestination,
          url: cartaUrl,
        };
      }
      return {
        label: channel.label,
        value: PENDING_SERVICE_INFORMATION,
      };
    }),
    legislation,
    legislationNotice: legislation?.length
      ? undefined
      : removedLegislation
        ? PENDING_SERVICE_INFORMATION
        : sanitizeText(service.legislationNotice),
    notice: sanitizeText(service.notice),
    noticeAction: hasLegacyOneDocReference(service.noticeAction)
      ? cartaUrl
        ? "Acessar o serviço ↗"
        : PENDING_SERVICE_INFORMATION
      : service.noticeAction,
    requestLabel: sanitizeText(service.requestLabel),
  };
}

const catalog = siteContent.pages[0]?.segments.find(
  (entry) => entry.type === "catalog",
);

const baseServices = (catalog?.items.filter(
  (item) => item.type === "service",
) || []) as unknown as Service[];

const generatedDetails = pendingServiceDetails as Record<
  string,
  Partial<Service>
>;

const spreadsheetDetails = spreadsheetServiceData.existing as Record<
  string,
  Partial<Service>
>;

const spreadsheetAccessModes = spreadsheetServiceData.accessModes as Record<
  string,
  NonNullable<Service["accessMode"]>
>;
const digitalProtocolUrl = "https://acesso.amargosa.ba.gov.br/protocolodigital";
const genericPresentialWhereWhen =
  "Atendimento presencial. Consulte o endereço do órgão responsável nos canais abaixo e confirme o horário por telefone.";
const genericPresentialStep =
  "Procure o órgão responsável no endereço indicado em Canais de atendimento ou ligue para confirmar o atendimento.";

const hasInformation = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(hasInformation);
  if (typeof value !== "string") return value != null;
  const text = value.trim();
  return Boolean(text && !/^\*|^a (?:preencher|inserir|definir|confirmar)/i.test(text));
};

function addMissingSpreadsheetInformation(
  base: Service,
  merged: Service,
): Service {
  const incoming = spreadsheetDetails[base.id];
  if (!incoming) return merged;

  const approved = approvedServiceDetails[base.id] as Partial<Service> | undefined;
  const enriched = { ...merged };
  for (const field of ["summary", "eligibility", "documents", "cost", "duration", "subject"] as const) {
    // Mantém o primeiro conteúdo real já existente; só então consulta a planilha.
    const value = [approved?.[field], base[field], merged[field], incoming[field]]
      .find(hasInformation);
    if (value !== undefined) (enriched as Record<string, unknown>)[field] = value;
  }
  if (!hasInformation(enriched.url) && !hasInformation(enriched.whereWhen) && hasInformation(incoming.whereWhen)) {
    enriched.whereWhen = incoming.whereWhen;
  }
  return enriched;
}

function applySpreadsheetAccessMode(service: Service): Service {
  const accessMode = spreadsheetAccessModes[service.id];
  if (!accessMode) return service;

  const needsDigitalLink = accessMode === "digital" && !hasInformation(service.url);
  let whereWhen = service.whereWhen;
  if (whereWhen === genericPresentialWhereWhen || !hasInformation(whereWhen)) {
    whereWhen = accessMode === "digital"
      ? "Atendimento digital. Inicie a solicitação pelo link desta página."
      : accessMode === "a-confirmar"
        ? "Confirme com o órgão responsável se o atendimento é digital ou presencial."
        : genericPresentialWhereWhen;
  }

  return {
    ...service,
    accessMode,
    url: needsDigitalLink ? digitalProtocolUrl : service.url,
    whereWhen,
    steps: accessMode === "digital"
      ? service.steps?.map((step) => step === genericPresentialStep
        ? "Acesse o link desta página para iniciar a solicitação digital."
        : step)
      : service.steps,
  };
}

const documentTopicSplits: Record<string, string[]> = {
  "Atestado médico original com CID, assinatura e carimbo do profissional de saúde. Documento de identificação do servidor (RG e CPF). Matrícula funcional.": [
    "Atestado médico original com CID, assinatura e carimbo do profissional de saúde.",
    "Documento de identificação do servidor (RG e CPF).",
    "Matrícula funcional.",
  ],
  "Comprovante de endereço e CNPJ da empresa, quando aplicável.": [
    "Comprovante de endereço da empresa, quando aplicável.",
    "CNPJ da empresa, quando aplicável.",
  ],
  "Alvará sanitário e autorização de uso de som, se necessário.": [
    "Alvará sanitário, se necessário.",
    "Autorização de uso de som, se necessário.",
  ],
  "CNPJ e inscrição municipal da empresa.": [
    "CNPJ da empresa.",
    "Inscrição municipal da empresa.",
  ],
  "(RG E CPF) dos proprietários, sócios, procuradores e representantes": [
    "RG dos proprietários, sócios, procuradores e representantes.",
    "CPF dos proprietários, sócios, procuradores e representantes.",
  ],
};

// Alguns resumos importados da planilha contêm editais, anexos ou links em vez de uma descrição do serviço.
const correctedSpreadsheetEntries: Record<string, Partial<Service>> = {
  "1doc-alvara-sanitario": {
    summary: "Solicite o alvará sanitário para o funcionamento de estabelecimento sujeito à fiscalização da Vigilância Sanitária municipal.",
    documents: [
      "Formulário de requerimento da Vigilância Sanitária preenchido.",
      "CNPJ e contrato social, quando se tratar de pessoa jurídica.",
      "Documento de identificação e CPF do responsável legal.",
      "Comprovante de endereço do estabelecimento.",
      "Projeto arquitetônico, quando exigido para a atividade.",
      "Manual de Boas Práticas e Procedimentos Operacionais Padronizados, quando exigidos para a atividade.",
    ],
    steps: [
      "Reúna os documentos exigidos para a atividade do estabelecimento.",
      "Use o botão INICIAR para apresentar o pedido à Vigilância Sanitária.",
      "Acompanhe a análise e atenda a eventuais exigências do setor responsável.",
    ],
  },
  "1doc-ampliacao-de-carga-horaria-enquadramento": {
    summary: "Solicite a ampliação da carga horária no Magistério Público Municipal, conforme as vagas e as regras do edital vigente.",
    documents: [
      "Requerimento de ampliação de carga horária com matrícula, cargo, unidade de lotação e unidade pretendida.",
      "Comprovante do nível ocupado na carreira do Magistério Público Municipal.",
      "Declaração de assiduidade e declarações de tempo de serviço exigidas no edital vigente.",
      "Outros comprovantes solicitados no edital vigente, em formato legível.",
    ],
    steps: [
      "Consulte o edital vigente para verificar vagas, critérios e prazo de inscrição.",
      "Reúna as declarações e os comprovantes exigidos pelo edital.",
      "Use o botão INICIAR para protocolar o requerimento e os anexos dentro do prazo previsto.",
    ],
  },
  "1doc-descompatibilizacao-eleitoral": {
    title: "Desincompatibilização eleitoral",
    summary: "Solicite o afastamento do cargo ou da função pública para fins de desincompatibilização eleitoral, conforme as regras aplicáveis à candidatura.",
    documents: [
      "Documento de identificação e CPF do servidor.",
      "Requerimento com a identificação do cargo ou da função e o período de afastamento solicitado.",
      "Certidão de filiação partidária.",
      "Cópia da ata de convenção partidária, quando aplicável.",
    ],
    steps: [
      "Confira o prazo de desincompatibilização aplicável ao cargo ou à função.",
      "Reúna o requerimento e os documentos comprobatórios.",
      "Use o botão INICIAR para protocolar o pedido e acompanhe a análise da Gestão de Pessoas.",
    ],
  },
  "1doc-contracheque": {
    summary: "Consulte e emita seu contracheque para verificar os valores da remuneração e dos descontos de cada competência.",
    eligibility: "Servidor público municipal com acesso ao contracheque.",
    documents: ["Não é necessário anexar documentos; a consulta exige identificação no sistema de contracheques."],
    steps: [
      "Use o botão INICIAR para acessar o sistema de contracheques.",
      "Identifique-se no sistema e selecione a competência desejada.",
      "Consulte ou baixe o documento disponível.",
    ],
  },
  "1doc-ferias-marcacao-e-alteracao": {
    summary: "Solicite a marcação ou a alteração do período de férias como servidor municipal. O pedido será analisado pela Gestão de Pessoas conforme a escala da unidade.",
  },
  "1doc-gratificacao-por-estimulo-ao-aperfeicoamento-gea-semed": {
    summary: "Solicite a Gratificação de Estímulo ao Aperfeiçoamento (GEA), destinada a ocupantes de cargo do Magistério Municipal que atendam aos requisitos da Lei Municipal nº 318/2009.",
    documents: [
      "Requerimento com a identificação do servidor e a gratificação solicitada.",
      "Certificado ou diploma do curso relacionado à área de atuação, emitido por instituição autorizada ou reconhecida.",
      "Declaração do setor competente sobre o interstício entre concessões da gratificação.",
      "Comprovação do estágio probatório, por declaração do setor competente ou contracheque.",
    ],
    steps: [
      "Reúna o requerimento e os comprovantes de formação e de situação funcional.",
      "Use o botão INICIAR para protocolar o pedido.",
      "Acompanhe a análise do setor responsável pela GEA.",
    ],
  },
  "planilha-50-inscricao-processo-seletivo-para-coordenador-de-polo-uab": {
    summary: "Inscreva-se no processo seletivo para coordenador do Polo UAB de Amargosa, quando houver edital com inscrições abertas. Consulte o edital vigente para verificar requisitos, documentos e prazos.",
    documents: ["Consulte o edital vigente para verificar os documentos exigidos na inscrição."],
  },
  "1doc-atestado-medico-licenca-tratamento-de-saude": {
    summary: "Registre o atestado médico para solicitar licença para tratamento de saúde como servidor municipal. A Gestão de Pessoas analisará o documento e o afastamento solicitado.",
    steps: [
      "Reúna o atestado médico e seus dados funcionais.",
      "Use o botão INICIAR para encaminhar o documento ao setor responsável.",
      "Acompanhe a análise e eventual orientação sobre perícia ou documentação complementar.",
    ],
  },
  "1doc-licenca-por-motivo-de-doenca-em-pessoa-da-familia": {
    summary: "Solicite licença para acompanhar familiar doente, conforme as condições previstas no Estatuto dos Servidores do Município e na regulamentação municipal.",
    documents: [
      "Requerimento com a identificação do servidor e do familiar.",
      "Atestado médico ou odontológico com as informações exigidas pela regulamentação municipal.",
      "Documentos que comprovem o vínculo familiar, quando exigidos na análise.",
    ],
    steps: [
      "Confira os requisitos e o prazo de encaminhamento previstos na regulamentação municipal.",
      "Reúna o atestado e os documentos que comprovem o pedido.",
      "Use o botão INICIAR para protocolar a solicitação e acompanhe a análise da Gestão de Pessoas.",
    ],
  },
  "1doc-pedido-de-certidao": {
    summary:
      "Serviço para solicitar uma certidão à Supervisão de Dívida Ativa da SEAFI. Informe no requerimento qual certidão deseja e apresente os documentos necessários para análise do setor.",
    steps: [
      "Indique no requerimento a certidão desejada e seus dados de contato.",
      "Reúna os documentos listados nesta página e, se o pedido for feito por representante, inclua a procuração.",
      "Use o botão INICIAR para enviar a solicitação e acompanhe a resposta pelo canal utilizado.",
    ],
  },
  "1doc-progressao-na-carreira": {
    summary: "Solicite a análise de progressão na carreira como servidor municipal, conforme os requisitos do plano de cargos e carreiras aplicável ao seu vínculo.",
    steps: [
      "Confira os requisitos da carreira e reúna os comprovantes necessários.",
      "Use o botão INICIAR para protocolar o requerimento.",
      "Acompanhe a análise da Gestão de Pessoas.",
    ],
  },
  "1doc-pedido-de-reajuste-reequilibrio-contratual": {
    summary: "Solicite reajuste ou reequilíbrio econômico-financeiro de contrato firmado com o Município, apresentando a justificativa e os documentos que fundamentam o pedido.",
    steps: [
      "Identifique o contrato e indique se o pedido é de reajuste ou de reequilíbrio.",
      "Reúna os documentos e os cálculos que fundamentam a solicitação.",
      "Use o botão INICIAR para protocolar o pedido e acompanhe a análise.",
    ],
  },
  "1doc-requerimento-gratificacao-estimulo-aperfeicoamento": {
    summary: "Requeira a Gratificação de Estímulo ao Aperfeiçoamento (GEA) como ocupante de cargo do Magistério Municipal, mediante apresentação dos comprovantes exigidos pela Lei Municipal nº 318/2009.",
    documents: [
      "Requerimento com a identificação do servidor e a gratificação solicitada.",
      "Certificado ou diploma do curso relacionado à área de atuação, emitido por instituição autorizada ou reconhecida.",
      "Declaração do setor competente sobre o interstício entre concessões da gratificação.",
      "Comprovação do estágio probatório, por declaração do setor competente ou contracheque.",
    ],
    steps: [
      "Reúna o requerimento e os comprovantes de formação e de situação funcional.",
      "Use o botão INICIAR para protocolar o pedido.",
      "Acompanhe a análise do setor responsável pela GEA.",
    ],
  },
  "1doc-ressarcimento-e-indenizacoes": {
    summary: "Solicite análise de ressarcimento ou indenização por dano ou prejuízo que você atribui ao Município, apresentando os fatos e os documentos comprobatórios.",
    steps: [
      "Descreva o dano ou prejuízo e reúna os documentos comprobatórios.",
      "Use o botão INICIAR para protocolar o pedido.",
      "Acompanhe a análise do órgão responsável pelo processo.",
    ],
  },
};

function documentTopics(service: Service): Service {
  if (!service.documents?.length) return service;
  return {
    ...service,
    documents: service.documents.flatMap(
      (document) => documentTopicSplits[document] || [document],
    ),
  };
}

const mergedServices = [...baseServices, ...cartaOnlyServices].map(
  (service) => {
    const merged = addMissingSpreadsheetInformation(service, {
      ...service,
      ...generatedDetails[service.id],
      ...approvedServiceDetails[service.id],
    });
    const cartaUrl = cartaServiceLinks[service.id];
    const resolvedCartaUrl = cartaUrl && !isBaGovUrl(merged.url)
      ? cartaUrl
      : undefined;
    const resolved = resolvedCartaUrl
      ? {
          ...merged,
          destination: cartaServiceDestination,
          url: resolvedCartaUrl,
        }
      : merged;

    return sanitizeServiceReferences(resolved, resolvedCartaUrl);
  },
);

export const services = [...mergedServices, ...(spreadsheetServiceData.created as Service[])].map((service) => {
  const prepared = applySpreadsheetAccessMode({
    ...service,
    ...correctedSpreadsheetEntries[service.id],
    requestSystem:
      service.requestSystem ||
      (cartaServiceLinks[service.id] === service.url ||
      servicesWithoutSeiGuide.has(service.id)
        ? "other"
        : requestSystemForService(service.id)),
  });
  const baGovUrl = baGovServiceLinks[prepared.id];
  return documentTopics(baGovUrl
    ? { ...prepared, url: baGovUrl, destination: "BA.gov" }
    : prepared);
});
