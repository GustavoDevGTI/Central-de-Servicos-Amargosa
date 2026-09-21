import siteContent from "../content/site.json";
import { approvedServiceDetails } from "./approved-service-details";
import pendingServiceDetails from "./pending-service-details.json" with { type: "json" };
import {
  cartaOnlyServices,
  cartaServiceDestination,
  cartaServiceLinks,
} from "./carta-service-catalog";
import {
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
  updatedAt?: string;
  initials?: string;
  sourceRow?: number;
};

export const PENDING_SERVICE_INFORMATION = "* Informação a ser adicionada.";

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

const isBaGovUrl = (value?: string) =>
  Boolean(
    value &&
      !isLegacyOneDocUrl(value) &&
      /^https?:\/\/(?:(?:www\.)?servicos|cpu\d+|www)\.ba\.gov\.br(?:\/|$)/i.test(
        value,
      ),
  );

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
    return cartaUrl
      ? replaceKnownCartaReference(value, cartaUrl)
      : replacePendingReference(value);
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
    legislationNotice: removedLegislation
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

const mergedServices = [...baseServices, ...cartaOnlyServices].map(
  (service) => {
    const merged = {
      ...service,
      ...generatedDetails[service.id],
      ...approvedServiceDetails[service.id],
    };
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

export const services = mergedServices.map((service) => ({
  ...service,
  requestSystem:
    cartaServiceLinks[service.id] === service.url ||
    servicesWithoutSeiGuide.has(service.id)
      ? "other"
      : requestSystemForService(service.id),
}));
