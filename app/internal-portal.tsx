"use client";
/* eslint-disable @next/next/no-img-element -- a identidade municipal pode usar imagens incorporadas */

import { useEffect, useMemo, useRef, useState, type AnchorHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import siteContent from "../content/site.json";
import SharedPortalFooter from "./portal-footer";

// O roteador cliente do Vinext pode cancelar a navegação ao preparar o RSC.
// Links internos simples preservam a URL e funcionam também sem JavaScript.
function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
  return <a href={href} {...props}>{children}</a>;
}

type Audience = { id: string; label: string; description?: string };
type Category = { id: string; label: string; description?: string };
type Service = { id: string; slug?: string; title: string; category: string; subject?: string; audienceId?: string; audienceIds?: string[]; department: string; destination: string; url: string; summary?: string; eligibility?: string; documents?: string[]; steps?: string[]; whereWhen?: string; cost?: string; duration?: string; channels?: { label: string; value: string; url?: string }[]; legislation?: { label: string; url: string }[]; relatedServiceIds?: string[]; notice?: string; requestLabel?: string; updatedAt?: string };
type InternalItem = { id: string; type: string; role?: string; value?: string; text?: string; url?: string; src?: string; alt?: string; placeholder?: string; buttonText?: string };
type InternalSegment = { id: string; type: string; enabled: boolean; style: { background?: string; color?: string; accent?: string; width?: string; spacing?: string; radius?: string; variant?: string; headingFont?: string; bodyFont?: string; fontSize?: string; hoverEffect?: string; clickEffect?: string; backgroundImage?: string }; items: InternalItem[] };
type Mode = "audience" | "category" | "all";
type DirectorySort = "nameAsc" | "nameDesc" | "newest" | "oldest";
type CarouselLayout = { rows: number; visibleColumns: number; gap: number };

const page = siteContent.pages[0];
const segment = (type: string) => page.segments.find((entry) => entry.type === type);
const audiences = (segment("audiences")?.items.filter((item) => item.type === "audience") || []) as unknown as Audience[];
const categories = (segment("categories")?.items.filter((item) => item.type === "category") || []) as unknown as Category[];
const officialCategoryLabels = new Set(categories.map((entry) => entry.label));
const services = (segment("catalog")?.items.filter((item) => item.type === "service") || []) as unknown as Service[];
const header = segment("header");
const directoryPage = siteContent.pages.find((entry) => entry.id === "directory");
const detailPage = siteContent.pages.find((entry) => entry.id === "service-detail");
const design = siteContent.site.design;
const fontStacks: Record<string, string> = { lora: '"Lora Variable",Georgia,serif', source: '"Source Sans 3 Variable","Segoe UI",sans-serif', segoe: '"Segoe UI",Tahoma,sans-serif', georgia: 'Georgia,"Times New Roman",serif', cambria: 'Cambria,Georgia,serif', arial: 'Arial,Helvetica,sans-serif' };
const slugify = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const serviceAudiences = (service: Service) => service.audienceIds?.length ? service.audienceIds : service.audienceId ? [service.audienceId] : [];
const serviceAudienceLabel = (service: Service) => serviceAudiences(service).map((id) => audiences.find((entry) => entry.id === id)?.label || id).join(" · ");
const serviceCreationOrder = new Map(services.map((service, index) => [service.id, index]));
const serviceHref = (service: Service) => service.slug ? `/servicos/${service.slug}` : service.url;
const serviceLinkProps = (service: Service) => service.slug ? {} : { target: "_blank", rel: "noreferrer" };
const internalSegment = (pageEntry: typeof directoryPage, type: string) => pageEntry?.segments.find((entry) => entry.type === type) as unknown as InternalSegment | undefined;
const internalText = (entry: InternalSegment | undefined, role: string, fallback: string) => entry?.items.find((item) => item.role === role)?.value || fallback;
const internalSearch = (entry: InternalSegment | undefined) => entry?.items.find((item) => item.type === "search");
function internalStyle(entry?: InternalSegment) {
  return entry ? { "--segment-bg": entry.style.background || siteContent.site.surfaceColor, "--segment-color": entry.style.color || siteContent.site.textColor, "--segment-accent": entry.style.accent || siteContent.site.primaryColor, "--segment-heading-font": fontStacks[entry.style.headingFont || design.headingFont || "lora"], "--segment-body-font": fontStacks[entry.style.bodyFont || design.bodyFont || "source"], backgroundImage: entry.style.backgroundImage ? `linear-gradient(rgba(3,45,35,.72),rgba(3,45,35,.72)),url(${JSON.stringify(entry.style.backgroundImage)})` : undefined } as CSSProperties : undefined;
}
function internalClasses(entry: InternalSegment | undefined, base: string) {
  if (!entry) return base;
  return `${base} internal-editable segment-${entry.type} variant-${entry.style.variant || design.theme || "institutional"} width-${entry.style.width || "contained"} spacing-${entry.style.spacing || "comfortable"} radius-${entry.style.radius || "square"} text-size-${entry.style.fontSize || design.fontSize || "normal"} segment-hover-${entry.style.hoverEffect || design.hoverEffect || "none"} segment-click-${entry.style.clickEffect || design.clickEffect || "none"}`;
}

function rootProps() {
  return {
    className: `site-root internal-site site-theme-${design.theme || "institutional"} site-palette-${design.palette || "amargosa"}`,
    style: { "--green": siteContent.site.primaryColor, "--red": siteContent.site.accentColor, "--deep": siteContent.site.deepColor, "--cream": siteContent.site.surfaceColor, "--ink": siteContent.site.textColor, "--muted": siteContent.site.mutedColor, "--site-heading-font": fontStacks[design.headingFont || "lora"], "--site-body-font": fontStacks[design.bodyFont || "source"] } as CSSProperties,
  };
}

function PortalHeader({ pageEntry = detailPage }: { pageEntry?: typeof directoryPage } = {}) {
  const entry = internalSegment(pageEntry, "internalHeader");
  const localLogo = entry?.items.find((item) => item.type === "image" && item.role === "logo") as (InternalItem & { src?: string; alt?: string }) | undefined;
  const homeLogo = header?.items.find((item) => item.type === "image" && item.role === "logo");
  const logo = localLogo?.src ? localLogo : homeLogo;
  const links = (entry?.items.filter((item) => item.type === "link") || []) as (InternalItem & { text?: string; url?: string })[];
  return <header className={internalClasses(entry, "internal-header")} style={internalStyle(entry)}><Link className="internal-brand" href="/">{logo?.src ? <img src={logo.src} alt={logo.alt || "Prefeitura de Amargosa"} /> : <span className="internal-mark">AM</span>}<span><strong>{internalText(entry, "title", "Município de Amargosa")}</strong><small>{internalText(entry, "subtitle", "Central de Serviços")}</small></span></Link><nav aria-label="Navegação interna">{links.map((item) => <Link key={item.id} href={item.url || "/"}>{item.text}</Link>)}</nav></header>;
}

function PortalFooter() {
  return <SharedPortalFooter />;
}

function AudienceTags({ service }: { service: Service }) {
  return <span className="service-audiences">{serviceAudiences(service).map((id) => <b key={id}>{audiences.find((entry) => entry.id === id)?.label || id}</b>)}</span>;
}

export function LegacyServiceDirectory({ mode, value }: { mode: Mode; value: string }) {
  const introSegment = internalSegment(directoryPage, "internalHero");
  const searchSegment = internalSegment(directoryPage, "contextualSearch");
  const catalogSegment = internalSegment(directoryPage, "internalCatalog");
  const searchItem = internalSearch(searchSegment);
  const audience = mode === "audience" ? audiences.find((entry) => entry.id === value) : undefined;
  const category = mode === "category" ? categories.find((entry) => slugify(entry.label) === value || entry.id === value) : undefined;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(mode === "category" ? category?.label || "todos" : "todos");
  const [audienceFilter, setAudienceFilter] = useState(mode === "audience" ? audience?.id || "todos" : "todos");
  const [sortOrder, setSortOrder] = useState("alphabetical");
  const scoped = useMemo(() => services.filter((service) => {
    const matchesAudience = audienceFilter === "todos" || serviceAudiences(service).includes(audienceFilter);
    const matchesCategory = categoryFilter === "todos" || service.category === categoryFilter;
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return matchesAudience && matchesCategory && (!normalized || `${service.title} ${service.category} ${service.department}`.toLocaleLowerCase("pt-BR").includes(normalized));
  }).sort((a, b) => sortOrder === "department" ? a.department.localeCompare(b.department, "pt-BR") : a.title.localeCompare(b.title, "pt-BR")), [audienceFilter, categoryFilter, query, sortOrder]);
  const availableCategories = categories.filter((entry) => services.some((service) => service.category === entry.label && (mode !== "audience" || serviceAudiences(service).includes(audience?.id || ""))));
  const title = internalText(introSegment, "title", "Central de serviços");
  const selectionTitle = audience?.label || category?.label || "Todos os serviços";
  const description = audience?.description || category?.description || internalText(introSegment, "description", "Encontre o serviço e acesse o canal oficial responsável.");
  return <main {...rootProps()}><a className="skip" href="#lista-servicos">Ir para os serviços</a><PortalHeader pageEntry={directoryPage}/><section className={internalClasses(introSegment, "context-heading")} style={internalStyle(introSegment)}><nav aria-label="Caminho de navegação"><Link href="/">Início</Link><span>›</span><strong>{selectionTitle}</strong></nav><h1>{title}</h1><div className="context-tabs" aria-label="Formas de navegar"><Link className={mode === "category" ? "active" : ""} href="/#categorias">Por categorias</Link><Link className={mode === "audience" ? "active" : ""} href="/#publicos">Por públicos</Link><span>Por órgãos responsáveis</span><span>Por iniciais (A–Z)</span></div></section><section className={internalClasses(searchSegment, "context-search")} style={internalStyle(searchSegment)} aria-labelledby="context-search-title"><header className="context-selection"><div><small>{mode === "audience" ? "PÚBLICO SELECIONADO" : "CATEGORIA SELECIONADA"}</small><strong id="context-search-title">{selectionTitle}</strong><span>{scoped.length} serviço{scoped.length === 1 ? "" : "s"}</span></div><p>{description}</p></header><div className="context-filter-grid"><label className="context-query"><span>Buscar por serviço</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchItem?.placeholder || "Digite para buscar"} /></label>{mode === "audience" && <label>{internalText(searchSegment, "categoryLabel", "Categoria")}<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="todos">Todas as categorias</option>{availableCategories.map((entry) => <option key={entry.id} value={entry.label}>{entry.label}</option>)}</select></label>}{mode === "category" && <label>{internalText(searchSegment, "audienceLabel", "Público")}<select value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}><option value="todos">Todos os públicos</option>{audiences.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>}<label>Ordenar por<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="alphabetical">Ordem alfabética</option><option value="department">Órgão responsável</option></select></label><button type="button" onClick={() => { setQuery(""); setCategoryFilter(mode === "category" ? category?.label || "todos" : "todos"); setAudienceFilter(mode === "audience" ? audience?.id || "todos" : "todos"); }}>{searchItem?.buttonText || "Limpar filtros"}</button></div></section><section id="lista-servicos" className={internalClasses(catalogSegment, "context-results")} style={internalStyle(catalogSegment)}><header><p>Exibindo <strong>{scoped.length}</strong> resultado{scoped.length === 1 ? "" : "s"}</p><b role="status" aria-live="polite">{selectionTitle}</b></header><div className="context-service-grid">{scoped.map((service) => <Link className="context-service-card" key={service.id} href={serviceHref(service)} {...serviceLinkProps(service)}><i aria-hidden="true">+</i><span><small className="service-public-tag">{serviceAudienceLabel(service)}</small><strong>{service.title}</strong><em>{service.department}</em>{officialCategoryLabels.has(service.category) && <small className="service-category-tag">{service.category}</small>}</span><b>{internalText(catalogSegment, "action", "Acessar →")}</b></Link>)}</div>{scoped.length === 0 && <p className="context-empty">{internalText(catalogSegment, "empty", "Nenhum serviço corresponde aos filtros escolhidos.")}</p>}</section><PortalFooter/></main>;
}

export function ServiceDirectory({ mode, value, initialQuery = "" }: { mode: Mode; value: string; initialQuery?: string }) {
  const introSegment = internalSegment(directoryPage, "internalHero");
  const searchSegment = internalSegment(directoryPage, "contextualSearch");
  const catalogSegment = internalSegment(directoryPage, "internalCatalog");
  const searchItem = internalSearch(searchSegment);
  const audience = mode === "audience" ? audiences.find((entry) => entry.id === value) : undefined;
  const category = mode === "category" ? categories.find((entry) => slugify(entry.label) === value || entry.id === value) : undefined;
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(category?.label || "todos");
  const [audienceFilter, setAudienceFilter] = useState(audience?.id || "todos");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [sortMode, setSortMode] = useState<DirectorySort>("nameAsc");
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselColumn, setCarouselColumn] = useState(0);
  const [carouselLayout, setCarouselLayout] = useState<CarouselLayout>({ rows: 3, visibleColumns: 4, gap: 16 });
  const resetCarouselPosition = () => {
    setCarouselColumn(0);
    carouselRef.current?.scrollTo({ left: 0, behavior: "auto" });
  };
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const updateLayout = () => {
      setCarouselLayout(mobile.matches ? { rows: 2, visibleColumns: 2, gap: 12 } : { rows: 3, visibleColumns: 4, gap: 16 });
      setCarouselColumn(0);
      carouselRef.current?.scrollTo({ left: 0, behavior: "auto" });
    };
    updateLayout();
    mobile.addEventListener("change", updateLayout);
    return () => mobile.removeEventListener("change", updateLayout);
  }, []);
  const departments = useMemo(() => [...new Set(services
    .filter((service) => (categoryFilter === "todos" || service.category === categoryFilter)
      && (audienceFilter === "todos" || serviceAudiences(service).includes(audienceFilter)))
    .map((service) => service.department))]
    .sort((a, b) => a.localeCompare(b, "pt-BR")), [audienceFilter, categoryFilter]);
  const scoped = useMemo(() => services.filter((service) => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return (audienceFilter === "todos" || serviceAudiences(service).includes(audienceFilter))
      && (categoryFilter === "todos" || service.category === categoryFilter)
      && (departmentFilter === "todos" || service.department === departmentFilter)
      && (!normalized || `${service.title} ${service.category} ${service.department}`.toLocaleLowerCase("pt-BR").includes(normalized));
  }).sort((a, b) => {
    if (sortMode === "newest") return (serviceCreationOrder.get(b.id) || 0) - (serviceCreationOrder.get(a.id) || 0);
    if (sortMode === "oldest") return (serviceCreationOrder.get(a.id) || 0) - (serviceCreationOrder.get(b.id) || 0);
    const alphabetical = a.title.localeCompare(b.title, "pt-BR");
    return sortMode === "nameDesc" ? -alphabetical : alphabetical;
  }), [audienceFilter, categoryFilter, departmentFilter, query, sortMode]);
  const carouselTotalColumns = Math.ceil(scoped.length / carouselLayout.rows);
  const carouselMaxColumn = Math.max(0, carouselTotalColumns - carouselLayout.visibleColumns);
  const carouselVisibleStart = scoped.length ? carouselColumn * carouselLayout.rows + 1 : 0;
  const carouselVisibleEnd = Math.min(scoped.length, (carouselColumn + carouselLayout.visibleColumns) * carouselLayout.rows);
  const carouselStep = () => {
    const container = carouselRef.current;
    return container ? (container.clientWidth + carouselLayout.gap) / carouselLayout.visibleColumns : 0;
  };
  const moveCarousel = (direction: -1 | 1) => {
    const nextColumn = Math.min(carouselMaxColumn, Math.max(0, carouselColumn + direction));
    carouselRef.current?.scrollTo({ left: nextColumn * carouselStep(), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setCarouselColumn(nextColumn);
  };
  const handleCarouselScroll = () => {
    const container = carouselRef.current;
    const step = carouselStep();
    if (!container || !step) return;
    setCarouselColumn(Math.min(carouselMaxColumn, Math.max(0, Math.round(container.scrollLeft / step))));
  };
  const selectedAudience = audienceFilter === "todos" ? undefined : audiences.find((entry) => entry.id === audienceFilter);
  const selectionTitle = mode === "audience" ? selectedAudience?.label || "Todos os serviços" : categoryFilter === "todos" ? "Todos os serviços" : categoryFilter;
  const selectionOptions = mode === "audience"
    ? [{ id: "todos", label: "Todos os serviços", href: "/servicos" }, ...audiences.map((entry) => ({ id: entry.id, label: entry.label, href: `/publicos/${entry.id}` }))].filter((entry) => entry.id !== audienceFilter)
    : mode === "category"
      ? [{ id: "todos", label: "Todos os serviços", href: "/servicos" }, ...categories.map((entry) => ({ id: entry.id, label: entry.label, href: `/categorias/${slugify(entry.label)}` }))].filter((entry) => entry.label !== categoryFilter && !(entry.id === "todos" && categoryFilter === "todos"))
      : [{ id: "todos", label: "Todos os serviços", href: "/servicos" }, ...categories.map((entry) => ({ id: entry.id, label: entry.label, href: `/categorias/${slugify(entry.label)}` }))].filter((entry) => entry.label !== categoryFilter && !(entry.id === "todos" && categoryFilter === "todos"));
  const selectionAction = mode === "audience" ? "Alterar público" : "Alterar categoria";
  const reset = () => { setQuery(""); setCategoryFilter(mode === "category" ? categoryFilter : "todos"); setAudienceFilter(mode === "audience" ? audienceFilter : "todos"); setDepartmentFilter("todos"); resetCarouselPosition(); };
  const selectDirectory = (option: { id: string; label: string; href: string }) => {
    setQuery("");
    setDepartmentFilter("todos");
    if (mode === "audience") {
      setAudienceFilter(option.id);
      setCategoryFilter("todos");
    } else {
      setCategoryFilter(option.id === "todos" ? "todos" : option.label);
      setAudienceFilter("todos");
    }
    setSelectionOpen(false);
    resetCarouselPosition();
    window.history.replaceState(null, "", option.href);
  };
  return <main {...rootProps()}><a className="skip" href="#lista-servicos">Ir para os serviços</a><PortalHeader pageEntry={directoryPage}/><section className={internalClasses(introSegment, "context-heading")} style={internalStyle(introSegment)}><nav aria-label="Caminho de navegação"><Link href="/">Início</Link><span>›</span><strong>{selectionTitle}</strong></nav><h1>{internalText(introSegment, "title", "Central de serviços")}</h1></section><section className={internalClasses(searchSegment, "context-search")} style={internalStyle(searchSegment)} aria-labelledby="context-search-title"><header className={`context-selection${selectionOpen ? " is-open" : ""}`}>{mode !== "all" ? <button type="button" className="context-selection-summary" aria-expanded={selectionOpen} aria-controls="context-selection-options" onClick={() => setSelectionOpen((open) => !open)}><span className="context-selection-current"><strong id="context-search-title">{selectionTitle}</strong><small>{scoped.length} serviço{scoped.length === 1 ? "" : "s"}</small></span><span className="context-selection-action">{selectionAction}<b aria-hidden="true">{selectionOpen ? "−" : "+"}</b></span></button> : <div className="context-selection-summary context-selection-static"><span className="context-selection-current"><strong id="context-search-title">{selectionTitle}</strong><small>{scoped.length} serviço{scoped.length === 1 ? "" : "s"}</small></span></div>}{selectionOpen && selectionOptions.length > 0 && <nav id="context-selection-options" className="context-selection-options" aria-label={mode === "audience" ? "Outros públicos" : "Outras categorias"}>{selectionOptions.map((option) => <Link key={option.id} href={option.href} onClick={(event) => { event.preventDefault(); selectDirectory(option); }}><span>{option.label}</span><b aria-hidden="true">→</b></Link>)}</nav>}</header><button type="button" className="context-filter-toggle" aria-expanded={filtersOpen} aria-controls="context-filters" onClick={() => setFiltersOpen((open) => !open)}><span>Buscar e filtrar</span><b aria-hidden="true">{filtersOpen ? "↑" : "↓"}</b></button><div id="context-filters" className={`context-filter-grid${filtersOpen ? " is-open" : ""}`}><label className="context-query">Buscar por serviço<input value={query} onChange={(event) => { setQuery(event.target.value); resetCarouselPosition(); }} placeholder={searchItem?.placeholder || "Digite para buscar"}/></label><label>Público<select value={audienceFilter} onChange={(event) => { setAudienceFilter(event.target.value); setDepartmentFilter("todos"); resetCarouselPosition(); }}><option value="todos">Todos</option>{audiences.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><label>Categoria<select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setDepartmentFilter("todos"); resetCarouselPosition(); }}><option value="todos">Todas</option>{categories.map((entry) => <option key={entry.id} value={entry.label}>{entry.label}</option>)}</select></label><label>Órgão responsável<select value={departmentFilter} onChange={(event) => { setDepartmentFilter(event.target.value); resetCarouselPosition(); }}><option value="todos">Todos</option>{departments.map((entry) => <option key={entry} value={entry}>{entry}</option>)}</select></label><button type="button" onClick={reset}>{searchItem?.buttonText || "Limpar"}</button></div></section><section id="lista-servicos" className={internalClasses(catalogSegment, "context-results")} style={internalStyle(catalogSegment)}><header><div className="context-results-tools"><p aria-live="polite">Exibindo <strong>{carouselVisibleStart}–{carouselVisibleEnd}</strong> de {scoped.length} resultado{scoped.length === 1 ? "" : "s"}</p><div className="context-sort" aria-label="Ordenar serviços"><button type="button" className={sortMode === "nameAsc" || sortMode === "nameDesc" ? "active" : ""} aria-pressed={sortMode === "nameAsc" || sortMode === "nameDesc"} onClick={() => { setSortMode((current) => current === "nameAsc" ? "nameDesc" : "nameAsc"); resetCarouselPosition(); }}>Nome <b aria-hidden="true">{sortMode === "nameDesc" ? "↓" : "↑"}</b></button><button type="button" className={sortMode === "newest" || sortMode === "oldest" ? "active" : ""} aria-pressed={sortMode === "newest" || sortMode === "oldest"} aria-label={sortMode === "oldest" ? "Ordenar dos serviços mais antigos para os mais novos" : "Ordenar dos serviços mais novos para os mais antigos"} onClick={() => { setSortMode((current) => current === "newest" ? "oldest" : "newest"); resetCarouselPosition(); }}>Novos <b aria-hidden="true">{sortMode === "oldest" ? "↑" : "↓"}</b></button></div></div><b role="status" aria-live="polite">{selectionTitle}</b></header><div className={`service-carousel${carouselColumn === 0 ? " at-start" : ""}${carouselColumn >= carouselMaxColumn ? " at-end" : ""}`}><button type="button" className="service-carousel-arrow previous" onClick={() => moveCarousel(-1)} disabled={carouselColumn === 0} aria-label="Mostrar coluna anterior">←</button><div ref={carouselRef} className="context-service-grid service-carousel-track" onScroll={handleCarouselScroll}>{scoped.map((service) => <Link className="context-service-card" key={service.id} href={serviceHref(service)} {...serviceLinkProps(service)}><i aria-hidden="true">+</i><span><small className="service-public-tag">{serviceAudienceLabel(service)}</small><strong>{service.title}</strong><em>{service.department}</em>{officialCategoryLabels.has(service.category) && <small className="service-category-tag">{service.category}</small>}</span><b>{internalText(catalogSegment, "action", "Acessar →")}</b></Link>)}</div><button type="button" className="service-carousel-arrow next" onClick={() => moveCarousel(1)} disabled={carouselColumn >= carouselMaxColumn} aria-label="Mostrar próxima coluna">→</button></div>{scoped.length === 0 && <p className="context-empty">{internalText(catalogSegment, "empty", "Nenhum serviço corresponde aos filtros escolhidos.")}</p>}</section><PortalFooter/></main>;
}

function RichServiceDetail({ service }: { service: Service }) {
  const heroSegment = internalSegment(detailPage, "serviceHero");
  const contentSegment = internalSegment(detailPage, "serviceContent");
  const relatedServices = services.filter((entry) => service.relatedServiceIds?.includes(entry.id));

  return <main {...rootProps()}>
    <a className="skip" href="#conteudo-servico">Ir para o conteúdo do serviço</a>
    <PortalHeader/>
    <article id="conteudo-servico" className={`${internalClasses(heroSegment, "service-detail")} service-detail-rich`} style={internalStyle(heroSegment)}>
      <header>
        <div>
          <small>Cidadão</small>
          <h1>{service.title}</h1>
          <p>{service.summary}</p>
        </div>
      </header>

      {service.notice && <a className="service-reference-notice" href={service.url} target="_blank" rel="noreferrer"><span>{service.notice}</span><small>Acessar o processo no E-SIC oficial ↗</small></a>}

      <div className={internalClasses(contentSegment, "service-detail-layout")} style={internalStyle(contentSegment)}>
        <nav aria-label="Nesta página">
          <strong>Nesta página</strong>
          <a href="#o-que-e">O que é</a>
          <a href="#quem-pode">Quem pode solicitar</a>
          <a href="#documentos">Documentos necessários</a>
          <a href="#como-solicitar">Como solicitar</a>
          {service.whereWhen && <a href="#onde-quando">Onde e quando solicitar</a>}
          {service.channels?.length && <a href="#canais">Canais de atendimento</a>}
          {service.legislation?.length && <a href="#legislacao">Legislação</a>}
          {relatedServices.length > 0 && <a href="#relacionados">Serviços relacionados</a>}
        </nav>

        <div className="service-detail-content">
          <section id="o-que-e"><h2>O que é</h2><p>{service.summary}</p></section>
          <section id="quem-pode"><h2>Quem pode solicitar</h2><p>{service.eligibility}</p></section>
          <section id="documentos"><h2>Documentos necessários</h2><ul>{service.documents?.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>
          <section id="como-solicitar"><h2>Como solicitar</h2><ol className="service-steps">{service.steps?.map((entry, index) => <li key={entry}><b>{index + 1}</b><span>{entry}</span></li>)}</ol></section>
          {service.whereWhen && <section id="onde-quando"><h2>Onde e quando solicitar</h2><p>{service.whereWhen}</p></section>}
          <section id="informacoes" className="service-facts"><div><span>Custo</span><strong>{service.cost}</strong></div><div><span>Prazo estimado</span><strong>{service.duration}</strong></div></section>
          {service.channels?.length && <section id="canais"><h2>Canais de atendimento</h2><div className="service-channel-list">{service.channels.map((channel) => <div key={channel.label}><span>{channel.label}</span>{channel.url ? <a href={channel.url} target={channel.url.startsWith("http") ? "_blank" : undefined} rel={channel.url.startsWith("http") ? "noreferrer" : undefined}>{channel.value}</a> : <strong>{channel.value}</strong>}</div>)}</div></section>}
          {service.legislation?.length && <section id="legislacao"><h2>Legislação relacionada</h2><div className="service-legislation">{service.legislation.map((law) => <a key={law.label} href={law.url} target="_blank" rel="noreferrer">{law.label}<span aria-hidden="true">↗</span></a>)}</div></section>}
          {relatedServices.length > 0 && <section id="relacionados"><h2>Serviços relacionados</h2><div className="service-related-list">{relatedServices.map((related) => <Link key={related.id} href={serviceHref(related)}><span>{related.category}</span><strong>{related.title}</strong><b>Acessar →</b></Link>)}</div></section>}
          {service.updatedAt && <small className="service-updated">Última atualização: {service.updatedAt}</small>}
        </div>
      </div>
    </article>
    <PortalFooter/>
  </main>;
}

export function ServiceDetail({ slug }: { slug: string }) {
  const heroSegment = internalSegment(detailPage, "serviceHero");
  const contentSegment = internalSegment(detailPage, "serviceContent");
  const service = services.find((entry) => (entry.slug || entry.id) === slug);
  if (!service) return <main {...rootProps()}><PortalHeader/><section className="service-not-found"><h1>Serviço não encontrado</h1><Link href="/">Voltar para a Central</Link></section><PortalFooter/></main>;
  if (service.id === "acesso-informacao") return <RichServiceDetail service={service}/>;
  const audienceLinks = serviceAudiences(service).map((id) => audiences.find((entry) => entry.id === id)).filter(Boolean) as Audience[];
  return <main {...rootProps()}><a className="skip" href="#conteudo-servico">Ir para o conteúdo do serviço</a><PortalHeader/><article id="conteudo-servico" className={internalClasses(heroSegment, "service-detail")} style={internalStyle(heroSegment)}><nav aria-label="Caminho de navegação"><Link href="/">Início</Link><span>›</span>{audienceLinks[0] && <><Link href={`/publicos/${audienceLinks[0].id}`}>{audienceLinks[0].label}</Link><span>›</span></>}<Link href={`/categorias/${slugify(service.category)}`}>{service.category}</Link><span>›</span><strong>{service.title}</strong></nav><header><div><small>{internalText(heroSegment, "eyebrow", service.category)}</small><h1>{service.title}</h1><p>{service.summary || `Consulte as orientações para ${service.title.toLocaleLowerCase("pt-BR")} e siga para o canal oficial responsável.`}</p><AudienceTags service={service}/></div><aside><span>{internalText(heroSegment, "responsibleLabel", "Órgão responsável")}</span><strong>{service.department}</strong><a href={service.url} target="_blank" rel="noreferrer">{service.destination || internalText(heroSegment, "action", "Acessar canal oficial")} ↗</a></aside></header><div className={internalClasses(contentSegment, "service-detail-layout")} style={internalStyle(contentSegment)}><nav aria-label="Nesta página"><strong>Nesta página</strong><a href="#o-que-e">{internalText(contentSegment, "aboutTitle", "O que é")}</a><a href="#quem-pode">{internalText(contentSegment, "eligibilityTitle", "Quem pode solicitar")}</a><a href="#documentos">{internalText(contentSegment, "documentsTitle", "Documentos")}</a><a href="#como-fazer">{internalText(contentSegment, "stepsTitle", "Como fazer")}</a><a href="#informacoes">Custo e prazo</a></nav><div className="service-detail-content"><section id="o-que-e"><h2>{internalText(contentSegment, "aboutTitle", "O que é")}</h2><p>{service.summary || "Página explicativa do serviço municipal e do canal responsável pelo atendimento."}</p></section><section id="quem-pode"><h2>{internalText(contentSegment, "eligibilityTitle", "Quem pode solicitar")}</h2><p>{service.eligibility || "Os critérios de atendimento devem ser confirmados com o órgão responsável antes da publicação definitiva."}</p></section><section id="documentos"><h2>{internalText(contentSegment, "documentsTitle", "Documentos necessários")}</h2>{service.documents?.length ? <ul>{service.documents.map((entry) => <li key={entry}>{entry}</li>)}</ul> : <p>A relação oficial de documentos ainda será confirmada pelo órgão responsável.</p>}</section><section id="como-fazer"><h2>{internalText(contentSegment, "stepsTitle", "Como fazer")}</h2>{service.steps?.length ? <ol>{service.steps.map((entry) => <li key={entry}>{entry}</li>)}</ol> : <ol><li>Confira os critérios e documentos.</li><li>Acesse o canal oficial indicado nesta página.</li><li>Acompanhe a solicitação diretamente no sistema responsável.</li></ol>}</section><section id="informacoes" className="service-facts"><div><span>{internalText(contentSegment, "costLabel", "Quanto custa")}</span><strong>{service.cost || "A confirmar"}</strong></div><div><span>{internalText(contentSegment, "durationLabel", "Quanto tempo leva")}</span><strong>{service.duration || "A confirmar"}</strong></div></section>{service.updatedAt && <small className="service-updated">Última atualização: {service.updatedAt}</small>}</div></div></article><PortalFooter/></main>;
}

export { audiences, categories, services, slugify };
