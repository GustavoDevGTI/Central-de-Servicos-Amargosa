"use client";
import { useState } from "react";
import { readCollectionSchedule, type CollectionSchedule } from "../collection-schedule-data";

type OrderProps = { name: string; index: number; count: number; onMove: (offset: number) => void; onRemove: () => void };
function ItemActions({ name, index, count, onMove, onRemove }: OrderProps) {
  return <div className="admin-topic-actions">
    <button type="button" aria-label={`${name} · Mover para cima`} disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
    <button type="button" aria-label={`${name} · Mover para baixo`} disabled={index === count - 1} onClick={() => onMove(1)}>↓</button>
    <button type="button" aria-label={`${name} · Remover`} onClick={onRemove}>Remover</button>
  </div>;
}
function move<T>(list: T[], index: number, offset: number) {
  const next = index + offset;
  if (next >= 0 && next < list.length) [list[index], list[next]] = [list[next], list[index]];
}

/** Only the collection page exposes this structured editor; no raw JSON or layout is editable. */
export function CollectionScheduleEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState("");
  const groups = readCollectionSchedule(value);
  function update(edit: (next: CollectionSchedule) => void) {
    const next = structuredClone(groups);
    edit(next);
    const text = JSON.stringify(next);
    try { readCollectionSchedule(text); setError(""); onChange(text); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Cronograma inválido."); }
  }
  const input = (label: string, text: string, maxLength: number, onEdit: (text: string) => void) => <label><span>{label.split(" · ").at(-1)}</span><textarea aria-label={label} value={text} maxLength={maxLength} rows={2} onChange={(event) => onEdit(event.target.value)} /></label>;
  return <fieldset className="admin-collection-editor"><legend>Bairros, distritos, localidades e rotas</legend>
    {groups.map((group, gi) => <details className="admin-collection-group" key={group.id} open>
      <summary>{group.title || `Grupo ${gi + 1}`} · {group.places.length} locais</summary>
      {input(`Grupo ${gi + 1} · Nome do grupo`, group.title, 200, (text) => update((next) => { next[gi].title = text; }))}
      <ItemActions name={`Grupo ${gi + 1}`} index={gi} count={groups.length} onMove={(offset) => update((next) => move(next, gi, offset))} onRemove={() => update((next) => { next.splice(gi, 1); })} />
      {group.places.map((place, pi) => {
        const placeLabel = `Grupo ${gi + 1} · Local ${pi + 1}`;
        return <details className="admin-collection-place" key={pi}>
          <summary>{place.name || `Local ${pi + 1}`} · {place.routes.length} rotas</summary>
          {input(`${placeLabel} · Nome do local`, place.name, 500, (text) => update((next) => { next[gi].places[pi].name = text; }))}
          <ItemActions name={placeLabel} index={pi} count={group.places.length} onMove={(offset) => update((next) => move(next[gi].places, pi, offset))} onRemove={() => update((next) => { next[gi].places.splice(pi, 1); })} />
          {place.routes.map((route, ri) => {
            const routeLabel = `${placeLabel} · Rota ${ri + 1}`;
            return <fieldset className="admin-collection-route" key={ri}><legend>Rota {ri + 1}</legend>
              {input(`${routeLabel} · Rua ou rota`, route.name, 2000, (text) => update((next) => { next[gi].places[pi].routes[ri].name = text; }))}
              <ItemActions name={routeLabel} index={ri} count={place.routes.length} onMove={(offset) => update((next) => move(next[gi].places[pi].routes, ri, offset))} onRemove={() => update((next) => { next[gi].places[pi].routes.splice(ri, 1); })} />
              {route.slots.map((slot, si) => {
                const slotLabel = `${routeLabel} · Horário ${si + 1}`;
                return <div className="admin-collection-slot" key={si}>
                  {input(`${slotLabel} · Dia`, slot.day, 100, (text) => update((next) => { next[gi].places[pi].routes[ri].slots[si].day = text; }))}
                  {input(`${slotLabel} · Horário`, slot.time, 100, (text) => update((next) => { next[gi].places[pi].routes[ri].slots[si].time = text; }))}
                  <ItemActions name={slotLabel} index={si} count={route.slots.length} onMove={(offset) => update((next) => move(next[gi].places[pi].routes[ri].slots, si, offset))} onRemove={() => update((next) => { next[gi].places[pi].routes[ri].slots.splice(si, 1); })} />
                </div>;
              })}
              <button type="button" aria-label={`${routeLabel} · Adicionar dia e horário`} onClick={() => update((next) => { next[gi].places[pi].routes[ri].slots.push({ day: "", time: "" }); })}>Adicionar dia e horário</button>
            </fieldset>;
          })}
          <button type="button" aria-label={`${placeLabel} · Adicionar rota`} onClick={() => update((next) => { next[gi].places[pi].routes.push({ name: "", slots: [] }); })}>Adicionar rota</button>
        </details>;
      })}
      <button type="button" aria-label={`Grupo ${gi + 1} · Adicionar local`} onClick={() => update((next) => { next[gi].places.push({ name: "", routes: [] }); })}>Adicionar local</button>
    </details>)}
    <button type="button" onClick={() => update((next) => {
      let number = 1;
      while (next.some((group) => group.id === `grupo-${number}`)) number++;
      next.push({ id: `grupo-${number}`, title: "", places: [] });
    })}>Adicionar grupo</button>
    {error && <p className="admin-error" role="alert">{error}</p>}
  </fieldset>;
}
