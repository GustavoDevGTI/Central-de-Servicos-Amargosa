"use client";

import { useMemo, useState, type CSSProperties } from "react";
import siteContent from "../content/site.json";

const categoryDescriptions: Record<string, string> = {
  "Administração e governo": "Diário oficial, licitações, protocolos, transparência e gestão pública",
  "Cultura, turismo e lazer": "Agenda, eventos, cultura, roteiros e informações para visitantes",
  "Educação": "Matrícula, calendário escolar, unidades de ensino e serviços educacionais",
  "Empresa e negócio": "Nota fiscal, alvarás, licitações e atendimento ao empreendedor",
  "Infraestrutura e zeladoria": "Iluminação, vias públicas, limpeza, manutenção e serviços urbanos",
  "Saúde": "Atendimento, unidades, vigilância, campanhas e serviços de saúde",
  "Tributos": "IPTU, taxas, certidões, dívida ativa e documentos fiscais",
  "Vida funcional": "Contracheque, solicitações internas e informações do servidor",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("todos");
  const [category, setCategory] = useState("todos");

  const categories = useMemo(
    () => Array.from(new Set(siteContent.services.map((service) => service.category))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [],
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return siteContent.services.filter((service) => {
      const matchesAudience = audience === "todos" || service.audience === audience;
      const matchesCategory = category === "todos" || service.category === category;
      const searchable = `${service.title} ${service.department} ${service.category} ${service.destination}`.toLocaleLowerCase("pt-BR");
      return matchesAudience && matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [audience, category, query]);

  const mostUsed = siteContent.services.filter((service) => service.featured);

  function chooseAudience(id: string) {
    setAudience(id);
    setCategory("todos");
    document.querySelector("#todos-os-servicos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseCategory(name: string) {
    setCategory(name);
    setAudience("todos");
    document.querySelector("#todos-os-servicos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main style={{ "--green": siteContent.identity.primaryColor, "--red": siteContent.identity.accentColor } as CSSProperties}>
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>

      <div className="utility-bar">
        <div className="boundary utility-inner">
          <span>Portal oficial do Município de {siteContent.identity.municipality}</span>
          <nav aria-label="Acessibilidade">
            <a href="#todos-os-servicos">Lista de serviços</a>
            <button type="button" aria-label="Diminuir texto">A−</button>
            <button type="button" aria-label="Aumentar texto">A+</button>
            <button type="button">◐ Contraste</button>
            <a href={siteContent.identity.portalUrl} target="_blank" rel="noreferrer">Portal da Prefeitura ↗</a>
          </nav>
        </div>
      </div>

      <header className="portal-header">
        <div className="boundary header-inner">
          <a className="brand" href="#" aria-label="Página inicial da Central de Serviços">
            <span className="brand-mark">AM</span>
            <span><small>{siteContent.identity.brandLine}</small><strong>{siteContent.identity.municipality}</strong><em>Central de Serviços</em></span>
          </a>
          <nav className="main-nav" aria-label="Navegação principal">
            <a href="#publicos">Serviços por público</a>
            <a href="#mais-usados">Mais usados</a>
            <a href="#categorias">Categorias</a>
            <a href="#ajuda">Ajuda</a>
          </nav>
          <button className="menu-button" type="button" aria-label="Abrir menu">☰ <span>Menu</span></button>
        </div>
      </header>

      <section className="search-hero" id="conteudo">
        <div className="hero-pattern" aria-hidden="true"><i></i><i></i><i></i></div>
        <div className="boundary hero-content">
          <span className="hero-eyebrow">{siteContent.hero.eyebrow}</span>
          <h1>{siteContent.hero.title}</h1>
          <p>{siteContent.hero.description}</p>
          <label className="main-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={siteContent.hero.searchPlaceholder} aria-label="Buscar na Central de Serviços" />
            {query && <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
            <a href="#todos-os-servicos" aria-label="Ver resultados da busca">Buscar</a>
          </label>
          <div className="popular-shortcuts" aria-label="Serviços em destaque">
            <span>Mais buscados:</span>
            {mostUsed.slice(0, 4).map((service) => <button key={service.id} type="button" onClick={() => { setQuery(service.title); setAudience("todos"); setCategory("todos"); }}>{service.title}</button>)}
          </div>
          <small className="privacy-message"><b>Sem cadastro.</b> Esta central apenas direciona você e não armazena dados pessoais.</small>
        </div>
      </section>

      <section className="audience-section" id="publicos">
        <div className="boundary audience-panel">
          <header className="panel-heading"><div><span>Escolha o seu perfil</span><h2>Serviços para cada público</h2></div><p>Encontre atalhos organizados de acordo com quem você é.</p></header>
          <div className="audience-grid">
            {siteContent.audiences.map((item) => {
              const count = siteContent.services.filter((service) => service.audience === item.id).length;
              return <button key={item.id} type="button" onClick={() => chooseAudience(item.id)} className={audience === item.id ? "active" : ""}>
                <span className="audience-icon">{item.initials}</span>
                <span className="audience-copy"><strong>{item.label}</strong><small>{item.description}</small><em>{count} serviço{count === 1 ? "" : "s"} →</em></span>
              </button>;
            })}
          </div>
        </div>
      </section>

      <section className="most-used-section" id="mais-usados">
        <div className="boundary">
          <header className="section-heading"><div><span className="section-kicker">Acesso rápido</span><h2>Serviços mais usados</h2></div><p>Ordem definida manualmente pela Prefeitura de Amargosa.</p></header>
          <div className="most-used-grid">
            {mostUsed.map((service, index) => <a key={service.id} className="most-used-card" href={service.url} target="_blank" rel="noreferrer">
              <span className="rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="service-symbol">{service.initials}</span>
              <span><small>{service.category}</small><strong>{service.title}</strong><em>{service.department}</em></span>
              <b aria-hidden="true">↗</b>
            </a>)}
          </div>
        </div>
      </section>

      <section className="category-section" id="categorias">
        <div className="boundary">
          <header className="section-heading"><div><span className="section-kicker">Navegue por assunto</span><h2>Todas as categorias</h2></div><p>Uma organização ampla inspirada em centrais municipais de referência.</p></header>
          <div className="category-grid">
            {categories.map((item) => <button key={item} type="button" onClick={() => chooseCategory(item)} className={category === item ? "active" : ""}>
              <span className="category-mark">{item.split(" ").slice(0, 2).map((word) => word[0]).join("")}</span>
              <span><strong>{item}</strong><small>{categoryDescriptions[item] || "Consulte os serviços disponíveis nesta área"}</small></span>
              <b>→</b>
            </button>)}
          </div>
        </div>
      </section>

      <section className="all-services" id="todos-os-servicos">
        <div className="boundary">
          <header className="results-heading">
            <div><span className="section-kicker">Catálogo de direcionamentos</span><h2>{audience !== "todos" ? `Serviços para ${siteContent.audiences.find((item) => item.id === audience)?.label}` : category !== "todos" ? category : query ? "Resultado da busca" : "Todos os serviços"}</h2></div>
            <div className="active-filters">
              {(audience !== "todos" || category !== "todos" || query) && <button type="button" onClick={() => { setAudience("todos"); setCategory("todos"); setQuery(""); }}>Limpar filtros ×</button>}
              <span>{results.length} encontrado{results.length === 1 ? "" : "s"}</span>
            </div>
          </header>
          <div className="service-list">
            {results.map((service) => <a key={service.id} href={service.url} target="_blank" rel="noreferrer">
              <span className="service-symbol">{service.initials}</span>
              <span className="service-main"><small>{service.category}</small><strong>{service.title}</strong><em>{service.department}</em></span>
              <span className="destination"><small>Canal responsável</small><strong>{service.destination}</strong></span>
              <b>↗</b>
            </a>)}
          </div>
          {results.length === 0 && <div className="empty-state"><strong>Nenhum serviço encontrado.</strong><p>Tente buscar outro termo ou limpe os filtros selecionados.</p><button type="button" onClick={() => { setAudience("todos"); setCategory("todos"); setQuery(""); }}>Mostrar todos os serviços</button></div>}
        </div>
      </section>

      <section className="help-section" id="ajuda">
        <div className="boundary help-inner"><div><span className="section-kicker">Atendimento oficial</span><h2>{siteContent.help.title}</h2><p>{siteContent.help.description}</p></div><a href={siteContent.identity.portalUrl} target="_blank" rel="noreferrer">{siteContent.help.label} ↗</a></div>
      </section>

      <footer className="portal-footer"><div className="boundary footer-grid"><div className="brand footer-brand"><span className="brand-mark">AM</span><span><small>{siteContent.identity.brandLine}</small><strong>{siteContent.identity.municipality}</strong><em>{siteContent.identity.tagline}</em></span></div><div><strong>Central de Serviços</strong><p>Um ponto de partida para os canais oficiais do Município de Amargosa.</p></div><nav><a href="#publicos">Públicos</a><a href="#mais-usados">Mais usados</a><a href="#categorias">Categorias</a></nav></div></footer>
    </main>
  );
}
