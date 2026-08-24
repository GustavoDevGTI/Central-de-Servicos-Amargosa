"use client";
/* eslint-disable @next/next/no-img-element -- imagens locais do construtor usam data URLs */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import siteContent from "../content/site.json";

type Item = { id: string; type: string; role?: string; label?: string; value?: string; text?: string; url?: string; src?: string; alt?: string; placeholder?: string; buttonText?: string; description?: string; initials?: string; title?: string; department?: string; category?: string; audienceId?: string; destination?: string; serviceId?: string };
type Segment = { id: string; name: string; type: string; enabled: boolean; style: { background?: string; color?: string; accent?: string; width?: string; spacing?: string; radius?: string; variant?: string; backgroundImage?: string }; items: Item[] };
type Service = Item & { title: string; department: string; category: string; audienceId: string; destination: string; url: string; initials: string };
const page = siteContent.pages[0] as unknown as { segments: Segment[] };

const items = (segment: Segment | undefined, type: string) => segment?.items.filter((item) => item.type === type) || [];
const text = (segment: Segment | undefined, role: string, fallback = "") => segment?.items.find((item) => item.role === role)?.value || fallback;
const external = (url = "") => /^https?:\/\//i.test(url) ? { target: "_blank", rel: "noreferrer" } : {};

function Brand({ segment }: { segment: Segment }) {
  const logo = items(segment, "image").find((item) => item.role === "logo");
  return <span className="brand">{logo?.src ? <img className="brand-image" src={logo.src} alt={logo.alt || "Logo"} /> : <span className="mark">AM</span>}<span><small>{text(segment, "brandLine", "Prefeitura de")}</small><strong>{text(segment, "municipality", "Amargosa")}</strong><em>{text(segment, "subtitle", "Central de Serviços")}</em></span></span>;
}

function SectionHeading({ segment }: { segment: Segment }) {
  return <header><div><span>{text(segment, "eyebrow")}</span><h2>{text(segment, "title", segment.name)}</h2></div>{text(segment, "description") && <p>{text(segment, "description")}</p>}</header>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("todos");
  const [category, setCategory] = useState("todos");
  const [amandaOpen, setAmandaOpen] = useState(false);
  const [amandaDraft, setAmandaDraft] = useState("");
  const [amandaMessages, setAmandaMessages] = useState<Array<{ author: "user" | "amanda"; text: string }>>([]);
  const segments = page.segments.filter((segment) => segment.enabled);
  const catalog = segments.find((segment) => segment.type === "catalog");
  const audiences = segments.find((segment) => segment.type === "audiences");
  const services = items(catalog, "service") as Service[];
  const audienceItems = items(audiences, "audience");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const results = services.filter((service) => (audience === "todos" || service.audienceId === audience) && (category === "todos" || service.category === category) && (!normalized || `${service.title} ${service.department} ${service.category} ${service.destination}`.toLocaleLowerCase("pt-BR").includes(normalized)));

  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setAmandaOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, []);
  function scrollResults() { document.querySelector("#todos-os-servicos")?.scrollIntoView({ behavior: "smooth" }); }
  function askAmanda(question: string) { const value = question.trim(); if (!value) return; setAmandaMessages((current) => [...current, { author: "user", text: value }, { author: "amanda", text: "Minha inteligência ainda está sendo preparada. Em breve vou responder e indicar o canal oficial mais adequado para você." }]); setAmandaDraft(""); }
  function segmentStyle(segment: Segment) { return { "--segment-bg": segment.style.background, "--segment-color": segment.style.color, "--segment-accent": segment.style.accent, backgroundImage: segment.style.backgroundImage ? `url(${JSON.stringify(segment.style.backgroundImage).slice(1, -1)})` : undefined } as CSSProperties; }
  function classes(segment: Segment, base: string) { return `${base} editable-segment segment-${segment.type} variant-${segment.style.variant || "institutional"} width-${segment.style.width || "contained"} spacing-${segment.style.spacing || "comfortable"} radius-${segment.style.radius || "soft"}`; }
  function serviceCard(service: Service, index: number, featured = false) {
    return <a key={`${service.id}-${index}`} className={featured ? "featured-card" : "service-card"} href={service.url} {...external(service.url)}>{featured && <span className="rank">{String(index + 1).padStart(2, "0")}</span>}<span><small>{service.category}</small><strong>{service.title}</strong><em>{service.department}</em></span><b>{featured ? "↗" : <>{service.destination} ↗</>}</b></a>;
  }

  function renderAmanda(segment: Segment) {
    const avatar = items(segment, "image").find((item) => item.role === "avatar"); const conversation = items(segment, "search")[0]; const prompts = segment.items.filter((item) => item.role === "prompt");
    const symbol = <span className="amanda-symbol">{avatar?.src ? <img src={avatar.src} alt="" /> : "A"}</span>;
    return <div key={segment.id} className="amanda-widget" style={segmentStyle(segment)}><button className={`amanda-launcher ${amandaOpen ? "open" : ""}`} type="button" onClick={() => setAmandaOpen((open) => !open)} aria-expanded={amandaOpen}>{symbol}<span><small>{text(segment, "eyebrow")}</small><strong>Amanda</strong></span><b>{amandaOpen ? "×" : "✦"}</b></button>{amandaOpen && <aside className="amanda-panel" role="dialog" aria-label="Conversa com Amanda"><header className="amanda-header"><div className="amanda-identity">{symbol}<div><small>{text(segment, "eyebrow")}</small><strong>{text(segment, "title")}</strong></div></div><button type="button" onClick={() => setAmandaOpen(false)} aria-label="Fechar">×</button></header><div className="amanda-body"><p className="amanda-intro">{text(segment, "description")}</p><div className="amanda-status"><i></i><span>{text(segment, "status")}</span></div>{amandaMessages.length === 0 ? <div className="amanda-prompts"><small>Você pode começar por aqui</small>{prompts.map((prompt) => <button key={prompt.id} type="button" onClick={() => askAmanda(prompt.value || "")}>{prompt.value}<b>↗</b></button>)}</div> : <div className="amanda-transcript" aria-live="polite">{amandaMessages.map((message, index) => <article key={`${message.author}-${index}`} className={message.author}><small>{message.author === "user" ? "Você" : "Amanda"}</small><p>{message.text}</p></article>)}</div>}</div><form className="amanda-compose" onSubmit={(event) => { event.preventDefault(); askAmanda(amandaDraft); }}><label><span className="sr-only">Mensagem</span><textarea rows={2} value={amandaDraft} onChange={(event) => setAmandaDraft(event.target.value)} placeholder={conversation?.placeholder} /></label><button type="submit" disabled={!amandaDraft.trim()}>{conversation?.buttonText || "Enviar"} ↗</button></form><small className="amanda-notice">{text(segment, "notice")}</small></aside>}</div>;
  }

  function renderSegment(segment: Segment): ReactNode {
    if (segment.type === "utility") return <div key={segment.id} className={classes(segment, "utility")} style={segmentStyle(segment)}><span>{text(segment, "label")}</span><nav>{items(segment, "link").map((item) => <a key={item.id} href={item.url} {...external(item.url)}>{item.text}</a>)}</nav></div>;
    if (segment.type === "header") return <header key={segment.id} className={classes(segment, "header")} style={segmentStyle(segment)}><a href="#"><Brand segment={segment} /></a><nav>{items(segment, "link").map((item) => <a key={item.id} href={item.url}>{item.text}</a>)}</nav><span className="menu">☰ Menu</span></header>;
    if (segment.type === "hero") { const search = items(segment, "search")[0]; const featured = segments.find((entry) => entry.type === "featured"); const shortcuts = items(featured, "serviceRef").slice(0, 4).map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean) as Service[]; return <section key={segment.id} id="conteudo" className={classes(segment, "hero")} style={segmentStyle(segment)}><span className="eyebrow">{text(segment, "eyebrow")}</span><h1>{text(segment, "title")}</h1><p>{text(segment, "description")}</p><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={search?.placeholder} aria-label="Buscar serviços" /><a href="#todos-os-servicos">{search?.buttonText || "Buscar"}</a></label><div className="popular"><span>Mais buscados:</span>{shortcuts.map((service) => <button key={service.id} type="button" onClick={() => { setQuery(service.title); setAudience("todos"); setCategory("todos"); scrollResults(); }}>{service.title}</button>)}</div><small>{text(segment, "notice")}</small></section>; }
    if (segment.type === "audiences") return <section key={segment.id} id="publicos" className={classes(segment, "audience-panel")} style={segmentStyle(segment)}><SectionHeading segment={segment} /><div className="audiences">{items(segment, "audience").map((item) => <button key={item.id} type="button" onClick={() => { setAudience(item.id); setCategory("todos"); scrollResults(); }}><i>{item.initials}</i><strong>{item.label}</strong><small>{item.description}</small><b>Ver serviços →</b></button>)}</div></section>;
    if (segment.type === "featured") { const featured = items(segment, "serviceRef").map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean) as Service[]; return <section key={segment.id} id="mais-usados" className={classes(segment, "section")} style={segmentStyle(segment)}><SectionHeading segment={segment} /><div className="featured">{featured.map((service, index) => serviceCard(service, index, true))}</div></section>; }
    if (segment.type === "categories") return <section key={segment.id} id="categorias" className={classes(segment, "categories-section")} style={segmentStyle(segment)}><div className="boundary"><SectionHeading segment={segment} /><div className="categories">{items(segment, "category").map((item) => <button key={item.id} type="button" onClick={() => { setCategory(item.label || "todos"); setAudience("todos"); scrollResults(); }}><span><strong>{item.label}</strong><small>{item.description}</small></span><b>→</b></button>)}</div></div></section>;
    if (segment.type === "catalog") { const title = audience !== "todos" ? `Serviços para ${audienceItems.find((item) => item.id === audience)?.label}` : category !== "todos" ? category : query ? "Resultado da busca" : text(segment, "title", "Todos os serviços"); return <section key={segment.id} id="todos-os-servicos" className={classes(segment, "results section")} style={segmentStyle(segment)}><header><div><span>{text(segment, "eyebrow")}</span><h2>{title}</h2></div><div>{(audience !== "todos" || category !== "todos" || query) && <button type="button" onClick={() => { setAudience("todos"); setCategory("todos"); setQuery(""); }}>Limpar filtros ×</button>}<b>{results.length} encontrado{results.length === 1 ? "" : "s"}</b></div></header><div className="service-grid">{results.map((service, index) => serviceCard(service, index))}</div>{results.length === 0 && <div className="empty">Nenhum serviço encontrado. Tente outro termo.</div>}</section>; }
    if (segment.type === "help") { const action = items(segment, "link")[0]; return <section key={segment.id} id="ajuda" className={classes(segment, "help")} style={segmentStyle(segment)}><div><span>{text(segment, "eyebrow")}</span><h2>{text(segment, "title")}</h2><p>{text(segment, "description")}</p></div>{action && <a href={action.url} {...external(action.url)}>{action.text}</a>}</section>; }
    if (segment.type === "footer") { const header = segments.find((entry) => entry.type === "header"); return <footer key={segment.id} className={classes(segment, "segment-footer")} style={segmentStyle(segment)}>{header && <Brand segment={header} />}<p>{text(segment, "description")}</p></footer>; }
    if (segment.type === "amanda") return renderAmanda(segment);
    return <section key={segment.id} className={classes(segment, "generic")} style={segmentStyle(segment)}><SectionHeading segment={segment} /><div className="generic-items">{segment.items.map((item) => item.type === "image" && item.src ? <img key={item.id} src={item.src} alt={item.alt || ""} /> : item.type === "link" ? <a key={item.id} href={item.url}>{item.text}</a> : <p key={item.id}>{item.value || item.label}</p>)}</div></section>;
  }

  return <main style={{ "--green": siteContent.site.primaryColor, "--red": siteContent.site.accentColor, "--site-green": siteContent.site.primaryColor, "--site-red": siteContent.site.accentColor } as CSSProperties}><a className="skip" href="#conteudo">Ir para o conteúdo</a>{segments.map(renderSegment)}</main>;
}
