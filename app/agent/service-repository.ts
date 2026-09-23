import siteContent from "../../content/site.json" with { type: "json" };
import { approvedServiceDetails } from "../approved-service-details";
import { rankSearchSuggestions } from "../search-engine";
import { services, type Service } from "../service-catalog";
import type { AgentServiceCard } from "./types";

const approvedServiceIds = new Set(Object.keys(approvedServiceDetails));
const page = siteContent.pages[0];
const audienceSegment = page?.segments.find((segment) => segment.type === "audiences");
const audiences = (audienceSegment?.items || [])
  .filter((item) => item.type === "audience")
  .flatMap((item) =>
    item.id && item.label ? [{ id: item.id, label: item.label }] : [],
  );
const categories = [...new Set(services.map((service) => service.category))].map(
  (label) => ({ id: normalize(label).replace(/\s+/g, "-"), label }),
);

const missingInformationPattern =
  /(?:será adicionado em breve|informação a ser adicionada|não informad[oa]|ainda não (?:foi|foram) (?:definid|informad|confirmad))/i;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function officialText(value?: string) {
  const text = value?.trim();
  return text && !missingInformationPattern.test(text) ? text : null;
}

function officialList(values?: string[]) {
  return (values || []).filter(
    (value) => Boolean(officialText(value)),
  );
}

function hasEvery(text: string, words: string[]) {
  return words.every((word) => text.includes(word));
}

export function expandServiceSearchTerms(term: string) {
  const normalized = normalize(term);
  const variants = [term.trim()];
  const add = (...entries: string[]) => variants.push(...entries);

  if (
    normalized.includes("iptu") ||
    (hasEvery(normalized, ["boleto", "casa"]) ||
      hasEvery(normalized, ["carne", "imovel"]) ||
      hasEvery(normalized, ["carne", "casa"]))
  ) {
    add("2ª via do IPTU", "IPTU imposto imóvel");
  }

  if (
    hasEvery(normalized, ["abrir", "loja"]) ||
    hasEvery(normalized, ["abrir", "empresa"]) ||
    normalized.includes("abertura de empresa") ||
    hasEvery(normalized, ["abrir", "comercio"]) ||
    hasEvery(normalized, ["abrir", "restaurante"])
  ) {
    add("Alvará de funcionamento", "Inscrição municipal cadastro econômico");
    if (normalized.includes("restaurante")) add("Alvará sanitário");
  }

  if (normalized.includes("lampada") || normalized.includes("iluminacao publica")) {
    add("Troca de lâmpadas");
  }

  if (normalized.includes("nota fiscal") || normalized.includes("nfse")) {
    add("NFS-e nota fiscal de serviço");
  }

  if (normalized.includes("podar") || normalized.includes("poda de arvore")) {
    add("Poda de árvores");
  }

  return [...new Set(variants.filter(Boolean))].slice(0, 4);
}

function internalServiceUrl(service: Service) {
  return `/servicos/${encodeURIComponent(service.slug || service.id)}`;
}

export function serviceCard(service: Service): AgentServiceCard {
  const approved = approvedServiceIds.has(service.id);
  return {
    id: service.id,
    title: service.title,
    url: internalServiceUrl(service),
    category: service.category,
    department: service.department,
    summary: approved ? officialText(service.summary) : null,
    detailsStatus: approved ? "approved" : "pending",
  };
}

export type AgentServiceDetail = AgentServiceCard & {
  eligibility: string | null;
  documents: string[];
  steps: string[];
  whereWhen: string | null;
  cost: string | null;
  duration: string | null;
  channels: { label: string; value: string; url?: string }[];
  legislation: { label: string; url: string }[];
  updatedAt: string | null;
};

export function getServiceById(id: string): AgentServiceDetail | null {
  const service = services.find((entry) => entry.id === id);
  if (!service) return null;
  const approved = approvedServiceIds.has(service.id);
  const card = serviceCard(service);

  if (!approved) {
    return {
      ...card,
      eligibility: null,
      documents: [],
      steps: [],
      whereWhen: null,
      cost: null,
      duration: null,
      channels: [],
      legislation: [],
      updatedAt: null,
    };
  }

  return {
    ...card,
    eligibility: officialText(service.eligibility),
    documents: officialList(service.documents),
    steps: officialList(service.steps),
    whereWhen: officialText(service.whereWhen),
    cost: officialText(service.cost),
    duration: officialText(service.duration),
    channels: (service.channels || []).filter(
      (channel) => Boolean(officialText(channel.value)),
    ),
    legislation: service.legislation || [],
    updatedAt: officialText(service.updatedAt),
  };
}

export function findServices(term: string, audienceId?: string, limit = 5) {
  const candidates = new Map<
    string,
    { service: Service; score: number; matchedField: string }
  >();

  for (const [variantIndex, variant] of expandServiceSearchTerms(term).entries()) {
    const results = rankSearchSuggestions(
      services,
      variant,
      audiences,
      categories,
      {},
      7,
    );

    for (const result of results) {
      if (result.combinedScore < 40) continue;
      if (
        audienceId &&
        !(result.service.audienceIds || [result.service.audienceId]).includes(audienceId)
      ) {
        continue;
      }
      const exactExpandedTitle = normalize(variant) === normalize(result.service.title);
      const semanticPriority = variantIndex > 0 ? 240 / variantIndex : 0;
      const score =
        result.combinedScore +
        semanticPriority +
        (exactExpandedTitle ? 80 : 0);
      const current = candidates.get(result.service.id);
      if (!current || score > current.score) {
        candidates.set(result.service.id, {
          service: result.service,
          score,
          matchedField: result.matchedField,
        });
      }
    }
  }

  return [...candidates.values()]
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.service.title.localeCompare(second.service.title, "pt-BR"),
    )
    .slice(0, Math.min(Math.max(limit, 1), 5))
    .map((result) => ({
      ...serviceCard(result.service),
      matchedField: result.matchedField,
    }));
}

export const knownAudienceIds = audiences.map((audience) => audience.id);
