import fs from "node:fs";
import siteContent from "../content/site.json";
import { cartaOnlyServices } from "../app/carta-service-catalog";

type CatalogService = {
  id: string;
  title: string;
  slug?: string;
  sourceRow?: number;
  destination?: string;
  url?: string;
};

type PendingRecord = {
  "Nº"?: number;
  "Serviço": string;
  "Canal oficial / 1Doc"?: string | null;
  "Legislação / fonte federal-estadual"?: string | null;
};

type Enrichment = {
  about?: string;
  eligibility?: string;
  documents?: string[];
  steps?: string[];
  where_when?: string[];
  cost?: string;
  duration?: string;
  sources?: { label?: string; url?: string }[];
  legislation?: string[];
  legislation_links?: string[];
};

const PLACEHOLDER = "* Será adicionado em breve.";
const REVIEW_DATE = "08/09/2026";

const readJson = <T>(path: string) =>
  JSON.parse(fs.readFileSync(path, "utf8")) as T;

const normalize = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value: string) =>
  normalize(value).replace(/\s+/g, "-");

const clean = (value?: string | null) =>
  value?.replace(/\s+/g, " ").trim() || "";

const isUnavailable = (value?: string | null) => {
  const text = clean(value);
  return (
    !text ||
    /^(a confirmar|indeterminado|não informado|nao informado)/i.test(text) ||
    /(ainda não (foi|foram) (definid|informad|confirmad)|não foi (definid|informad|confirmad)|não foram (definid|informad|confirmad))/i.test(
      text,
    )
  );
};

const uniqueByUrl = <T extends { url?: string }>(entries: T[]) => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.url || JSON.stringify(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const catalog = siteContent.pages[0]?.segments.find(
  (entry) => entry.type === "catalog",
);
const baseServices = (catalog?.items.filter(
  (item) => item.type === "service",
) || []) as unknown as CatalogService[];
const services = [
  ...baseServices,
  ...(cartaOnlyServices as unknown as CatalogService[]),
];

const pending = readJson<PendingRecord[]>(
  "tmp/pdf-service-gaps/pending-services.json",
);
const enrichment = readJson<Record<string, Enrichment>>(
  "tmp/pdf-service-gaps/ba-gov-enrichment.json",
);

const pendingByServiceId = new Map<string, PendingRecord>();
for (const record of pending) {
  const match =
    services.find(
      (service) => normalize(service.title) === normalize(record["Serviço"]),
    ) ||
    services.find(
      (service) => service.id === `1doc-${slugify(record["Serviço"])}`,
    ) ||
    services.find((service) => service.sourceRow === record["Nº"]);

  if (!match) {
    throw new Error(`Serviço do PDF sem correspondência: ${record["Serviço"]}`);
  }
  pendingByServiceId.set(match.id, record);
}

const details = Object.fromEntries(
  services.map((service) => {
    const record = pendingByServiceId.get(service.id);
    const source = record ? enrichment[record["Serviço"]] || {} : {};
    const documents = (source.documents || []).map(clean).filter(Boolean);
    const rawSteps = (source.steps || []).map(clean).filter(Boolean);
    const stepsDuplicateDocuments =
      rawSteps.length > 0 &&
      normalize(rawSteps.join(" ")) === normalize(documents.join(" "));
    const steps = stepsDuplicateDocuments ? [] : rawSteps;
    const whereItems = (source.where_when || []).map(clean).filter(Boolean);
    const hasConfirmedSchedule = whereItems.some(
      (item) =>
        /\b\d{1,2}(?::\d{2})?\s*(?:h|horas?)\b/i.test(item) &&
        !/não informad/i.test(item),
    );
    const whereWhen = whereItems.length
      ? `${whereItems.join(". ")}.${
          hasConfirmedSchedule
            ? ""
            : ` Horário de atendimento: ${PLACEHOLDER}`
        }`
      : PLACEHOLDER;

    const sourceChannels = (source.sources || [])
      .filter((entry) => clean(entry.url))
      .map((entry, index) => ({
        label: index === 0 ? "Referência oficial" : `Referência ${index + 1}`,
        value: clean(entry.label) || "Consultar serviço",
        url: clean(entry.url),
      }));
    const requestUrl =
      clean(record?.["Canal oficial / 1Doc"]) || clean(service.url);
    const channels = uniqueByUrl([
      ...(requestUrl
        ? [
            {
              label: "Solicitação",
              value: service.destination || "Canal oficial do serviço",
              url: requestUrl,
            },
          ]
        : []),
      ...sourceChannels,
    ]);

    const recordLegislation = (
      (record?.["Legislação / fonte federal-estadual"] || "").match(
        /https?:\/\/[^\s]+/g,
      ) || []
    ).map((url) => ({
      label: url.includes("l14133")
        ? "Lei Federal nº 14.133/2021 - Licitações e Contratos"
        : url.includes("l5172")
          ? "Lei Federal nº 5.172/1966 - Código Tributário Nacional"
          : "Legislação federal ou estadual relacionada ao serviço",
      url,
    }));
    const sourceLegislation = (source.legislation_links || []).map(
      (url, index) => ({
        label:
          clean(source.legislation?.[index]) ||
          "Legislação relacionada ao serviço",
        url,
      }),
    );
    const legislation = uniqueByUrl([
      ...recordLegislation,
      ...sourceLegislation,
    ]);

    return [
      service.id,
      {
        slug: service.slug || service.id.replace(/^(1doc|carta)-/, ""),
        destination:
          service.destination || "Canal de atendimento da Prefeitura",
        url: requestUrl || "/servicos",
        summary: isUnavailable(source.about)
          ? PLACEHOLDER
          : clean(source.about),
        eligibility: isUnavailable(source.eligibility)
          ? PLACEHOLDER
          : clean(source.eligibility),
        documents: documents.length ? documents : [PLACEHOLDER],
        steps: steps.length ? steps : [PLACEHOLDER],
        whereWhen,
        cost: isUnavailable(source.cost) ? PLACEHOLDER : clean(source.cost),
        duration: isUnavailable(source.duration)
          ? PLACEHOLDER
          : clean(source.duration),
        channels: channels.length
          ? channels
          : [{ label: "Atendimento", value: PLACEHOLDER }],
        legislation,
        legislationNotice: legislation.length ? undefined : PLACEHOLDER,
        notice:
          "Consulte as informações disponíveis nesta página e utilize o canal indicado para solicitar ou obter orientações sobre o serviço.",
        noticeAction: "Acessar o canal de atendimento ↗",
        updatedAt: REVIEW_DATE,
      },
    ];
  }),
);

fs.writeFileSync(
  "app/pending-service-details.json",
  `${JSON.stringify(details, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      services: services.length,
      pdfRecords: pending.length,
      matchedPdfRecords: pendingByServiceId.size,
      generatedDetails: Object.keys(details).length,
    },
    null,
    2,
  ),
);
