/* eslint-disable @next/next/no-html-link-for-pages -- links diretos preservam a navegação estável no Vinext */
import type { Metadata } from "next";
import siteContent from "../../content/site.json";
import PortalFooter from "../portal-footer";

export const metadata: Metadata = {
  title: "Menu de acessibilidade | Central de Serviços de Amargosa",
  description: "Todos os serviços organizados por público e categoria em uma estrutura simples e aberta.",
};

type Item = { id: string; slug?: string; type: string; label?: string; description?: string; title?: string; department?: string; category?: string; audienceId?: string; audienceIds?: string[]; destination?: string; url?: string };
type Segment = { type: string; enabled: boolean; items: Item[] };

const page = siteContent.pages[0] as unknown as { segments: Segment[] };
// O menu acessível é um índice completo do portal. A visibilidade dos segmentos
// na página inicial não pode esconder os dados de públicos, categorias ou serviços.
const segments = page.segments;
const audiences = segments.find((segment) => segment.type === "audiences")?.items.filter((item) => item.type === "audience") || [];
const categoryOrder = (segments.find((segment) => segment.type === "categories")?.items.filter((item) => item.type === "category") || []).map((item) => item.label || "");
const services = segments.find((segment) => segment.type === "catalog")?.items.filter((item) => item.type === "service") || [];
const safeId = (value = "grupo") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

function categoriesFor(audienceId: string) {
  const audienceServices = services.filter((service) => (service.audienceIds?.length ? service.audienceIds : [service.audienceId]).includes(audienceId));
  return [...new Set(audienceServices.map((service) => service.category || "Outros serviços"))]
    .sort((a, b) => {
      const first = categoryOrder.indexOf(a);
      const second = categoryOrder.indexOf(b);
      return (first < 0 ? 999 : first) - (second < 0 ? 999 : second) || a.localeCompare(b, "pt-BR");
    })
    .map((category) => ({ category, services: audienceServices.filter((service) => (service.category || "Outros serviços") === category).sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR")) }));
}

export default function AccessibilityMenu() {
  const groups = audiences.map((audience) => ({ audience, categories: categoriesFor(audience.id) })).filter((group) => group.categories.length);
  const knownAudienceIds = new Set(audiences.map((audience) => audience.id));
  const unassigned = services.filter((service) => !(service.audienceIds?.length ? service.audienceIds : [service.audienceId]).some((id) => knownAudienceIds.has(id || "")));
  if (unassigned.length) groups.push({ audience: { id: "outros", type: "audience", label: "Outros públicos" }, categories: [...new Set(unassigned.map((service) => service.category || "Outros serviços"))].map((category) => ({ category, services: unassigned.filter((service) => (service.category || "Outros serviços") === category) })) });

  return <main id="conteudo-menu" className="accessibility-menu">
    <div className="skip-links"><a className="skip" href="#lista-servicos">Ir para a lista de serviços</a></div>
    <header className="accessibility-menu-header">
      <a className="accessibility-menu-back" href="/">← Voltar à Central de Serviços</a>
      <p>Prefeitura de Amargosa</p>
      <h1>Menu de acessibilidade</h1>
      <span>Todos os serviços em uma estrutura direta, aberta e navegável por teclado.</span>
    </header>
    <nav className="accessibility-menu-index" aria-label="Públicos disponíveis">
      <strong>Ir para:</strong>
      {groups.map(({ audience }) => <a key={audience.id} href={`#publico-${safeId(audience.id)}`}>{audience.label}</a>)}
    </nav>
    <div id="lista-servicos" className="accessibility-menu-groups">
      {groups.map(({ audience, categories }) => <section key={audience.id} id={`publico-${safeId(audience.id)}`} className="accessibility-public-group" aria-labelledby={`titulo-${safeId(audience.id)}`}>
        <h2 id={`titulo-${safeId(audience.id)}`}><span>{audience.label}</span><small>{categories.reduce((total, entry) => total + entry.services.length, 0)} serviços</small></h2>
        {categories.map(({ category, services: categoryServices }) => <section key={category} className="accessibility-category-group">
          <h3><span>{category}</span><small>{categoryServices.length} serviço{categoryServices.length === 1 ? "" : "s"}</small></h3>
          <ul>{categoryServices.map((service) => { const href = service.slug ? `/servicos/${service.slug}` : service.url || "/servicos"; return <li key={service.id}><a href={href} target={service.slug ? undefined : "_blank"} rel={service.slug ? undefined : "noreferrer"}><span><strong>{service.title}</strong>{service.department && <small>{service.department}</small>}</span><b>Ver serviço →</b></a></li>; })}</ul>
        </section>)}
      </section>)}
    </div>
    <PortalFooter />
  </main>;
}
