import type { Metadata } from "next";
import { PortalHeader } from "../../internal-portal";
import PortalFooter from "../../portal-footer";

export const metadata: Metadata = {
  title: "Dúvidas com a plataforma | Central de Serviços de Amargosa",
  description:
    "Orientações para usar as plataformas SEI e BA.GOV na Central de Serviços de Amargosa.",
};

export default function PlatformHelpPage() {
  return (
    <main className="site-root internal-site platform-help-page">
      <a className="skip" href="#conteudo-ajuda-plataforma">
        Ir para o conteúdo
      </a>
      <PortalHeader />

      <article
        id="conteudo-ajuda-plataforma"
        className="service-detail service-detail-rich platform-help-detail"
      >
        <header>
          <div>
            <small>AJUDA</small>
            <h1>Dúvidas com a plataforma</h1>
            <p>
              Encontre orientações sobre as plataformas usadas nos serviços
              municipais.
            </p>
          </div>
        </header>

        <div className="platform-help-options">
          <section aria-labelledby="ajuda-sei">
            <h2 id="ajuda-sei">SEI</h2>
            <p>
              Para dúvidas sobre como abrir, acompanhar ou complementar um
              processo, consulte o manual de peticionamento eletrônico.
            </p>
            <a href="/manual-sei">
              Acessar o manual do SEI <span aria-hidden="true">→</span>
            </a>
          </section>

          <section aria-labelledby="ajuda-ba-gov">
            <h2 id="ajuda-ba-gov">BA.GOV</h2>
            <p>
              As orientações de uso do BA.GOV serão adicionadas em breve. Para
              informações sobre um serviço específico, consulte a página desse
              serviço na Central.
            </p>
            <a href="/servicos">
              Consultar os serviços <span aria-hidden="true">→</span>
            </a>
          </section>
        </div>
      </article>

      <PortalFooter />
    </main>
  );
}
