"use client";

import { useMemo, useState, type CSSProperties } from "react";
import siteContent from "../content/site.json";

export default function Home() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const categorias = ["Todos", ...Array.from(new Set(siteContent.services.map((servico) => servico.category)))];

  const resultados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return siteContent.services.filter((servico) => {
      const correspondeCategoria = categoria === "Todos" || servico.category === categoria;
      const texto = `${servico.title} ${servico.department} ${servico.category}`.toLocaleLowerCase("pt-BR");
      return correspondeCategoria && (!termo || texto.includes(termo));
    });
  }, [busca, categoria]);

  return (
    <main style={{ "--green": siteContent.identity.primaryColor, "--red": siteContent.identity.accentColor } as CSSProperties}>
      <div className="access-bar">
        <div className="boundary access-inner">
          <a href="#conteudo">Ir para o conteúdo</a>
          <span>{siteContent.identity.brandLine} {siteContent.identity.municipality}</span>
          <div><button type="button">A-</button><button type="button">A+</button><button type="button">◐ Contraste</button></div>
        </div>
      </div>

      <header className="site-header">
        <div className="boundary header-inner">
          <a className="brand" href="#" aria-label="Central de Serviços de Amargosa">
            <span className="brand-mark">AM</span>
            <span><small>{siteContent.identity.brandLine}</small><strong>{siteContent.identity.municipality.toLocaleUpperCase("pt-BR")}</strong><em>{siteContent.identity.tagline}</em></span>
          </a>
          <nav aria-label="Navegação principal">
            <a href="#servicos">Serviços</a><a href="#como-funciona">Como funciona</a><a href="#ajuda">Ajuda</a>
          </nav>
          <a className="portal-link" href={siteContent.identity.portalUrl} target="_blank" rel="noreferrer">Portal da Prefeitura ↗</a>
        </div>
      </header>

      <section className="hero" id="conteudo">
        <div className="boundary hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{siteContent.hero.eyebrow}</span>
            <h1>{siteContent.hero.title}</h1>
            <p>{siteContent.hero.description}</p>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={siteContent.hero.searchPlaceholder} aria-label="Buscar serviços" />
              <button type="button">Buscar</button>
            </label>
            <p className="privacy-note">Esta central não solicita login nem armazena dados pessoais.</p>
          </div>
          <aside className="hero-card" aria-label="Como a central funciona">
            <span className="hero-card-number">01</span>
            <h2>Um ponto de partida para todos os serviços.</h2>
            <p>Você escolhe o serviço. Nós indicamos qual órgão atende e abrimos o canal oficial em uma nova página.</p>
            <div className="hero-stats"><span><strong>100%</strong><small>canais oficiais</small></span><span><strong>0</strong><small>dados armazenados</small></span></div>
          </aside>
        </div>
      </section>

      <section className="services-section" id="servicos">
        <div className="boundary">
          <header className="section-heading"><div><span className="eyebrow">Acesso rápido</span><h2>Serviços para você</h2></div><p>Filtre por área ou digite na busca.</p></header>
          <div className="category-list" role="list" aria-label="Categorias de serviços">
            {categorias.map((item) => <button type="button" key={item} className={categoria === item ? "active" : ""} onClick={() => setCategoria(item)}>{item}</button>)}
          </div>
          <div className="result-meta"><strong>{resultados.length} serviços encontrados</strong><span>Atualizado pela Prefeitura de Amargosa</span></div>
          <div className="service-grid">
            {resultados.map((servico) => (
              <a className="service-card" href={servico.url} target="_blank" rel="noreferrer" key={servico.id}>
                <span className="service-icon">{servico.initials}</span>
                <span className="service-copy"><small>{servico.category}</small><strong>{servico.title}</strong><em>{servico.department}</em></span>
                <span className="service-destination"><small>Você será direcionado para</small><strong>{servico.destination} ↗</strong></span>
              </a>
            ))}
          </div>
          {resultados.length === 0 && <div className="empty-state"><strong>Nenhum serviço encontrado.</strong><span>Tente outro termo ou selecione “Todos”.</span></div>}
        </div>
      </section>

      <section className="steps" id="como-funciona">
        <div className="boundary steps-grid"><div><span className="eyebrow">Simples e transparente</span><h2>Você chega ao atendimento em três passos.</h2></div><ol><li><b>1</b><span><strong>Encontre</strong><small>Busque pelo assunto ou categoria.</small></span></li><li><b>2</b><span><strong>Confira</strong><small>Veja qual órgão é responsável.</small></span></li><li><b>3</b><span><strong>Acesse</strong><small>Siga para o canal oficial.</small></span></li></ol></div>
      </section>

      <footer id="ajuda"><div className="boundary footer-grid"><div className="brand footer-brand"><span className="brand-mark">AM</span><span><small>{siteContent.identity.brandLine}</small><strong>{siteContent.identity.municipality.toLocaleUpperCase("pt-BR")}</strong><em>{siteContent.identity.tagline}</em></span></div><div><strong>{siteContent.help.title}</strong><p>{siteContent.help.description}</p></div><a href={siteContent.identity.portalUrl} target="_blank" rel="noreferrer">{siteContent.help.label} ↗</a></div></footer>
    </main>
  );
}
