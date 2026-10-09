import siteContent from "../content/site.json";
import { approvedServiceDetails } from "./approved-service-details";
import pendingServiceDetails from "./pending-service-details.json" with { type: "json" };
import spreadsheetServiceData from "./spreadsheet-service-data.json" with { type: "json" };
import spreadsheetServiceLinks from "./spreadsheet-service-links.json" with { type: "json" };
import spreadsheetServiceContent from "./spreadsheet-service-content.json" with { type: "json" };
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
  audienceLabel?: string;
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

// A planilha associou um anexo com dezenas de serviços ao resumo desta ficha.
const correctedSpreadsheetEntries: Record<string, Partial<Service>> = {
  "1doc-pedido-de-certidao": {
    summary:
      "Serviço para solicitar uma certidão à Supervisão de Dívida Ativa da SEAFI. Informe no requerimento qual certidão deseja e apresente os documentos necessários para análise do setor.",
    steps: [
      "Indique no requerimento a certidão desejada e seus dados de contato.",
      "Reúna os documentos listados nesta página e, se o pedido for feito por representante, inclua a procuração.",
      "Use o botão INICIAR para enviar a solicitação e acompanhe a resposta pelo canal utilizado.",
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

const preserveReviewedServiceContent = new Set([
  ...Object.keys(baGovServiceLinks),
  "acesso-informacao",
  "1doc-pedido-de-certidao",
]);

function spreadsheetSteps(value: string): string[] {
  return value.split(/\s*(?=\d+\.\s)/).map((part) => part.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
}

function spreadsheetAudienceIds(value: string, service: Service): string[] {
  const ids = [
    /cidad/i.test(value) && "cidadao",
    /empresa/i.test(value) && "empresa",
    /servidor/i.test(value) && "servidor",
    /(?:órgãos públicos|ongs)/i.test(value) && "orgaos-publicos-ongs",
    service.audienceId === "ouvidoria" && "ouvidoria",
  ].filter((id): id is string => Boolean(id));
  return [...new Set(ids)];
}

function applySpreadsheetContent(service: Service, sourceRow?: number): Service {
  if (!sourceRow || preserveReviewedServiceContent.has(service.id)) return service;
  const row = spreadsheetServiceContent.bySourceRow[String(sourceRow) as keyof typeof spreadsheetServiceContent.bySourceRow];
  if (!row) return service;
  const audienceIds = spreadsheetAudienceIds(row.audience, service);
  return {
    ...service,
    title: row.title,
    audienceLabel: row.audience,
    audienceId: audienceIds[0],
    audienceIds,
    summary: row.summary,
    eligibility: row.eligibility,
    steps: spreadsheetSteps(row.steps),
    whereWhen: row.whereWhen,
    documents: row.optionalDocuments
      ? [
          row.requiredDocuments && `Obrigatórios: ${row.requiredDocuments}`,
          `Opcionais: ${row.optionalDocuments}`,
        ].filter((item): item is string => Boolean(item))
      : row.requiredDocuments ? [row.requiredDocuments] : [],
    cost: row.cost || undefined,
    duration: row.duration || undefined,
    department: row.department || service.department,
    category: row.category,
    subject: row.category,
    updatedAt: "07/10/2026",
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

    return sanitizeServiceReferences({ ...resolved, ...correctedSpreadsheetEntries[service.id] }, resolvedCartaUrl);
  },
);

// A legenda da planilha classifica as linhas vermelhas como "Excluir".
export const excludedSpreadsheetServiceRows = new Set([17, 26, 28, 29, 37, 41, 46, 70]);

export const services = [...mergedServices, ...(spreadsheetServiceData.created as Service[])]
  .filter((service) => {
    const sourceRow = spreadsheetDetails[service.id]?.sourceRow || service.sourceRow;
    return !sourceRow || !excludedSpreadsheetServiceRows.has(sourceRow);
  })
  .map((service) => {
  const sourceRow = spreadsheetDetails[service.id]?.sourceRow || service.sourceRow;
  const spreadsheetUrl = sourceRow && spreadsheetServiceLinks.bySourceRow[String(sourceRow) as keyof typeof spreadsheetServiceLinks.bySourceRow];
  const linkedService = spreadsheetUrl && !isBaGovUrl(service.url)
    ? {
        ...service,
        url: spreadsheetUrl,
        destination: cartaServiceDestination,
        channels: service.channels?.map((channel) =>
          channel.url && /^(?:Online|Solicitação)$/i.test(channel.label) &&
          (channel.url === service.url || channel.url === digitalProtocolUrl || channel.url === cartaServiceLinks[service.id])
            ? { ...channel, url: spreadsheetUrl }
            : channel),
      }
    : service;
  const prepared = applySpreadsheetAccessMode({
    ...applySpreadsheetContent(linkedService, sourceRow),
    requestSystem:
      linkedService.requestSystem ||
      (cartaServiceLinks[linkedService.id] === linkedService.url ||
      servicesWithoutSeiGuide.has(linkedService.id)
        ? "other"
        : requestSystemForService(linkedService.id)),
  });
  const baGovUrl = baGovServiceLinks[prepared.id];
  return documentTopics(baGovUrl
    ? {
        ...prepared,
        url: baGovUrl,
        destination: "BA.gov",
        channels: prepared.channels?.map((channel) => {
          const pointsToService = channel.url && (
            isBaGovUrl(channel.url) ||
            channel.url === prepared.url ||
            channel.url === cartaServiceLinks[prepared.id]
          );
          return pointsToService
            ? {
                ...channel,
                value: /portal de serviços|central de atendimento/i.test(channel.value)
                  ? "BA.gov — etapa deste serviço"
                  : channel.value,
                url: baGovUrl,
              }
            : channel;
        }),
      }
    : prepared);
});
