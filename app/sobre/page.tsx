import type { Metadata } from "next";
import { PortalHeader } from "../internal-portal";
import PortalFooter from "../portal-footer";

export const metadata: Metadata = {
  title: "Sobre o projeto | Central de Serviços de Amargosa",
  description: "Conheça a Central de Serviços de Amargosa, seus objetivos e a equipe responsável pelo projeto.",
};

export default function AboutPage() {
  return (
    <main className="site-root internal-site about-page">
      <a className="skip" href="#sobre-conteudo">Ir para o conteúdo</a>
      <PortalHeader />

      <section id="sobre-conteudo" className="about-project" aria-labelledby="about-project-title">
        <div className="about-section-heading">
          <span>O PROJETO</span>
          <h2 id="about-project-title">Serviço público integrado</h2>
        </div>
        <div className="about-project-copy">
          <p>A Central de Serviços de Amargosa foi criada para unificar o acesso aos processos oferecidos pela Prefeitura. Em vez de exigir que cada pessoa descubra qual sistema ou órgão deve procurar, o portal apresenta as informações de forma padronizada e encaminha a solicitação para o canal oficial responsável.</p>
          <p>O projeto segue os princípios da <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm" target="_blank" rel="noreferrer">Lei Federal nº 13.460, de 26 de junho de 2017</a>, a Lei de Proteção e Defesa dos Usuários dos Serviços Públicos, fortalecendo o direito à informação, à transparência e à melhoria contínua do atendimento.</p>
          <p>Os serviços podem ser realizados ou acompanhados nas plataformas oficiais adotadas pelo Município, incluindo o SEI e o BA.gov.br, além de outros canais institucionais indicados em cada página. A Central não substitui esses sistemas: ela organiza o caminho até eles.</p>
        </div>
      </section>

      <section className="about-team" aria-labelledby="about-team-title">
        <header>
          <span>GOVERNANÇA DO PROJETO</span>
          <h2 id="about-team-title">Corpo técnico</h2>
        </header>

        <div className="about-org" aria-label="Hierarquia do corpo técnico">
          <article className="about-unit-card about-unit-card-root">
            <h3>Secretaria Municipal de Administração, Finanças e Desenvolvimento Institucional <span className="about-unit-acronym">— SEAFI</span></h3>
            <p><strong>Joanildo Borges</strong><span>Secretário municipal</span></p>
          </article>

          <div className="about-org-branches">
            <section className="about-org-branch about-org-gti" aria-labelledby="about-gti-title">
              <article className="about-unit-card">
                <h3 id="about-gti-title">Gestão de Tecnologia da Informação <span className="about-unit-acronym">— GTI</span></h3>
                <p><strong>Jurandy Silva dos Santos Júnior</strong><span>Gestor</span></p>
              </article>

              <div className="about-org-developers" aria-label="Corpo técnico subordinado à GTI">
                <article className="about-person-card">
                  <small>CORPO TÉCNICO · GTI</small>
                  <strong>Gustavo Almeida Borges</strong>
                  <span>Desenvolvedor Full Stack</span>
                </article>
                <article className="about-person-card">
                  <small>CORPO TÉCNICO · GTI</small>
                  <strong>Immanuel da Rocha Barbosa Vicente</strong>
                  <span>Desenvolvedor Full Stack</span>
                </article>
              </div>
            </section>

            <section className="about-org-branch" aria-labelledby="about-simp-title">
              <article className="about-unit-card">
                <h3 id="about-simp-title">Superintendência de Inovação e Modernização dos Serviços Públicos <span className="about-unit-acronym">— SIMP</span></h3>
                <p><strong>Danilo Regis</strong><span>Superintendente</span></p>
              </article>
            </section>
          </div>
        </div>
      </section>

      <PortalFooter />
    </main>
  );
}
