import original from "./coleta-cronograma.json" with { type: "json" };
import type { Service } from "./service-catalog";

export type CollectionSlot = { day: string; time: string };
export type CollectionRoute = { name: string; slots: CollectionSlot[] };
export type CollectionPlace = { name: string; routes: CollectionRoute[] };
export type CollectionGroup = { id: string; title: string; places: CollectionPlace[] };
export type CollectionSchedule = CollectionGroup[];
export const collectionScheduleLimit = 100000;
export const collectionIntroduction = "Escolha seu bairro, distrito ou localidade. Dentro de cada local, confira a rua ou rota antes de ver os horários.";

/** Explicit page capability, never inferred from a title or a user-supplied field. */
export function hasCollectionSchedule(service: Pick<Service, "id">) { return service.id === "1doc-limpeza-publica"; }

export function readCollectionSchedule(text: string): CollectionSchedule {
  if (text.length > collectionScheduleLimit) throw new Error("O cronograma excede o limite permitido.");
  const value: unknown = JSON.parse(text);
  const object = (entry: unknown, keys: string[]): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry) && Object.keys(entry).every((key) => keys.includes(key)));
  const textValue = (entry: unknown, max = 500): entry is string => typeof entry === "string" && entry.length <= max && !entry.includes("\0");
  const list = (entry: unknown, max: number): entry is unknown[] => Array.isArray(entry) && entry.length <= max;
  let places = 0, routes = 0, slots = 0;
  if (!list(value, 12)) throw new Error("Informe até 12 grupos no cronograma.");
  const ids = new Set<string>();
  for (const group of value) {
    if (!object(group, ["id", "title", "places"]) || !textValue(group.id, 80) || !/^[a-z0-9-]+$/.test(group.id) || ids.has(group.id) || !textValue(group.title, 200) || !list(group.places, 200)) throw new Error("Grupo do cronograma inválido.");
    ids.add(group.id); places += group.places.length;
    for (const place of group.places) {
      if (!object(place, ["name", "routes"]) || !textValue(place.name) || !list(place.routes, 100)) throw new Error("Local do cronograma inválido.");
      routes += place.routes.length;
      for (const route of place.routes) {
        if (!object(route, ["name", "slots"]) || !textValue(route.name, 2000) || !list(route.slots, 14)) throw new Error("Rota do cronograma inválida.");
        slots += route.slots.length;
        for (const slot of route.slots) if (!object(slot, ["day", "time"]) || !textValue(slot.day, 100) || !textValue(slot.time, 100)) throw new Error("Dia ou horário do cronograma inválido.");
      }
    }
  }
  if (places > 200 || routes > 500 || slots > 2000) throw new Error("O cronograma excede o limite de locais, rotas ou horários.");
  return value as CollectionSchedule;
}

export function collectionScheduleForService(service?: Service): CollectionSchedule {
  const value = service?.directEdit?.fields.collectionSchedule;
  return value !== undefined ? readCollectionSchedule(value) : original.groups;
}

/** Human-readable field differences; the stored schedule remains structured and literal. */
export function collectionScheduleDifferences(before: string, after: string) {
  function flatten(text: string) {
    const result = new Map<string, string>();
    const groups = text ? readCollectionSchedule(text) : [];
    result.set("Grupos", String(groups.length));
    groups.forEach((group, gi) => {
      const gp = `Grupo ${gi + 1}`;
      result.set(`${gp} · Nome`, group.title); result.set(`${gp} · Locais`, String(group.places.length));
      group.places.forEach((place, pi) => {
        const pp = `${gp} · Local ${pi + 1}`;
        result.set(`${pp} · Nome`, place.name); result.set(`${pp} · Rotas`, String(place.routes.length));
        place.routes.forEach((route, ri) => {
          const rp = `${pp} · Rota ${ri + 1}`;
          result.set(`${rp} · Rua ou rota`, route.name); result.set(`${rp} · Horários`, String(route.slots.length));
          route.slots.forEach((slot, si) => { result.set(`${rp} · Horário ${si + 1} · Dia`, slot.day); result.set(`${rp} · Horário ${si + 1} · Horário`, slot.time); });
        });
      });
    });
    return result;
  }
  const old = flatten(before), next = flatten(after);
  return [...new Set([...old.keys(), ...next.keys()])].filter((key) => old.get(key) !== next.get(key)).map((key) => ({ column: `Cronograma de coleta · ${key}`, before: old.get(key) ?? null, after: next.get(key) ?? null }));
}
