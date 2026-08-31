"use client";

import type { MouseEvent } from "react";
import {
  rankSearchSuggestions,
  type SearchAudience,
  type SearchCategory,
  type SearchableService,
} from "./search-engine";

type SuggestionService = SearchableService & { slug?: string; url: string };

export default function SearchSuggestions({
  query,
  services,
  audiences,
  categories,
  popularity,
  onSelect,
  id = "search-suggestions",
}: {
  query: string;
  services: SuggestionService[];
  audiences: SearchAudience[];
  categories: SearchCategory[];
  popularity: Record<string, number>;
  onSelect?: (
    service: SuggestionService,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
  id?: string;
}) {
  if (query.trim().length < 2) return null;
  const suggestions = rankSearchSuggestions(
    services,
    query,
    audiences,
    categories,
    popularity,
    7,
  );
  if (!suggestions.length) return null;

  return (
    <div
      id={id}
      className="search-suggestions"
      role="listbox"
      aria-label="Buscas relacionadas"
    >
      <small>Buscas relacionadas</small>
      {suggestions.map(({ service }) => {
        const href = service.slug ? `/servicos/${service.slug}` : service.url;
        const serviceAudienceIds = service.audienceIds?.length
          ? service.audienceIds
          : service.audienceId
            ? [service.audienceId]
            : [];
        const publicLabel = serviceAudienceIds
          .map((audienceId) =>
            audiences.find((audience) => audience.id === audienceId)?.label,
          )
          .filter(Boolean)
          .join(" · ");
        return (
          <a
            key={service.id}
            role="option"
            aria-selected="false"
            href={href}
            target={service.slug ? undefined : "_blank"}
            rel={service.slug ? undefined : "noreferrer"}
            onClick={(event) => onSelect?.(service, event)}
          >
            <strong>{service.title}</strong>
            <span className="search-suggestion-meta">
              <em>
                <b>Público:</b> {publicLabel || "Não informado"}
              </em>
              <em>
                <b>Categoria:</b> {service.category}
              </em>
              <em>
                <b>Órgão responsável:</b> {service.department}
              </em>
            </span>
          </a>
        );
      })}
    </div>
  );
}
