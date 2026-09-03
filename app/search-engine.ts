import { serviceSearchTags } from "./service-search-tags.ts";

export type SearchAudience = { id: string; label: string };
export type SearchCategory = { id: string; label: string };

export type SearchableService = {
  id: string;
  title: string;
  category: string;
  department: string;
  destination?: string;
  subject?: string;
  audienceId?: string;
  audienceIds?: string[];
  summary?: string;
  eligibility?: string;
  documents?: string[];
  steps?: string[];
  whereWhen?: string;
  cost?: string;
  duration?: string;
  channels?: { label: string; value: string }[];
  legislation?: { label: string }[];
  searchTerms?: string[];
};

export type SearchAnalysis = {
  normalized: string;
  terms: string[];
  audienceIds: string[];
  audienceLabels: string[];
  categoryLabels: string[];
};

export type SearchResult<T extends SearchableService> = {
  service: T;
  score: number;
  matchedField: string;
};

type SearchField = { label: string; value: string; weight: number };

const STOP_WORDS = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "eu",
  "fazer",
  "me",
  "meu",
  "minha",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "pela",
  "pelo",
  "por",
  "preciso",
  "quero",
  "que",
  "servico",
  "servicos",
  "solicitar",
  "um",
  "uma",
]);

const AUDIENCE_ALIASES: Record<string, string[]> = {
  cidadao: ["cidadao", "cidadaos", "pessoa fisica", "morador", "moradores"],
  empresa: [
    "empresa",
    "empresas",
    "empresario",
    "empresarios",
    "comercio",
    "comerciante",
    "negocio",
    "cnpj",
  ],
  servidor: [
    "servidor",
    "servidores",
    "funcionario publico",
    "funcionarios publicos",
  ],
  "orgaos-publicos-ongs": ["orgao publico", "orgaos publicos", "ong", "ongs"],
  ouvidoria: ["ouvidoria", "reclamacao", "denuncia", "elogio", "sugestao"],
  "precatorio-fundef": ["precatorio fundef", "fundef"],
};

const TERM_SYNONYMS: Record<string, string[]> = {
  agua: ["abastecimento"],
  arvore: ["poda"],
  arvores: ["poda"],
  cadastro: ["inscricao"],
  cemiterio: ["sepultamento", "carneira"],
  certidao: ["declaracao", "comprovacao"],
  comprovante: ["comprovacao", "certidao"],
  endereco: ["imovel", "residencia"],
  entulho: ["entulhos", "limpeza", "residuos"],
  entulhos: ["entulho", "limpeza", "residuos"],
  escola: ["escolar", "requerimento"],
  escolar: ["escola", "requerimento"],
  funeral: ["sepultamento", "carneira"],
  iluminacao: ["lampada", "lampadas", "poste", "manutencao"],
  imposto: ["tributo", "tributos", "iptu", "iss", "itbi", "itiv"],
  lampada: ["lampadas", "iluminacao", "poste"],
  lampadas: ["lampada", "iluminacao", "poste"],
  lixo: ["limpeza", "entulho", "residuos"],
  lote: ["lotes", "imovel", "imobiliaria", "fundiaria"],
  lotes: ["lote", "imovel", "imobiliaria", "fundiaria"],
  matricula: ["escolar", "requerimento"],
  multa: ["autuacao", "infracao", "transito", "jari", "cetran"],
  poste: ["iluminacao", "lampada", "lampadas"],
  residencia: ["endereco", "imovel"],
  rua: ["via", "publica"],
  taxa: ["taxas", "tributo", "tributos"],
  terreno: ["lote", "imovel", "fundiaria"],
};

const PHRASE_EXPANSIONS: Array<{ phrases: string[]; terms: string[] }> = [
  {
    phrases: ["poste apagado", "rua escura", "luz queimada"],
    terms: ["iluminacao", "lampada", "poste"],
  },
  {
    phrases: ["abrir empresa", "abrir comercio"],
    terms: ["alvara", "funcionamento", "cadastro", "economico"],
  },
  {
    phrases: ["tirar entulho", "recolher entulho"],
    terms: ["retirada", "entulhos", "limpeza"],
  },
  {
    phrases: ["documento escolar", "matricula escolar"],
    terms: ["requerimento", "escolar"],
  },
];

// Correções explícitas para siglas curtas do catálogo. Elas evitam que uma
// regra genérica de anagramas associe palavras diferentes por coincidência.
const CONTROLLED_TERM_CORRECTIONS: Record<string, string> = {
  ail: "lai",
  certan: "cetran",
  cetarn: "cetran",
  cetrna: "cetran",
  fft: "tff",
  ftf: "tff",
  ibti: "itbi",
  ial: "lai",
  iitv: "itiv",
  iput: "iptu",
  isqn: "issqn",
  isqsn: "issqn",
  isnq: "issqn",
  issnq: "issqn",
  itib: "itbi",
  itpu: "iptu",
  itvi: "itiv",
  iupt: "iptu",
  ivt: "itv",
  ivti: "itiv",
  jrai: "jari",
  jria: "jari",
  llt: "tll",
  ltl: "tll",
  nfse: "nfs",
  nsf: "nfs",
  pdc: "pcd",
  sis: "iss",
  ssi: "iss",
};

export function normalizeSearchText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `);
}

function removePhrase(text: string, phrase: string) {
  return ` ${text} `.replace(` ${phrase} `, " ").replace(/\s+/g, " ").trim();
}

function serviceAudiences(service: SearchableService) {
  return service.audienceIds?.length
    ? service.audienceIds
    : service.audienceId
      ? [service.audienceId]
      : [];
}

export function analyzeSearchQuery(
  query: string,
  audiences: SearchAudience[],
  categories: SearchCategory[],
): SearchAnalysis {
  const normalized = normalizeSearchText(query).slice(0, 120);
  let remaining = normalized;
  const audienceIds: string[] = [];
  const audienceLabels: string[] = [];
  const categoryLabels: string[] = [];

  for (const audience of audiences) {
    const aliases = [
      audience.label,
      audience.id,
      ...(AUDIENCE_ALIASES[audience.id] || []),
    ]
      .map(normalizeSearchText)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const matched = aliases.find((alias) => containsPhrase(remaining, alias));
    if (!matched) continue;
    audienceIds.push(audience.id);
    audienceLabels.push(audience.label);
    remaining = removePhrase(remaining, matched);
  }

  for (const category of categories) {
    const aliases = [category.label, category.id]
      .map(normalizeSearchText)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    const matched = aliases.find((alias) => containsPhrase(remaining, alias));
    if (!matched) continue;
    categoryLabels.push(category.label);
    remaining = removePhrase(remaining, matched);
  }

  const terms = remaining
    .split(" ")
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
    .map((term) => CONTROLLED_TERM_CORRECTIONS[term] || term);
  for (const expansion of PHRASE_EXPANSIONS) {
    if (
      expansion.phrases.some((phrase) =>
        normalized.includes(normalizeSearchText(phrase)),
      )
    )
      terms.push(...expansion.terms);
  }

  return {
    normalized,
    terms: [...new Set(terms)],
    audienceIds,
    audienceLabels,
    categoryLabels,
  };
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function termVariants(term: string) {
  const variants = new Set([term, ...(TERM_SYNONYMS[term] || [])]);
  if (term.length >= 5) {
    for (const [knownTerm, synonyms] of Object.entries(TERM_SYNONYMS)) {
      if (
        Math.abs(knownTerm.length - term.length) <= 2 &&
        editDistance(term, knownTerm) <= 2
      ) {
        variants.add(knownTerm);
        synonyms.forEach((synonym) => variants.add(synonym));
      }
    }
  }
  return [...variants].map(normalizeSearchText);
}

function termScore(candidate: string, fieldToken: string, weight: number) {
  if (candidate === fieldToken) return weight * 4;
  if (candidate.length >= 3 && fieldToken.startsWith(candidate))
    return weight * 3;
  if (fieldToken.length >= 4 && candidate.startsWith(fieldToken))
    return weight * 2.4;
  const threshold = candidate.length <= 4 ? 1 : 2;
  if (Math.abs(candidate.length - fieldToken.length) > threshold) return 0;
  const distance = editDistance(candidate, fieldToken);
  return distance <= threshold ? weight * (distance === 1 ? 2 : 1.25) : 0;
}

function searchableFields(
  service: SearchableService,
  audienceLabels: string[],
): SearchField[] {
  const invisibleTags = serviceSearchTags(service);
  return [
    { label: "nome do serviço", value: service.title, weight: 12 },
    {
      label: "palavras-chave",
      value: [
        ...(service.searchTerms || []),
        ...invisibleTags,
        service.subject || "",
      ].join(" "),
      weight: 9,
    },
    { label: "categoria", value: service.category, weight: 7 },
    { label: "público", value: audienceLabels.join(" "), weight: 7 },
    { label: "descrição", value: service.summary || "", weight: 6 },
    {
      label: "quem pode solicitar",
      value: service.eligibility || "",
      weight: 5,
    },
    {
      label: "documentos necessários",
      value: service.documents?.join(" ") || "",
      weight: 4,
    },
    {
      label: "como solicitar",
      value: service.steps?.join(" ") || "",
      weight: 4,
    },
    {
      label: "onde e quando solicitar",
      value: service.whereWhen || "",
      weight: 3,
    },
    { label: "órgão responsável", value: service.department, weight: 3 },
    {
      label: "canal de atendimento",
      value: `${service.destination || ""} ${service.channels?.map((channel) => `${channel.label} ${channel.value}`).join(" ") || ""}`,
      weight: 2,
    },
    {
      label: "legislação",
      value: service.legislation?.map((law) => law.label).join(" ") || "",
      weight: 2,
    },
  ].filter((field) => field.value.trim());
}

export function rankSearchSuggestions<T extends SearchableService>(
  services: T[],
  query: string,
  audiences: SearchAudience[],
  categories: SearchCategory[],
  popularity: Record<string, number>,
  limit = 7,
) {
  return searchServices(services, query, audiences, categories)
    .map((result) => ({
      ...result,
      popularity: popularity[result.service.id] || 0,
      combinedScore:
        result.score +
        Math.min(24, Math.log2((popularity[result.service.id] || 0) + 1) * 4),
    }))
    .sort(
      (a, b) =>
        b.combinedScore - a.combinedScore ||
        b.score - a.score ||
        b.popularity - a.popularity ||
        a.service.title.localeCompare(b.service.title, "pt-BR"),
    )
    .slice(0, Math.min(7, Math.max(1, limit)));
}

export function searchServices<T extends SearchableService>(
  services: T[],
  query: string,
  audiences: SearchAudience[],
  categories: SearchCategory[],
): SearchResult<T>[] {
  const analysis = analyzeSearchQuery(query, audiences, categories);
  if (!analysis.normalized) return [];

  return services
    .flatMap((service) => {
      const serviceAudienceIds = serviceAudiences(service);
      if (
        analysis.audienceIds.length &&
        !analysis.audienceIds.some((id) => serviceAudienceIds.includes(id))
      )
        return [];
      if (
        analysis.categoryLabels.length &&
        !analysis.categoryLabels.includes(service.category)
      )
        return [];

      const audienceLabels = serviceAudienceIds.map(
        (id) => audiences.find((entry) => entry.id === id)?.label || id,
      );
      const fields = searchableFields(service, audienceLabels).map((field) => ({
        ...field,
        normalized: normalizeSearchText(field.value),
      }));
      let score =
        analysis.audienceIds.length * 30 + analysis.categoryLabels.length * 30;
      let matchedTerms = 0;
      let bestField = analysis.audienceIds.length
        ? "público"
        : analysis.categoryLabels.length
          ? "categoria"
          : "nome do serviço";
      let bestFieldScore = 0;

      const normalizedTitle = normalizeSearchText(service.title);
      if (
        analysis.normalized.length >= 3 &&
        normalizedTitle.includes(analysis.normalized)
      ) {
        score += 120;
        bestFieldScore = 120;
        bestField = "nome do serviço";
      }

      for (const term of analysis.terms) {
        const variants = termVariants(term);
        let bestTermScore = 0;
        let bestTermField = bestField;
        for (const field of fields) {
          const tokens = field.normalized.split(" ");
          for (const variant of variants) {
            for (const token of tokens) {
              const candidateScore = termScore(variant, token, field.weight);
              if (candidateScore > bestTermScore) {
                bestTermScore = candidateScore;
                bestTermField = field.label;
              }
            }
          }
        }
        if (bestTermScore > 0) {
          matchedTerms += 1;
          score += bestTermScore;
          if (bestTermScore > bestFieldScore) {
            bestFieldScore = bestTermScore;
            bestField = bestTermField;
          }
        }
      }

      const requiredMatches =
        analysis.terms.length <= 2
          ? analysis.terms.length
          : Math.ceil(analysis.terms.length * 0.67);
      if (analysis.terms.length && matchedTerms < requiredMatches) return [];
      if (
        !analysis.terms.length &&
        !analysis.audienceIds.length &&
        !analysis.categoryLabels.length
      )
        return [];
      return [{ service, score, matchedField: bestField }];
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.service.title.localeCompare(b.service.title, "pt-BR"),
    );
}
