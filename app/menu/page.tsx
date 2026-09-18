/* eslint-disable @next/next/no-html-link-for-pages -- links diretos preservam a navegação estável no Vinext */
import type { Metadata } from "next";
import siteContent from "../../content/site.json";
import AccessibilityPreferences from "../accessibility-preferences";
import PortalFooter from "../portal-footer";
import { services } from "../service-catalog";
import VlibrasControl from "../vlibras-control";

export const metadata: Metadata = {
  title: "Menu de acessibilidade | Central de Serviços de Amargosa",
  description: "Todos os serviços organizados por público em uma estrutura simples e aberta.",
};

type Item = { id: string; slug?: string; type: string; label?: string; description?: string; title?: string; department?: string; category?: string; audienceId?: string; audienceIds?: string[]; destination?: string; url?: string };
type Segment = { type: string; enabled: boolean; items: Item[] };

const page = siteContent.pages[0] as unknown as { segments: Segment[] };
// O menu acessível é um índice completo do portal. A visibilidade dos segmentos
// na página inicial não pode esconder os dados de públicos, categorias ou serviços.
const segments = page.segments;
const audienceOrder = [
  "cidadao",
  "empresa",
  "servidor",
  "ouvidoria",
  "orgaos-publicos-ongs",
  "precatorio-fundef",
];
const audiences = (segments.find((segment) => segment.type === "audiences")?.items.filter((item) => item.type === "audience") || [])
  .sort((first, second) => {
    const firstIndex = audienceOrder.indexOf(first.id);
    const secondIndex = audienceOrder.indexOf(second.id);
    return (firstIndex < 0 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex < 0 ? Number.MAX_SAFE_INTEGER : secondIndex);
  });
const safeId = (value = "grupo") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

function servicesFor(audienceId: string) {
  return services
    .filter((service) => (service.audienceIds?.length ? service.audienceIds : [service.audienceId]).includes(audienceId))
    .sort((first, second) => (first.title || "").localeCompare(second.title || "", "pt-BR"));
}

export default function AccessibilityMenu() {
  const groups = audiences.map((audience) => ({ audience, services: servicesFor(audience.id) })).filter((group) => group.services.length);
  const knownAudienceIds = new Set(audiences.map((audience) => audience.id));
  const unassigned = services.filter((service) => !(service.audienceIds?.length ? service.audienceIds : [service.audienceId]).some((id) => knownAudienceIds.has(id || "")));
  if (unassigned.length) groups.push({ audience: { id: "outros", type: "audience", label: "Outros públicos" }, services: unassigned.sort((first, second) => (first.title || "").localeCompare(second.title || "", "pt-BR")) });

  return <main id="conteudo-menu" className="accessibility-menu">
    <div className="skip-links"><a className="skip" href="#lista-servicos">Ir para a lista de serviços</a></div>
    <header className="accessibility-menu-header">
      <a className="accessibility-menu-back" href="/">← Voltar à Central de Serviços</a>
      <p>Prefeitura de Amargosa</p>
      <h1>Menu de acessibilidade</h1>
      <span>Encontre todos os serviços em uma estrutura direta, aberta e navegável por teclado. Ajuste a apresentação para uma leitura mais confortável; suas preferências serão mantidas durante a navegação.</span>
    </header>
    <AccessibilityPreferences />
    <VlibrasControl />
    <div id="lista-servicos" className="accessibility-menu-groups">
      <nav className="accessibility-menu-index" aria-label="Públicos disponíveis">
        <strong>Ir para:</strong>
        {groups.map(({ audience }) => <a key={audience.id} href={`#publico-${safeId(audience.id)}`}>{audience.label}</a>)}
      </nav>
      {groups.map(({ audience, services: audienceServices }) => <section key={audience.id} id={`publico-${safeId(audience.id)}`} className="accessibility-public-group" aria-labelledby={`titulo-${safeId(audience.id)}`}>
        <h2 id={`titulo-${safeId(audience.id)}`}><span>{audience.label}</span><small>{audienceServices.length} serviço{audienceServices.length === 1 ? "" : "s"}</small></h2>
        <ul className="accessibility-service-list">{audienceServices.map((service) => { const href = service.slug ? `/servicos/${service.slug}` : service.url || "/servicos"; return <li key={service.id}><a href={href} target={service.slug ? undefined : "_blank"} rel={service.slug ? undefined : "noreferrer"}><span><strong>{service.title}</strong>{service.department && <small>{service.department}</small>}</span><b>Ver serviço →</b></a></li>; })}</ul>
      </section>)}
    </div>
    <PortalFooter />
  </main>;
}
