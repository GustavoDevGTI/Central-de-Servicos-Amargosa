import type { Metadata } from "next";
import { PortalHeader } from "../internal-portal";
import { municipalManuals } from "../municipal-manuals";
import PortalFooter from "../portal-footer";

export const metadata: Metadata = {
  title: "Manuais Municipais | Central de Serviços de Amargosa",
  description: "Guias da Prefeitura de Amargosa sobre o SEI, transferência de bens no SIM e solicitação de férias.",
};

export default function MunicipalManualsPage() {
  return (
    <main className="site-root internal-site manual-sei-page municipal-manuals-page">
      <a className="skip" href="#conteudo-manuais">Ir para o conteúdo</a>
      <PortalHeader />
      <article id="conteudo-manuais" className="municipal-manuals-shell">
        <nav className="manuals-breadcrumb" aria-label="Você está em">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- O roteador do Vinext falha nesta página na compilação standalone. */}
          <a href="/">Central de Serviços</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Manuais Municipais</span>
        </nav>
        <header className="municipal-manuals-heading">
          <h1>Manuais Municipais</h1>
        </header>
        <ul className="municipal-manuals-list">
          {municipalManuals.map((manual) => (
            <li key={manual.href}>
              <a href={manual.href + (manual.cardFragment ?? "")} className="municipal-manual-card">
                <span className="municipal-manual-icon" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Ícone local com dimensões definidas. */}
                  <img src={manual.iconSrc} width={48} height={48} alt="" />
                </span>
                <span className="municipal-manual-copy">
                  <strong>{manual.label}</strong>
                  <span>{manual.description}</span>
                </span>
                <span className="municipal-manual-arrow" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </article>
      <PortalFooter />
    </main>
  );
}
