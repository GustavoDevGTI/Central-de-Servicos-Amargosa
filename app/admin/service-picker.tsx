"use client";

import { useEffect, useRef, useState } from "react";
import type { PreviewService } from "./draft-browser";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[-_/]+/g, " ").trim();
}

export function useServiceSelection(services: PreviewService[]) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const terms = normalize(query.trim().replace(/^https?:\/\/[^/]+/i, "")).split(/\s+/).filter(Boolean);
  const choices = services.filter((service) => {
    const text = normalize(`${service.title} /servicos/${service.slug} ${service.id} ${service.sourceRow ? `ID ${service.sourceRow}` : ""}`);
    return terms.every((term) => /^\d+$/.test(term)
      ? String(service.sourceRow) === term || service.id === term
      : text.includes(term));
  });
  const selected = choices.find((service) => service.id === selectedId) || choices[0];
  return { query, setQuery, choices, selected, setSelectedId };
}

export function ServicePicker({ id, selection, totalCount }: { id: string; selection: ReturnType<typeof useServiceSelection>; totalCount: number }) {
  const { query, setQuery, choices, selected, setSelectedId } = selection;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const highlightedIndex = Math.min(highlight, Math.max(0, choices.length - 1));
  const highlightedId = choices.length ? `${id}-option-${highlightedIndex}` : undefined;
  const serviceLabel = (service: PreviewService) => `${service.inactive ? "Oculto · " : ""}${service.title} · ${service.slug}${service.sourceRow ? ` · ID ${service.sourceRow}` : ""}`;

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, highlightedId]);

  function choose(service: PreviewService) {
    setSelectedId(service.id);
    setQuery("");
    setOpen(false);
  }

  return <>
    <label htmlFor={id}>Pesquisar e selecionar serviço</label>
    <div className="admin-service-combobox" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setQuery(""); }
    }}>
      <input ref={inputRef} id={id} type="text" role="combobox" value={open ? query : selected ? serviceLabel(selected) : ""} placeholder="Nome, URL ou ID da planilha" autoComplete="off"
        aria-expanded={open} aria-autocomplete="list" aria-controls={`${id}-options`} aria-activedescendant={open ? highlightedId : undefined} aria-describedby={`${id}-count`}
        onFocus={() => { setOpen(true); setHighlight(Math.max(0, choices.findIndex((service) => service.id === selected?.id))); }}
        onClick={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setHighlight(0); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setHighlight(open ? Math.max(0, Math.min(choices.length - 1, highlightedIndex + (event.key === "ArrowDown" ? 1 : -1))) : Math.max(0, choices.findIndex((service) => service.id === selected?.id)));
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            if (choices[highlightedIndex]) choose(choices[highlightedIndex]);
          } else if (event.key === "Escape") {
            event.preventDefault(); setOpen(false); setQuery("");
          } else if (!open && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete")) {
            event.preventDefault(); setQuery(event.key.length === 1 ? event.key : ""); setHighlight(0); setOpen(true);
          }
        }} />
      <button type="button" className="admin-service-toggle" aria-label={open ? "Fechar lista de serviços" : "Abrir lista de serviços"} aria-expanded={open} aria-controls={`${id}-options`}
        onMouseDown={(event) => event.preventDefault()} onClick={() => { const next = !open; inputRef.current?.focus(); setOpen(next); }}><span aria-hidden="true">▾</span></button>
      <ul ref={listRef} id={`${id}-options`} role="listbox" aria-label="Serviços encontrados" className="admin-service-options" hidden={!open}>
        {!choices.length && <li className="admin-service-empty" role="presentation">Nenhum serviço encontrado</li>}
        {choices.map((service, index) => <li key={service.id} id={`${id}-option-${index}`} role="option" tabIndex={-1} aria-selected={index === highlightedIndex}
          onMouseDown={(event) => event.preventDefault()} onClick={() => choose(service)}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.focus(); choose(service); } }}>
          {serviceLabel(service)}
        </li>)}
      </ul>
    </div>
    <p id={`${id}-count`} className="admin-service-search-count" role="status">{choices.length} de {totalCount} páginas{query.trim() ? " encontradas" : " disponíveis"}</p>
  </>;
}
