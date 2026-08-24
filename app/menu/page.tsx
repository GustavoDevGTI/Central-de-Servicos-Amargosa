import type { Metadata } from "next";
import Link from "next/link";
import siteContent from "../../content/site.json";

export const metadata: Metadata = {
  title: "Menu Acessibilidade | Central de Serviços de Amargosa",
  description: "Todos os serviços organizados por público e categoria em uma estrutura simples e aberta.",
};

type Item = { id: string; type: string; label?: string; description?: string; title?: string; department?: string; category?: string; audienceId?: string; destination?: string; url?: string };
type Segment = { type: string; enabled: boolean; items: Item[] };

const page = siteContent.pages[0] as unknown as { segments: Segment[] };
const segments = page.segments.filter((segment) => segment.enabled);
const audiences = segments.find((segment) => segment.type === "audiences")?.items.filter((item) => item.type === "audience") || [];
const services = segments.find((segment) => segment.type === "catalog")?.items.filter((item) => item.type === "service") || [];
const safeId = (value = "grupo") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

function categoriesFor(audienceId: string) {
  const audienceServices = services.filter((service) => service.audienceId === audienceId);
  return [...new Set(audienceServices.map((service) => service.category || "Outros serviços"))].map((category) => ({ category, services: audienceServices.filter((service) => (service.category || "Outros serviços") === category) }));
}

export default function AccessibilityMenu() {
  const groups = audiences.map((audience) => ({ audience, categories: categoriesFor(audience.id) })).filter((group) => group.categories.length);
  const knownAudienceIds = new Set(audiences.map((audience) => audience.id));
  const unassigned = services.filter((service) => !knownAudienceIds.has(service.audienceId || ""));
  if (unassigned.length) groups.push({ audience: { id: "outros", type: "audience", label: "Outros públicos" }, categories: [...new Set(unassigned.map((service) => service.category || "Outros serviços"))].map((category) => ({ category, services: unassigned.filter((service) => (service.category || "Outros serviços") === category) })) });

  return <main id="conteudo-menu" className="accessibility-menu">
    <div className="skip-links"><a className="skip" href="#lista-servicos">Ir para a lista de serviços</a></div>
    <header className="accessibility-menu-header">
      <Link className="accessibility-menu-back" href="/">← Voltar à Central de Serviços</Link>
      <p>Prefeitura de Amargosa</p>
      <h1>Menu Acessibilidade</h1>
      <span>Todos os serviços organizados em uma estrutura simples.</span>
    </header>
    <nav className="accessibility-menu-index" aria-label="Públicos disponíveis">
      <strong>Ir para:</strong>
      {groups.map(({ audience }) => <a key={audience.id} href={`#publico-${safeId(audience.id)}`}>{audience.label}</a>)}
    </nav>
    <div id="lista-servicos" className="accessibility-menu-groups">
      {groups.map(({ audience, categories }) => <section key={audience.id} id={`publico-${safeId(audience.id)}`} className="accessibility-public-group" aria-labelledby={`titulo-${safeId(audience.id)}`}>
        <h2 id={`titulo-${safeId(audience.id)}`}>{audience.label}</h2>
        {categories.map(({ category, services: categoryServices }) => <section key={category} className="accessibility-category-group">
          <h3>{category}</h3>
          <ul>{categoryServices.map((service) => <li key={service.id}><a href={service.url || "#"}><span><strong>{service.title}</strong>{service.department && <small>{service.department}</small>}</span><b>{service.destination || "Acessar serviço"} →</b></a></li>)}</ul>
        </section>)}
      </section>)}
    </div>
    <footer className="accessibility-menu-footer"><Link href="/">← Voltar à Central de Serviços</Link></footer>
  </main>;
}
