"use client";
/* eslint-disable @next/next/no-img-element -- imagens locais do construtor usam data URLs */

import { useState, type CSSProperties, type ReactNode } from "react";
import siteContent from "../content/site.json";

type Item = {
  id: string; type: string; role?: string; label?: string; value?: string; text?: string; url?: string;
  src?: string; alt?: string; placeholder?: string; buttonText?: string; description?: string; initials?: string;
  title?: string; department?: string; category?: string; audienceId?: string; destination?: string; serviceId?: string;
};
type Segment = {
  id: string; name: string; type: string; enabled: boolean;
  style: { background?: string; color?: string; accent?: string; width?: string; spacing?: string; radius?: string; backgroundImage?: string };
  items: Item[];
};
type Service = Item & { title: string; department: string; category: string; audienceId: string; destination: string; url: string; initials: string };

const page = siteContent.pages[0] as unknown as { id: string; name: string; slug: string; segments: Segment[] };

function byRole(segment: Segment, role: string) { return segment.items.find((item) => item.role === role); }
function entries(segment: Segment, type: string) { return segment.items.filter((item) => item.type === type); }
function text(segment: Segment, role: string, fallback = "") { return byRole(segment, role)?.value || fallback; }
function isExternal(url = "") { return /^https?:\/\//i.test(url); }
function linkProps(url = "") { return isExternal(url) ? { target: "_blank", rel: "noreferrer" } : {}; }

function Brand({ segment }: { segment: Segment }) {
  const logo = entries(segment, "image").find((item) => item.role === "logo");
  return <span className="brand">
    {logo?.src ? <img className="brand-image" src={logo.src} alt={logo.alt || "Logo"} /> : <span className="brand-mark">AM</span>}
    <span><small>{text(segment, "brandLine", "Prefeitura de")}</small><strong>{text(segment, "municipality", "Amargosa")}</strong><em>{text(segment, "subtitle", "Central de Serviços")}</em></span>
  </span>;
}

function Heading({ segment }: { segment: Segment }) {
  return <header className="section-heading"><div><span className="section-kicker">{text(segment, "eyebrow")}</span><h2>{text(segment, "title", segment.name)}</h2></div>{text(segment, "description") && <p>{text(segment, "description")}</p>}</header>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("todos");
  const [category, setCategory] = useState("todos");
  const segments = page.segments.filter((segment) => segment.enabled);
  const catalog = segments.find((segment) => segment.type === "catalog");
  const audienceSegment = segments.find((segment) => segment.type === "audiences");
  const services = (catalog ? entries(catalog, "service") : []) as Service[];
  const audienceItems = audienceSegment ? entries(audienceSegment, "audience") : [];

  const results = (() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return services.filter((service) => {
      const searchable = `${service.title} ${service.department} ${service.category} ${service.destination}`.toLocaleLowerCase("pt-BR");
      return (audience === "todos" || service.audienceId === audience) && (category === "todos" || service.category === category) && (!normalized || searchable.includes(normalized));
    });
  })();

  function scrollToCatalog() { document.querySelector("#todos-os-servicos")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function segmentStyle(segment: Segment) {
    const backgroundImage = segment.style.backgroundImage ? `linear-gradient(rgba(3,57,45,.76),rgba(3,57,45,.76)),url(${JSON.stringify(segment.style.backgroundImage).slice(1, -1)})` : undefined;
    return { "--segment-bg": segment.style.background, "--segment-color": segment.style.color, "--segment-accent": segment.style.accent, backgroundImage } as CSSProperties;
  }
  function frame(segment: Segment, children: ReactNode, className = "") {
    return <section key={segment.id} id={segment.id === "catalog" ? "todos-os-servicos" : segment.id} className={`editable-segment segment-${segment.type} width-${segment.style.width || "contained"} spacing-${segment.style.spacing || "comfortable"} radius-${segment.style.radius || "soft"} ${className}`} style={segmentStyle(segment)}>{children}</section>;
  }

  function renderSegment(segment: Segment) {
    if (segment.type === "utility") return frame(segment, <div className="boundary utility-inner"><span>{text(segment, "label")}</span><nav>{entries(segment, "link").map((item) => <a key={item.id} href={item.url} {...linkProps(item.url)}>{item.text}</a>)}</nav></div>, "utility-bar");
    if (segment.type === "header") return <header key={segment.id} className="portal-header editable-segment" style={segmentStyle(segment)}><div className="boundary header-inner"><a href="#" aria-label="Página inicial"><Brand segment={segment} /></a><nav className="main-nav">{entries(segment, "link").map((item) => <a key={item.id} href={item.url} {...linkProps(item.url)}>{item.text}</a>)}</nav><button className="menu-button" type="button">☰ <span>Menu</span></button></div></header>;
    if (segment.type === "hero") {
      const search = entries(segment, "search")[0];
      const featuredSegment = segments.find((item) => item.type === "featured");
      const shortcuts = featuredSegment ? entries(featuredSegment, "serviceRef").slice(0, 4).map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean) as Service[] : [];
      return frame(segment, <><div className="hero-pattern" aria-hidden="true"><i></i><i></i><i></i></div><div className="boundary hero-content"><span className="hero-eyebrow">{text(segment, "eyebrow")}</span><h1>{text(segment, "title")}</h1><p>{text(segment, "description")}</p><label className="main-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={search?.placeholder} aria-label="Buscar serviços" />{query && <button className="clear-search" type="button" onClick={() => setQuery("")}>×</button>}<a href="#todos-os-servicos">{search?.buttonText || "Buscar"}</a></label><div className="popular-shortcuts"><span>Mais buscados:</span>{shortcuts.map((service) => <button key={service.id} type="button" onClick={() => { setQuery(service.title); setAudience("todos"); setCategory("todos"); scrollToCatalog(); }}>{service.title}</button>)}</div><small className="privacy-message">{text(segment, "notice")}</small></div></>, "search-hero");
    }
    if (segment.type === "audiences") return frame(segment, <div className="boundary audience-panel"><header className="panel-heading"><div><span>{text(segment, "eyebrow")}</span><h2>{text(segment, "title")}</h2></div><p>{text(segment, "description")}</p></header><div className="audience-grid">{entries(segment, "audience").map((item) => { const count = services.filter((service) => service.audienceId === item.id).length; return <button key={item.id} type="button" className={audience === item.id ? "active" : ""} onClick={() => { setAudience(item.id); setCategory("todos"); scrollToCatalog(); }}><span className="audience-icon">{item.initials}</span><span className="audience-copy"><strong>{item.label}</strong><small>{item.description}</small><em>{count} serviço{count === 1 ? "" : "s"} →</em></span></button>; })}</div></div>, "audience-section");
    if (segment.type === "featured") return frame(segment, <div className="boundary"><Heading segment={segment} /><div className="most-used-grid">{entries(segment, "serviceRef").map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean).map((service, index) => { const item = service as Service; return <a key={`${item.id}-${index}`} className="most-used-card" href={item.url} {...linkProps(item.url)}><span className="rank">{String(index + 1).padStart(2, "0")}</span><span className="service-symbol">{item.initials}</span><span><small>{item.category}</small><strong>{item.title}</strong><em>{item.department}</em></span><b>↗</b></a>; })}</div></div>, "most-used-section");
    if (segment.type === "categories") return frame(segment, <div className="boundary"><Heading segment={segment} /><div className="category-grid">{entries(segment, "category").map((item) => <button key={item.id} type="button" className={category === item.label ? "active" : ""} onClick={() => { setCategory(item.label || "todos"); setAudience("todos"); scrollToCatalog(); }}><span className="category-mark">{item.initials}</span><span><strong>{item.label}</strong><small>{item.description}</small></span><b>→</b></button>)}</div></div>, "category-section");
    if (segment.type === "catalog") {
      const selectedAudience = audienceItems.find((item) => item.id === audience)?.label;
      const title = audience !== "todos" ? `Serviços para ${selectedAudience}` : category !== "todos" ? category : query ? "Resultado da busca" : text(segment, "title", "Todos os serviços");
      return frame(segment, <div className="boundary"><header className="results-heading"><div><span className="section-kicker">{text(segment, "eyebrow")}</span><h2>{title}</h2></div><div className="active-filters">{(audience !== "todos" || category !== "todos" || query) && <button type="button" onClick={() => { setAudience("todos"); setCategory("todos"); setQuery(""); }}>Limpar filtros ×</button>}<span>{results.length} encontrado{results.length === 1 ? "" : "s"}</span></div></header><div className="service-list">{results.map((service) => <a key={service.id} href={service.url} {...linkProps(service.url)}><span className="service-symbol">{service.initials}</span><span className="service-main"><small>{service.category}</small><strong>{service.title}</strong><em>{service.department}</em></span><span className="destination"><small>Canal responsável</small><strong>{service.destination}</strong></span><b>↗</b></a>)}</div>{results.length === 0 && <div className="empty-state"><strong>Nenhum serviço encontrado.</strong><p>Tente outro termo ou limpe os filtros.</p><button type="button" onClick={() => { setAudience("todos"); setCategory("todos"); setQuery(""); }}>Mostrar todos</button></div>}</div>, "all-services");
    }
    if (segment.type === "help") { const action = entries(segment, "link").find((item) => item.role === "action"); return frame(segment, <div className="boundary help-inner"><div><span className="section-kicker">{text(segment, "eyebrow")}</span><h2>{text(segment, "title")}</h2><p>{text(segment, "description")}</p></div>{action && <a href={action.url} {...linkProps(action.url)}>{action.text}</a>}</div>, "help-section"); }
    if (segment.type === "footer") { const header = segments.find((item) => item.type === "header"); const logo = entries(segment, "image")[0]; return <footer key={segment.id} className="portal-footer editable-segment" style={segmentStyle(segment)}><div className="boundary footer-grid"><div className="brand footer-brand">{logo?.src ? <img className="brand-image" src={logo.src} alt={logo.alt || "Logo"} /> : header ? <Brand segment={header} /> : <span className="brand-mark">AM</span>}</div><div><strong>{text(segment, "title")}</strong><p>{text(segment, "description")}</p></div><nav>{entries(segment, "link").map((item) => <a key={item.id} href={item.url} {...linkProps(item.url)}>{item.text}</a>)}</nav></div></footer>; }
    return frame(segment, <div className="boundary generic-segment"><Heading segment={segment} /><div className="generic-items">{segment.items.filter((item) => !["eyebrow", "title", "description"].includes(item.role || "")).map((item) => item.type === "image" && item.src ? <img key={item.id} src={item.src} alt={item.alt || ""} /> : item.type === "link" ? <a key={item.id} href={item.url} {...linkProps(item.url)}>{item.text}</a> : <p key={item.id}>{item.value || item.label}</p>)}</div></div>);
  }

  return <main style={{ "--green": siteContent.site.primaryColor, "--red": siteContent.site.accentColor } as CSSProperties}><a className="skip-link" href="#hero">Ir para o conteúdo</a>{segments.map(renderSegment)}</main>;
}
