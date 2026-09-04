"use client";
/* eslint-disable @next/next/no-img-element -- a identidade municipal pode usar imagens incorporadas */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import siteContent from "../content/site.json";
import { approvedServiceDetails } from "./approved-service-details";
import HeaderMenu from "./header-menu";
import PortalFooter from "./portal-footer";
import SearchSuggestions from "./search-suggestions";
import { searchServices } from "./search-engine";
import { searchPath } from "./search-url";
import {
  loadServicePopularity,
  recordServiceSearch,
} from "./search-popularity-client";
import { trackSearchResults, trackServiceClick, trackServiceStart } from "./analytics";

type Size = { width?: number; height?: number };
type Position = { x?: number; y?: number };
type Item = {
  id: string;
  type: string;
  role?: string;
  label?: string;
  value?: string;
  text?: string;
  url?: string;
  src?: string;
  alt?: string;
  placeholder?: string;
  buttonText?: string;
  description?: string;
  initials?: string;
  title?: string;
  department?: string;
  category?: string;
  audienceId?: string;
  destination?: string;
  serviceId?: string;
  size?: Size;
  position?: Position;
};
type Segment = {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  mergeWithPrevious?: boolean;
  size?: Size;
  style: {
    background?: string;
    color?: string;
    accent?: string;
    width?: string;
    spacing?: string;
    radius?: string;
    variant?: string;
    headingFont?: string;
    bodyFont?: string;
    fontSize?: string;
    hoverEffect?: string;
    clickEffect?: string;
    backgroundImage?: string;
    backgroundImages?: string[];
  };
  items: Item[];
};
type Service = Item & {
  slug?: string;
  title: string;
  department: string;
  category: string;
  audienceId: string;
  audienceIds?: string[];
  destination: string;
  url: string;
  initials: string;
};
type SiteDesign = {
  theme?: string;
  palette?: string;
  headingFont?: string;
  bodyFont?: string;
  fontSize?: string;
  hoverEffect?: string;
  clickEffect?: string;
};
const page = siteContent.pages[0] as unknown as { segments: Segment[] };
const siteDesign = siteContent.site.design as SiteDesign;
const officialCategoryLabels = new Set(
  (page.segments.find((segment) => segment.type === "categories")?.items || [])
    .filter((item) => item.type === "category")
    .map((item) => item.label),
);
const audienceLabels = new Map(
  (page.segments.find((segment) => segment.type === "audiences")?.items || [])
    .filter((item) => item.type === "audience")
    .map((item) => [item.id, item.label || item.id]),
);
const searchAudiences = [...audienceLabels].map(([id, label]) => ({
  id,
  label,
}));
const searchCategories = [...officialCategoryLabels].map((label) => ({
  id: label,
  label,
}));

const items = (segment: Segment | undefined, type: string) =>
  segment?.items.filter((item) => item.type === type) || [];
const external = (url = "") =>
  /^https?:\/\//i.test(url) ? { target: "_blank", rel: "noreferrer" } : {};
const dimension = (value: unknown, minimum: number) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && number >= minimum ? number : undefined;
};
const sizeStyle = (entry?: { size?: Size }, segmentSize = false) =>
  ({
    width: dimension(entry?.size?.width, segmentSize ? 160 : 40),
    minHeight: dimension(entry?.size?.height, 32),
    maxWidth: entry?.size?.width ? "100%" : undefined,
  }) as CSSProperties;
const itemSizeProps = (entry?: Item) => {
  const x = Math.round(Number(entry?.position?.x) || 0);
  const y = Math.round(Number(entry?.position?.y) || 0);
  return {
    style: {
      ...sizeStyle(entry),
      position: x || y ? ("relative" as const) : undefined,
      zIndex: x || y ? 2 : undefined,
      transform: x || y ? `translate(${x}px,${y}px)` : undefined,
    },
    "data-editor-item-id": entry?.id,
    "data-position-x": x,
    "data-position-y": y,
    "data-user-sized-item": entry?.size ? "true" : undefined,
    "data-user-positioned-item": entry?.position ? "true" : undefined,
  };
};
const fontStacks: Record<string, string> = {
  lora: '"Lora Variable", Georgia, serif',
  source: '"Source Sans 3 Variable", "Segoe UI", sans-serif',
  segoe: '"Segoe UI", Tahoma, sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  cambria: "Cambria, Georgia, serif",
  arial: "Arial, Helvetica, sans-serif",
};
const serviceAudienceLabel = (service: Service) =>
  (service.audienceIds?.length ? service.audienceIds : [service.audienceId])
    .map((id) => audienceLabels.get(id) || id)
    .join(" · ");

function Brand({ segment }: { segment: Segment }) {
  const logo = items(segment, "image").find((item) => item.role === "logo");
  const title = segment.items.find((item) => item.role === "title");
  const subtitle = segment.items.find((item) => item.role === "subtitle");
  return (
    <span className="brand home-brand">
      {logo?.src ? (
        <img
          {...itemSizeProps(logo)}
          className="brand-image"
          src={logo.src}
          alt={logo.alt || "Bandeira de Amargosa"}
        />
      ) : (
        <span {...itemSizeProps(logo)} className="mark">
          AM
        </span>
      )}
      <span>
        <strong {...itemSizeProps(subtitle)}>
          {subtitle?.value || "Central de Serviços"}
        </strong>
        <small {...itemSizeProps(title)}>
          {title?.value || "Município de Amargosa"}
        </small>
      </span>
    </span>
  );
}

function SectionHeading({ segment }: { segment: Segment }) {
  const eyebrow = segment.items.find((item) => item.role === "eyebrow");
  const title = segment.items.find((item) => item.role === "title");
  const description = segment.items.find((item) => item.role === "description");
  return (
    <header>
      <div>
        {eyebrow?.value && (
          <span {...itemSizeProps(eyebrow)}>{eyebrow.value}</span>
        )}
        <h2 {...itemSizeProps(title)}>{title?.value || segment.name}</h2>
      </div>
      {description?.value && (
        <p {...itemSizeProps(description)}>{description.value}</p>
      )}
    </header>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [audiencesExpanded, setAudiencesExpanded] = useState(false);
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(false);
  const [servicePopularity, setServicePopularity] = useState<
    Record<string, number>
  >({});
  const segments = page.segments.filter((segment) => segment.enabled);
  const heroSegment = segments.find((segment) => segment.type === "hero");
  const heroImages =
    heroSegment?.style.backgroundImages?.filter(Boolean) ||
    (heroSegment?.style.backgroundImage
      ? [heroSegment.style.backgroundImage]
      : []);
  const catalog = page.segments.find((segment) => segment.type === "catalog");
  const services = (items(catalog, "service") as Service[]).map((service) => ({
    ...service,
    ...approvedServiceDetails[service.id],
  }));

  useEffect(() => {
    if (
      heroImages.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(
      () => setHeroSlide((current) => (current + 1) % heroImages.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [heroImages.length]);
  useEffect(() => {
    let active = true;
    void loadServicePopularity().then((counts) => {
      if (active) setServicePopularity(counts);
    });
    return () => {
      active = false;
    };
  }, []);

  function showResults(term = query) {
    const normalizedTerm = term.trim();
    const topMatch = normalizedTerm
      ? searchServices(
          services,
          normalizedTerm,
          searchAudiences,
          searchCategories,
        )[0]?.service
      : undefined;
    if (topMatch) recordServiceSearch(topMatch.id);
    if (normalizedTerm) {
      trackSearchResults(normalizedTerm, searchServices(services, normalizedTerm, searchAudiences, searchCategories).length);
    }
    window.location.assign(
      searchPath(normalizedTerm),
    );
  }
  function segmentStyle(segment: Segment) {
    return {
      "--segment-bg": segment.style.background || siteContent.site.surfaceColor,
      "--segment-color": segment.style.color || siteContent.site.textColor,
      "--segment-accent": segment.style.accent || siteContent.site.primaryColor,
      "--segment-heading-font":
        fontStacks[
          segment.style.headingFont || siteDesign.headingFont || "lora"
        ],
      "--segment-body-font":
        fontStacks[segment.style.bodyFont || siteDesign.bodyFont || "source"],
      backgroundImage: segment.style.backgroundImage
        ? `linear-gradient(rgba(3,45,35,.68),rgba(3,45,35,.68)),url(${JSON.stringify(segment.style.backgroundImage)})`
        : undefined,
      ...sizeStyle(segment, true),
    } as CSSProperties;
  }
  function mergeClasses(segment: Segment) {
    const flow = segments.filter((entry) => entry.type !== "amanda");
    const index = flow.findIndex((entry) => entry.id === segment.id);
    if (index < 0) return "";
    return `${index > 0 && segment.mergeWithPrevious ? " merge-with-previous" : ""}${flow[index + 1]?.mergeWithPrevious ? " merge-with-next" : ""}`;
  }
  function interactionClasses(segment: Segment) {
    return `segment-hover-${segment.style.hoverEffect || siteDesign.hoverEffect || "none"} segment-click-${segment.style.clickEffect || siteDesign.clickEffect || "none"}`;
  }
  function classes(segment: Segment, base: string) {
    return `${base} editable-segment segment-${segment.type} variant-${segment.style.variant || siteDesign.theme || "institutional"} width-${segment.style.width || "contained"} spacing-${segment.style.spacing || "comfortable"} radius-${segment.style.radius || "soft"} text-size-${segment.style.fontSize || siteDesign.fontSize || "normal"} ${interactionClasses(segment)}${segment.size ? " user-sized-segment" : ""}${mergeClasses(segment)}`;
  }
  function serviceCard(
    service: Service,
    index: number,
    featured = false,
    editorItem: Item = service,
  ) {
    const href = service.slug ? `/servicos/${service.slug}` : service.url;
    return (
      <a
        key={`${service.id}-${index}`}
        {...itemSizeProps(editorItem)}
        className={featured ? "featured-card" : "service-card"}
        href={href}
        {...external(href)}
        onClick={() => {
          trackServiceClick(service);
          if (/^https?:\/\//i.test(href)) trackServiceStart(service);
        }}
      >
        {featured && (
          <span className="rank">{String(index + 1).padStart(2, "0")}</span>
        )}
        <span>
          <small className="service-public-tag">
            {serviceAudienceLabel(service)}
          </small>
          <strong>{service.title}</strong>
          <em>{service.department}</em>
          {officialCategoryLabels.has(service.category) && (
            <small className="service-category-tag">{service.category}</small>
          )}
        </span>
        <b>{featured ? "→" : <>Ver serviço →</>}</b>
      </a>
    );
  }

  function renderSegment(segment: Segment): ReactNode {
    if (segment.type === "utility") {
      const label = segment.items.find((item) => item.role === "label");
      return (
        <div
          key={segment.id}
          className={classes(segment, "utility")}
          style={segmentStyle(segment)}
        >
          <span {...itemSizeProps(label)}>{label?.value}</span>
          <nav aria-label="Links de acessibilidade">
            {items(segment, "link").map((item) => (
              <a
                key={item.id}
                {...itemSizeProps(item)}
                href={item.url}
                {...external(item.url)}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      );
    }
    if (segment.type === "header")
      return (
        <header
          key={segment.id}
          className={classes(segment, "header")}
          style={segmentStyle(segment)}
        >
          <a
            href="#conteudo"
            aria-label="Página inicial da Central de Serviços"
          >
            <Brand segment={segment} />
          </a>
          <nav aria-label="Navegação principal">
            {items(segment, "link").map((item) => (
              <a
                key={item.id}
                {...itemSizeProps(item)}
                href={item.url}
                {...external(item.url)}
              >
                {item.text}
              </a>
            ))}
            <a className="accessibility-entry" href="/menu">
              Acessibilidade
            </a>
          </nav>
          <div className="header-actions">
            <HeaderMenu />
          </div>
        </header>
      );
    if (segment.type === "hero") {
      const eyebrow = segment.items.find((item) => item.role === "eyebrow");
      const title = segment.items.find((item) => item.role === "title");
      const description = segment.items.find(
        (item) => item.role === "description",
      );
      const notice = segment.items.find((item) => item.role === "notice");
      const search = items(segment, "search")[0];
      /* Bloco "Mais buscados" preservado para possível reativação.
      const featured = segments.find((entry) => entry.type === "featured");
      const fallbackShortcuts = items(featured, "serviceRef")
        .slice(0, 4)
        .map((ref) => services.find((service) => service.id === ref.serviceId))
        .filter(Boolean) as Service[];
      const measuredShortcuts = Object.entries(servicePopularity)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => services.find((service) => service.id === id))
        .filter(Boolean) as Service[];
      const shortcuts = [...measuredShortcuts, ...fallbackShortcuts]
        .filter(
          (service, index, list) =>
            list.findIndex((entry) => entry.id === service.id) === index,
        )
        .slice(0, 4);
      */
      const carousel =
        (segment.style.variant || siteDesign.theme) === "contrast"
          ? heroImages
          : [];
      return (
        <section
          key={segment.id}
          id="conteudo"
          tabIndex={-1}
          className={classes(segment, "hero")}
          style={segmentStyle(segment)}
        >
          {carousel.length > 0 && (
            <div className="hero-carousel" aria-hidden="true">
              {carousel.map((source, index) => (
                <span
                  key={`${index}-${source.slice(-18)}`}
                  className={
                    index === heroSlide % carousel.length ? "active" : ""
                  }
                  style={{ backgroundImage: `url(${JSON.stringify(source)})` }}
                />
              ))}
            </div>
          )}
          <span {...itemSizeProps(eyebrow)} className="eyebrow">
            {eyebrow?.value}
          </span>
          <h1 {...itemSizeProps(title)}>{title?.value}</h1>
          {description?.value && (
            <p {...itemSizeProps(description)}>{description.value}</p>
          )}
          <div
            className="hero-search-wrap"
            onMouseEnter={() => setSuggestionsOpen(true)}
            onMouseLeave={() => setSuggestionsOpen(false)}
            onFocusCapture={() => setSuggestionsOpen(true)}
          >
            <form
              {...itemSizeProps(search)}
              className="search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setSuggestionsOpen(false);
                showResults();
              }}
            >
              <span aria-hidden="true">⌕</span>
              <label className="sr-only" htmlFor="service-search">
                Buscar serviços, categorias ou públicos
              </label>
              <input
                id="service-search"
                maxLength={120}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSuggestionsOpen(true);
                }}
                placeholder={search?.placeholder}
                aria-controls="home-search-suggestions"
                aria-autocomplete="list"
              />
              <button type="submit">{search?.buttonText || "Buscar"}</button>
            </form>
            {suggestionsOpen && (
              <SearchSuggestions
                id="home-search-suggestions"
                query={query}
                services={services}
                audiences={searchAudiences}
                categories={searchCategories}
                popularity={servicePopularity}
                onClose={() => setSuggestionsOpen(false)}
                onSelect={(service) => {
                  setSuggestionsOpen(false);
                  recordServiceSearch(service.id);
                }}
              />
            )}
          </div>
          {/* Bloco "Mais buscados" preservado para possível reativação.
          <div className="popular" aria-label="Serviços mais buscados">
            <span>Mais buscados:</span>
            {shortcuts.map((service) => {
              const href = `/servicos/${service.slug || service.id}`;
              return (
                <a
                  key={service.id}
                  href={href}
                  onClick={() => trackServiceClick(service.id, service.title)}
                >
                  {service.title}
                </a>
              );
            })}
          </div>
          */}
          {notice?.value && (
            <small {...itemSizeProps(notice)}>{notice.value}</small>
          )}
        </section>
      );
    }
    if (segment.type === "audiences") {
      const audienceOrder = new Map([
        ["cidadao", 0],
        ["empresa", 1],
        ["servidor", 2],
        ["ouvidoria", 3],
        ["orgaos-publicos-ongs", 4],
      ]);
      const audienceItems = items(segment, "audience").sort(
        (first, second) =>
          (audienceOrder.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
          (audienceOrder.get(second.id) ?? Number.MAX_SAFE_INTEGER),
      );
      const hasMore = audienceItems.length + 1 > 4;
      return (
        <section
          key={segment.id}
          id="publicos"
          className={classes(segment, "audience-panel")}
          style={segmentStyle(segment)}
        >
          <SectionHeading segment={segment} />
          <div
            className={`audience-service-list${hasMore ? " has-more" : ""}${audiencesExpanded ? " is-expanded" : " is-collapsed"}`}
          >
            <div
              id="audience-services"
              className="audiences"
              role="group"
              aria-label="Acessar serviços por público"
            >
            {audienceItems.map((item) => (
              <button
                key={item.id}
                {...itemSizeProps(item)}
                type="button"
                onClick={() => window.location.assign(`/publicos/${item.id}`)}
              >
                <strong>{item.label}</strong>
                <small>{item.description}</small>
                <b>Ver serviços →</b>
              </button>
            ))}
            <button
              type="button"
              className="all-services-audience"
              onClick={() => window.location.assign("/servicos")}
            >
              <strong>Todos os serviços</strong>
              <small>
                Consulte o catálogo completo da Central de Serviços.
              </small>
              <b>Ver todos →</b>
            </button>
            </div>
            {hasMore && (
              <button
                type="button"
                className="audience-service-toggle"
                aria-expanded={audiencesExpanded}
                aria-controls="audience-services"
                onClick={() => setAudiencesExpanded((expanded) => !expanded)}
              >
                <span className="sr-only">
                  {audiencesExpanded
                    ? "Recolher públicos de serviços"
                    : "Mostrar mais públicos de serviços"}
                </span>
                <b aria-hidden="true">{audiencesExpanded ? "↑" : "↓"}</b>
              </button>
            )}
          </div>
        </section>
      );
    }
    if (segment.type === "featured") {
      const featured = items(segment, "serviceRef")
        .map((ref) => ({
          ref,
          service: services.find((service) => service.id === ref.serviceId),
        }))
        .filter((entry): entry is { ref: Item; service: Service } =>
          Boolean(entry.service),
        );
      const hasMore = featured.length > 3;
      return (
        <section
          key={segment.id}
          id="mais-usados"
          className={classes(segment, "section")}
          style={segmentStyle(segment)}
        >
          <SectionHeading segment={segment} />
          <div
            className={`quick-access-list${hasMore ? " has-more" : ""}${quickAccessExpanded ? " is-expanded" : " is-collapsed"}`}
          >
            <div id="quick-access-services" className="featured">
              {featured.map(({ ref, service }, index) =>
                serviceCard(service, index, true, ref),
              )}
            </div>
            {hasMore && (
              <button
                type="button"
                className="quick-access-toggle"
                aria-expanded={quickAccessExpanded}
                aria-controls="quick-access-services"
                onClick={() => setQuickAccessExpanded((expanded) => !expanded)}
              >
                <span className="sr-only">
                  {quickAccessExpanded
                    ? "Recolher serviços de acesso rápido"
                    : "Mostrar mais serviços de acesso rápido"}
                </span>
                <b aria-hidden="true">{quickAccessExpanded ? "↑" : "↓"}</b>
              </button>
            )}
          </div>
        </section>
      );
    }
    if (segment.type === "categories")
      return (
        <section
          key={segment.id}
          id="categorias"
          className={classes(segment, "categories-section")}
          style={segmentStyle(segment)}
        >
          <div className="boundary">
            <SectionHeading segment={segment} />
            <div
              className="categories"
              role="group"
              aria-label="Acessar serviços por categoria"
            >
              {items(segment, "category").map((item) => (
                <button
                  key={item.id}
                  {...itemSizeProps(item)}
                  type="button"
                  onClick={() =>
                    window.location.assign(
                      `/servicos?categoria=${item.label
                        ?.normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "")}`,
                    )
                  }
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  <b aria-hidden="true">→</b>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    if (segment.type === "help") {
      const eyebrow = segment.items.find((item) => item.role === "eyebrow");
      const title = segment.items.find((item) => item.role === "title");
      const description = segment.items.find(
        (item) => item.role === "description",
      );
      const action = items(segment, "link")[0];
      return (
        <section
          key={segment.id}
          id="ajuda"
          className={classes(segment, "help")}
          style={segmentStyle(segment)}
        >
          <div>
            <span {...itemSizeProps(eyebrow)}>{eyebrow?.value}</span>
            <h2 {...itemSizeProps(title)}>{title?.value}</h2>
            <p {...itemSizeProps(description)}>{description?.value}</p>
          </div>
          {action && (
            <a
              {...itemSizeProps(action)}
              href={action.url}
              {...external(action.url)}
            >
              {action.text}
            </a>
          )}
        </section>
      );
    }
    if (segment.type === "footer") return <PortalFooter key={segment.id} />;
    if (segment.type === "amanda") return null;
    return (
      <section
        key={segment.id}
        className={classes(segment, "generic")}
        style={segmentStyle(segment)}
      >
        <SectionHeading segment={segment} />
        <div className="generic-items">
          {segment.items.map((item) =>
            item.type === "image" && item.src ? (
              <img
                key={item.id}
                {...itemSizeProps(item)}
                src={item.src}
                alt={item.alt || ""}
              />
            ) : item.type === "link" ? (
              <a key={item.id} {...itemSizeProps(item)} href={item.url}>
                {item.text}
              </a>
            ) : (
              <p key={item.id} {...itemSizeProps(item)}>
                {item.value || item.label}
              </p>
            ),
          )}
        </div>
      </section>
    );
  }

  return (
    <main
      className={`site-root site-theme-${siteDesign.theme || "institutional"} site-palette-${siteDesign.palette || "amargosa"}`}
      style={
        {
          "--green": siteContent.site.primaryColor,
          "--red": siteContent.site.accentColor,
          "--deep": siteContent.site.deepColor,
          "--cream": siteContent.site.surfaceColor,
          "--ink": siteContent.site.textColor,
          "--muted": siteContent.site.mutedColor,
          "--site-heading-font": fontStacks[siteDesign.headingFont || "lora"],
          "--site-body-font": fontStacks[siteDesign.bodyFont || "source"],
          "--site-green": siteContent.site.primaryColor,
          "--site-red": siteContent.site.accentColor,
        } as CSSProperties
      }
    >
      <div className="skip-links" aria-label="Atalhos de navegação">
        <a className="skip" href="#conteudo">
          Ir para o conteúdo
        </a>
        <a className="skip" href="#service-search">
          Ir para a busca
        </a>
        <a className="skip" href="#publicos">
          Ir para os públicos
        </a>
      </div>
      {segments.map(renderSegment)}
    </main>
  );
}
