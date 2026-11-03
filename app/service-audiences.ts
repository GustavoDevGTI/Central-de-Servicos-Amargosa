import siteContent from "../content/site.json";

/** Same IDs and names used by the Central's public audience navigation. */
export const serviceAudienceOptions = (siteContent.pages[0].segments.find((segment) => segment.type === "audiences")?.items || [])
  .flatMap((item) => item.type === "audience" && typeof item.label === "string" ? [{ id: item.id, label: item.label }] : []);

const historicalPatterns: Record<string, RegExp> = {
  cidadao: /\bcidadaos?\b/g,
  empresa: /\bempresas?\b/g,
  servidor: /\bservidor(?:es)?\b/g,
  "orgaos-publicos-ongs": /\borgaos? publicos?(?: e ongs?)?\b|\bongs?\b/g,
  ouvidoria: /\bouvidoria\b/g,
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

/** Read historical singular/plural labels without rewriting stored text on open. */
export function audienceSelection(value: string) {
  let remaining = normalize(value);
  const ids: string[] = [];
  let duplicate = false;
  for (const option of serviceAudienceOptions) {
    const label = normalize(option.label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = historicalPatterns[option.id] ?? new RegExp(`\\b${label}\\b`, "g");
    let count = 0;
    remaining = remaining.replace(pattern, () => { count++; return ""; });
    if (count) ids.push(option.id);
    if (count > 1) duplicate = true;
  }
  remaining = remaining.replace(/\be\b/g, "").replace(/[\s,;·/]+/g, "");
  return { ids, valid: !remaining && !duplicate && (ids.length > 0 || !value.trim()) };
}

export function audienceSelectionValue(ids: Iterable<string>) {
  const selected = new Set(ids);
  return serviceAudienceOptions.filter((option) => selected.has(option.id)).map((option) => option.label).join(", ");
}
