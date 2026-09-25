import type { Metadata } from "next";
import { PortalHeader } from "../internal-portal";
import PortalFooter from "../portal-footer";

const supportEmail = "seafi.gti@amargosa.ba.gov.br";

const bugMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
  "Relato de bug na Central de Serviços",
)}&body=${encodeURIComponent(
  "Página ou endereço (URL):\n\nO que aconteceu:\n\nO que você esperava que acontecesse:\n\nSe possível, informe o dispositivo e o navegador utilizados:\n",
)}`;

const informationMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
  "Solicitação de correção em uma página de serviço",
)}&body=${encodeURIComponent(
  "Nome do serviço:\n\nPágina ou endereço (URL):\n\nInformação que está incorreta ou desatualizada:\n\nQual é a informação correta:\n\nSe possível, indique a fonte da informação correta:\n",
)}`;

export const metadata: Metadata = {
  title: "Reportar um bug ou problema | Central de Serviços de Amargosa",
  description:
    "Informe falhas técnicas ou solicite a correção de informações inconsistentes na Central de Serviços de Amargosa.",
};

export default function ReportProblemPage() {
  return (
    <main className="site-root internal-site report-problem-page">
      <a className="skip" href="#conteudo-reportar-problema">
        Ir para o conteúdo
      </a>
      <PortalHeader />

      <article
        id="conteudo-reportar-problema"
        className="service-detail service-detail-rich report-problem-detail"
      >
        <header>
          <div>
            <small>AJUDA E MELHORIA CONTÍNUA</small>
            <h1>Reportar um bug ou problema</h1>
            <p>
              Ajude a manter a Central de Serviços funcionando corretamente e
              com informações confiáveis. Escolha abaixo o tipo de problema e
              envie os detalhes por e-mail.
            </p>
          </div>
        </header>

        <div className="service-detail-layout report-problem-layout">
          <nav aria-label="Nesta página">
            <strong>Nesta página</strong>
            <a href="#escolha-o-relato">Escolha o tipo de relato</a>
            <a href="#o-que-informar">O que informar</a>
            <a href="#antes-de-enviar">Antes de enviar</a>
          </nav>

          <div className="service-detail-content">
            <section id="escolha-o-relato">
              <h2>Escolha o tipo de relato</h2>
              <p>
                Os botões abaixo abrem uma mensagem de e-mail já endereçada à
                equipe responsável pela Central de Serviços.
              </p>

              <div className="report-problem-options">
                <article>
                  <small>FUNCIONAMENTO DO PORTAL</small>
                  <h3>Bug ou falha técnica</h3>
                  <p>
                    Use esta opção quando um botão não funcionar, uma página
                    não abrir, houver conteúdo sobreposto ou surgir outro erro
                    durante a navegação.
                  </p>
                  <a className="report-problem-email-button" href={bugMailto}>
                    Relatar bug por e-mail <span aria-hidden="true">→</span>
                  </a>
                </article>

                <article>
                  <small>CONTEÚDO DO SERVIÇO</small>
                  <h3>Informação incorreta ou desatualizada</h3>
                  <p>
                    Use esta opção para pedir uma correção quando a página de
                    um serviço apresentar uma orientação inconsistente.
                  </p>
                  <ul>
                    <li>O horário de funcionamento informado está errado.</li>
                    <li>
                      A página exige um documento que, na prática, não é
                      necessário.
                    </li>
                    <li>
                      O local, prazo, custo, contato ou procedimento mudou.
                    </li>
                  </ul>
                  <a
                    className="report-problem-email-button"
                    href={informationMailto}
                  >
                    Solicitar correção por e-mail{" "}
                    <span aria-hidden="true">→</span>
                  </a>
                </article>
              </div>
            </section>

            <section id="o-que-informar">
              <h2>O que informar no e-mail</h2>
              <ul className="report-problem-checklist">
                <li>O nome do serviço ou da página onde está o problema.</li>
                <li>O endereço da página, se possível.</li>
                <li>Uma descrição objetiva do erro ou da informação incorreta.</li>
                <li>Qual seria o comportamento ou a informação correta.</li>
                <li>
                  Uma captura de tela, quando ela ajudar a identificar o
                  problema.
                </li>
              </ul>
            </section>

            <section
              id="antes-de-enviar"
              className="service-manifestation-notice report-problem-notice"
            >
              <h2>Antes de enviar</h2>
              <p>
                Este canal é destinado a corrigir o portal e as informações
                publicadas. Ele não inicia uma solicitação de serviço e não
                substitui os canais oficiais de atendimento.
              </p>
              <p>
                Para reclamações, sugestões, elogios ou manifestações sobre o
                atendimento público, utilize a{" "}
                <a
                  href="https://falabr.cgu.gov.br/web/home"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvidoria
                </a>
                .
              </p>
            </section>

            <p className="report-problem-email-fallback">
              Se o seu aplicativo de e-mail não abrir, envie a mensagem para{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
            </p>
          </div>
        </div>
      </article>

      <PortalFooter />
    </main>
  );
}
