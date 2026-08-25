"use client";
/* eslint-disable @next/next/no-img-element -- imagens locais do construtor usam data URLs */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import siteContent from "../content/site.json";

type Size = { width?: number; height?: number };
type Item = { id: string; type: string; role?: string; label?: string; value?: string; text?: string; url?: string; src?: string; alt?: string; placeholder?: string; buttonText?: string; description?: string; initials?: string; title?: string; department?: string; category?: string; audienceId?: string; destination?: string; serviceId?: string; size?: Size };
type Segment = { id: string; name: string; type: string; enabled: boolean; size?: Size; style: { background?: string; color?: string; accent?: string; width?: string; spacing?: string; radius?: string; variant?: string; backgroundImage?: string }; items: Item[] };
type Service = Item & { title: string; department: string; category: string; audienceId: string; destination: string; url: string; initials: string };
const page = siteContent.pages[0] as unknown as { segments: Segment[] };

const items = (segment: Segment | undefined, type: string) => segment?.items.filter((item) => item.type === type) || [];
const text = (segment: Segment | undefined, role: string, fallback = "") => segment?.items.find((item) => item.role === role)?.value || fallback;
const external = (url = "") => /^https?:\/\//i.test(url) ? { target: "_blank", rel: "noreferrer" } : {};
const dimension = (value: unknown, minimum: number) => { const number = Math.round(Number(value)); return Number.isFinite(number) && number >= minimum ? number : undefined; };
const sizeStyle = (entry?: { size?: Size }, segmentSize = false) => ({ width: dimension(entry?.size?.width, segmentSize ? 160 : 40), minHeight: dimension(entry?.size?.height, 32), maxWidth: entry?.size?.width ? "100%" : undefined }) as CSSProperties;
const itemSizeProps = (entry?: Item) => ({ style: sizeStyle(entry), "data-user-sized-item": entry?.size ? "true" : undefined });

function Brand({ segment }: { segment: Segment }) {
  const logo = items(segment, "image").find((item) => item.role === "logo");
  const brandLine = segment.items.find((item) => item.role === "brandLine"); const municipality = segment.items.find((item) => item.role === "municipality"); const subtitle = segment.items.find((item) => item.role === "subtitle");
  return <span className="brand">{logo?.src ? <img {...itemSizeProps(logo)} className="brand-image" src={logo.src} alt={logo.alt || "Logo"} /> : <span {...itemSizeProps(logo)} className="mark">AM</span>}<span><small {...itemSizeProps(brandLine)}>{brandLine?.value || "Prefeitura de"}</small><strong {...itemSizeProps(municipality)}>{municipality?.value || "Amargosa"}</strong><em {...itemSizeProps(subtitle)}>{subtitle?.value || "Central de Serviços"}</em></span></span>;
}

function SectionHeading({ segment }: { segment: Segment }) {
  const eyebrow = segment.items.find((item) => item.role === "eyebrow"); const title = segment.items.find((item) => item.role === "title"); const description = segment.items.find((item) => item.role === "description");
  return <header><div>{eyebrow?.value && <span {...itemSizeProps(eyebrow)}>{eyebrow.value}</span>}<h2 {...itemSizeProps(title)}>{title?.value || segment.name}</h2></div>{description?.value && <p {...itemSizeProps(description)}>{description.value}</p>}</header>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("todos");
  const [category, setCategory] = useState("todos");
  const [amandaOpen, setAmandaOpen] = useState(false);
  const [amandaDraft, setAmandaDraft] = useState("");
  const [amandaMessages, setAmandaMessages] = useState<Array<{ author: "user" | "amanda"; text: string }>>([]);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const amandaLauncherRef = useRef<HTMLButtonElement>(null);
  const amandaPanelRef = useRef<HTMLElement>(null);
  const segments = page.segments.filter((segment) => segment.enabled);
  const catalog = segments.find((segment) => segment.type === "catalog");
  const audiences = segments.find((segment) => segment.type === "audiences");
  const services = items(catalog, "service") as Service[];
  const audienceItems = items(audiences, "audience");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const categoryItems = items(segments.find((segment) => segment.type === "categories"), "category");
  const activeCategory = category === "todos" || categoryItems.some((item) => item.label === category) ? category : "todos";
  const results = services.filter((service) => (audience === "todos" || service.audienceId === audience) && (activeCategory === "todos" || service.category === activeCategory) && (!normalized || `${service.title} ${service.department} ${service.category} ${service.destination}`.toLocaleLowerCase("pt-BR").includes(normalized)));

  useEffect(() => {
    if (!amandaOpen) return;
    const panel = amandaPanelRef.current;
    const launcher = amandaLauncherRef.current;
    const focusable = () => [...(panel?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],textarea,input,select,[tabindex]:not([tabindex="-1"])') || [])];
    requestAnimationFrame(() => focusable()[0]?.focus());
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setAmandaOpen(false); return; }
      if (event.key !== "Tab") return;
      const controls = focusable(); if (!controls.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", containFocus);
    return () => { document.removeEventListener("keydown", containFocus); requestAnimationFrame(() => launcher?.focus()); };
  }, [amandaOpen]);
  function showResults() {
    window.setTimeout(() => {
      resultsHeadingRef.current?.focus({ preventScroll: true });
      resultsHeadingRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }, 0);
  }
  function askAmanda(question: string) { const value = question.trim(); if (!value) return; setAmandaMessages((current) => [...current, { author: "user", text: value }, { author: "amanda", text: "Minha inteligência ainda está sendo preparada. Em breve vou responder e indicar o canal oficial mais adequado para você." }]); setAmandaDraft(""); }
  function segmentStyle(segment: Segment) { return { "--segment-bg": segment.style.background, "--segment-color": segment.style.color, "--segment-accent": segment.style.accent, backgroundImage: segment.style.backgroundImage ? `url(${JSON.stringify(segment.style.backgroundImage).slice(1, -1)})` : undefined, ...sizeStyle(segment, true) } as CSSProperties; }
  function classes(segment: Segment, base: string) { return `${base} editable-segment segment-${segment.type} variant-${segment.style.variant || "institutional"} width-${segment.style.width || "contained"} spacing-${segment.style.spacing || "comfortable"} radius-${segment.style.radius || "soft"}${segment.size ? " user-sized-segment" : ""}`; }
  function serviceCard(service: Service, index: number, featured = false, editorItem: Item = service) {
    return <a key={`${service.id}-${index}`} {...itemSizeProps(editorItem)} className={featured ? "featured-card" : "service-card"} href={service.url} {...external(service.url)}>{featured && <span className="rank">{String(index + 1).padStart(2, "0")}</span>}<span><small>{service.category}</small><strong>{service.title}</strong><em>{service.department}</em></span><b>{featured ? "↗" : <>{service.destination} ↗</>}</b></a>;
  }

  function renderAmanda(segment: Segment) {
    const avatar = items(segment, "image").find((item) => item.role === "avatar"); const conversation = items(segment, "search")[0]; const prompts = segment.items.filter((item) => item.role === "prompt");
    const symbol = <span className="amanda-symbol" aria-hidden="true">{avatar?.src ? <img src={avatar.src} alt="" /> : "A"}</span>;
    return <div key={segment.id} className="amanda-widget" style={segmentStyle(segment)}><button ref={amandaLauncherRef} className={`amanda-launcher ${amandaOpen ? "open" : ""}`} type="button" onClick={() => setAmandaOpen((open) => !open)} aria-expanded={amandaOpen} aria-controls="amanda-panel" aria-haspopup="dialog">{symbol}<span><small>{text(segment, "eyebrow")}</small><strong>Amanda</strong></span><b aria-hidden="true">{amandaOpen ? "×" : "✦"}</b></button>{amandaOpen && <aside ref={amandaPanelRef} id="amanda-panel" className="amanda-panel" role="dialog" aria-modal="true" aria-labelledby="amanda-title" aria-describedby="amanda-description"><header className="amanda-header"><div className="amanda-identity">{symbol}<div><small>{text(segment, "eyebrow")}</small><strong id="amanda-title">{text(segment, "title")}</strong></div></div><button type="button" onClick={() => setAmandaOpen(false)} aria-label="Fechar conversa com Amanda">×</button></header><div className="amanda-body"><p id="amanda-description" className="amanda-intro">{text(segment, "description")}</p><div className="amanda-status" role="status"><i aria-hidden="true"></i><span>{text(segment, "status")}</span></div>{amandaMessages.length === 0 ? <div className="amanda-prompts"><small>Você pode começar por aqui</small>{prompts.map((prompt) => <button key={prompt.id} type="button" onClick={() => askAmanda(prompt.value || "")}>{prompt.value}<b aria-hidden="true">↗</b></button>)}</div> : <div className="amanda-transcript" aria-live="polite" aria-relevant="additions">{amandaMessages.map((message, index) => <article key={`${message.author}-${index}`} className={message.author}><small>{message.author === "user" ? "Você" : "Amanda"}</small><p>{message.text}</p></article>)}</div>}</div><form className="amanda-compose" onSubmit={(event) => { event.preventDefault(); askAmanda(amandaDraft); }}><label><span className="sr-only">Mensagem para Amanda</span><textarea rows={2} value={amandaDraft} onChange={(event) => setAmandaDraft(event.target.value)} placeholder={conversation?.placeholder} /></label><button type="submit" disabled={!amandaDraft.trim()}>{conversation?.buttonText || "Enviar"} <span aria-hidden="true">↗</span></button></form><small className="amanda-notice">{text(segment, "notice")}</small></aside>}</div>;
  }

  function renderSegment(segment: Segment): ReactNode {
    if (segment.type === "utility") { const label = segment.items.find((item) => item.role === "label"); return <div key={segment.id} className={classes(segment, "utility")} style={segmentStyle(segment)}><span {...itemSizeProps(label)}>{label?.value}</span><nav aria-label="Links de acessibilidade">{items(segment, "link").map((item) => <a key={item.id} {...itemSizeProps(item)} href={item.url} {...external(item.url)}>{item.text}</a>)}</nav></div>; }
    if (segment.type === "header") return <header key={segment.id} className={classes(segment, "header")} style={segmentStyle(segment)}><a href="#conteudo" aria-label="Página inicial da Central de Serviços"><Brand segment={segment} /></a><nav aria-label="Navegação principal">{items(segment, "link").map((item) => <a key={item.id} {...itemSizeProps(item)} href={item.url}>{item.text}</a>)}</nav><div className="header-actions"><a className="accessibility-entry" href="/menu">Acessibilidade</a><a className="menu" href="#categorias">☰ Menu de serviços</a></div></header>;
    if (segment.type === "hero") { const eyebrow = segment.items.find((item) => item.role === "eyebrow"); const title = segment.items.find((item) => item.role === "title"); const description = segment.items.find((item) => item.role === "description"); const notice = segment.items.find((item) => item.role === "notice"); const search = items(segment, "search")[0]; const featured = segments.find((entry) => entry.type === "featured"); const shortcuts = items(featured, "serviceRef").slice(0, 4).map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean) as Service[]; return <section key={segment.id} id="conteudo" tabIndex={-1} className={classes(segment, "hero")} style={segmentStyle(segment)}><span {...itemSizeProps(eyebrow)} className="eyebrow">{eyebrow?.value}</span><h1 {...itemSizeProps(title)}>{title?.value}</h1>{description?.value && <p {...itemSizeProps(description)}>{description.value}</p>}<form {...itemSizeProps(search)} className="search" role="search" onSubmit={(event) => { event.preventDefault(); showResults(); }}><span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="service-search">Buscar serviços</label><input id="service-search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); showResults(); } }} placeholder={search?.placeholder} /><button type="submit">{search?.buttonText || "Buscar"}</button></form><div className="popular" aria-label="Serviços mais buscados"><span>Mais buscados:</span>{shortcuts.map((service) => <button key={service.id} type="button" onClick={() => { setQuery(service.title); setAudience("todos"); setCategory("todos"); showResults(); }}>{service.title}</button>)}</div>{notice?.value && <small {...itemSizeProps(notice)}>{notice.value}</small>}</section>; }
    if (segment.type === "audiences") return <section key={segment.id} id="publicos" className={classes(segment, "audience-panel")} style={segmentStyle(segment)}><SectionHeading segment={segment} /><div className="audiences" role="group" aria-label="Filtrar serviços por público">{items(segment, "audience").map((item) => <button key={item.id} {...itemSizeProps(item)} type="button" aria-pressed={audience === item.id} onClick={() => { setAudience(item.id); setCategory("todos"); showResults(); }}><strong>{item.label}</strong><small>{item.description}</small><b>Ver serviços →</b></button>)}</div></section>;
    if (segment.type === "featured") { const featured = items(segment, "serviceRef").map((ref) => ({ ref, service: services.find((service) => service.id === ref.serviceId) })).filter((entry): entry is { ref: Item; service: Service } => Boolean(entry.service)); return <section key={segment.id} id="mais-usados" className={classes(segment, "section")} style={segmentStyle(segment)}><SectionHeading segment={segment} /><div className="featured">{featured.map(({ ref, service }, index) => serviceCard(service, index, true, ref))}</div></section>; }
    if (segment.type === "categories") return <section key={segment.id} id="categorias" className={classes(segment, "categories-section")} style={segmentStyle(segment)}><div className="boundary"><SectionHeading segment={segment} /><div className="categories" role="group" aria-label="Filtrar serviços por categoria">{items(segment, "category").map((item) => <button key={item.id} {...itemSizeProps(item)} type="button" aria-pressed={activeCategory === item.label} onClick={() => { setCategory(item.label || "todos"); setAudience("todos"); showResults(); }}><span><strong>{item.label}</strong><small>{item.description}</small></span><b aria-hidden="true">→</b></button>)}</div></div></section>;
    if (segment.type === "catalog") { const eyebrow = segment.items.find((item) => item.role === "eyebrow"); const titleItem = segment.items.find((item) => item.role === "title"); const title = audience !== "todos" ? `Serviços para ${audienceItems.find((item) => item.id === audience)?.label}` : activeCategory !== "todos" ? activeCategory : query ? "Resultado da busca" : titleItem?.value || "Todos os serviços"; return <section key={segment.id} id="todos-os-servicos" aria-labelledby="results-title" className={classes(segment, "results section")} style={segmentStyle(segment)}><header><div><span {...itemSizeProps(eyebrow)}>{eyebrow?.value}</span><h2 {...itemSizeProps(titleItem)} ref={resultsHeadingRef} id="results-title" tabIndex={-1}>{title}</h2></div><div>{(audience !== "todos" || activeCategory !== "todos" || query) && <button type="button" onClick={() => { setAudience("todos"); setCategory("todos"); setQuery(""); }}>Limpar filtros ×</button>}<b role="status" aria-live="polite" aria-atomic="true">{results.length} encontrado{results.length === 1 ? "" : "s"}</b></div></header><div className="service-grid" aria-label="Lista de serviços">{results.map((service, index) => serviceCard(service, index))}</div>{results.length === 0 && <div className="empty" role="status">Nenhum serviço encontrado. Tente outro termo.</div>}</section>; }
    if (segment.type === "help") { const eyebrow = segment.items.find((item) => item.role === "eyebrow"); const title = segment.items.find((item) => item.role === "title"); const description = segment.items.find((item) => item.role === "description"); const action = items(segment, "link")[0]; return <section key={segment.id} id="ajuda" className={classes(segment, "help")} style={segmentStyle(segment)}><div><span {...itemSizeProps(eyebrow)}>{eyebrow?.value}</span><h2 {...itemSizeProps(title)}>{title?.value}</h2><p {...itemSizeProps(description)}>{description?.value}</p></div>{action && <a {...itemSizeProps(action)} href={action.url} {...external(action.url)}>{action.text}</a>}</section>; }
    if (segment.type === "footer") { const header = segments.find((entry) => entry.type === "header"); const description = segment.items.find((item) => item.role === "description"); return <footer key={segment.id} className={classes(segment, "segment-footer")} style={segmentStyle(segment)}>{header && <Brand segment={header} />}<p {...itemSizeProps(description)}>{description?.value}</p></footer>; }
    if (segment.type === "amanda") return renderAmanda(segment);
    return <section key={segment.id} className={classes(segment, "generic")} style={segmentStyle(segment)}><SectionHeading segment={segment} /><div className="generic-items">{segment.items.map((item) => item.type === "image" && item.src ? <img key={item.id} {...itemSizeProps(item)} src={item.src} alt={item.alt || ""} /> : item.type === "link" ? <a key={item.id} {...itemSizeProps(item)} href={item.url}>{item.text}</a> : <p key={item.id} {...itemSizeProps(item)}>{item.value || item.label}</p>)}</div></section>;
  }

  return <main style={{ "--green": siteContent.site.primaryColor, "--red": siteContent.site.accentColor, "--site-green": siteContent.site.primaryColor, "--site-red": siteContent.site.accentColor } as CSSProperties}><div className="skip-links" aria-label="Atalhos de navegação"><a className="skip" href="#conteudo">Ir para o conteúdo</a><a className="skip" href="#service-search">Ir para a busca</a><a className="skip" href="#publicos">Ir para os públicos</a><a className="skip" href="#todos-os-servicos">Ir para os serviços</a></div>{segments.map(renderSegment)}</main>;
}
