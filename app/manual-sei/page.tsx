/* eslint-disable @next/next/no-img-element -- imagens instrutivas extraídas do manual oficial fornecido */

import type { Metadata } from "next";
import Link from "next/link";
import { PortalHeader } from "../internal-portal";
import PortalFooter from "../portal-footer";

export const metadata: Metadata = {
  title: "Manual de Peticionamento Eletrônico | Central de Serviços de Amargosa",
  description:
    "Guia prático para abrir, acompanhar e complementar processos no SEI Amargosa usando uma conta GOV.BR.",
};

const sections = [
  { id: "antes-de-comecar", label: "Antes de começar" },
  { id: "acessar", label: "Acessar a página principal" },
  { id: "escolher", label: "Escolher o tipo de processo" },
  { id: "formulario", label: "Preencher o formulário" },
  { id: "documento-principal", label: "Preencher o documento principal" },
  { id: "arquivo-complementar", label: "Incluir arquivo complementar" },
  { id: "revisar", label: "Revisar e peticionar" },
  { id: "protocolo", label: "Receber o protocolo e consultar o recibo" },
  { id: "acompanhar", label: "Acompanhar ou complementar" },
];

const checklist = [
  "Confira a especificação.",
  "Verifique se o documento principal foi salvo.",
  "Confirme se o título do arquivo foi informado.",
  "Confira se o formato nato-digital ou digitalizado foi selecionado.",
  "Confirme se todos os arquivos aparecem na lista.",
];

function ManualFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="manual-sei-figure">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function ManualSeiPage() {
  return (
    <main className="site-root internal-site manual-sei-page">
      <a className="skip" href="#manual-sei-conteudo">
        Ir para o conteúdo do manual
      </a>
      <PortalHeader />

      <article id="manual-sei-conteudo" className="manual-sei-shell">
        <nav className="manual-sei-breadcrumb" aria-label="Navegação estrutural">
          <Link href="/">Página inicial</Link>
          <span aria-hidden="true">/</span>
          <span>Manual do SEI</span>
        </nav>

        <header className="manual-sei-hero">
          <span className="manual-sei-kicker">SEI AMARGOSA · GUIA PARA USUÁRIOS EXTERNOS</span>
          <h1>Manual prático de Peticionamento Eletrônico</h1>
          <p>
            Siga as etapas para abrir um processo, enviar documentos e acompanhar
            sua solicitação no Protocolo Digital de Amargosa.
          </p>
        </header>

        <a
          className="manual-sei-govbr"
          href="https://acesso.amargosa.ba.gov.br/protocolodigital"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div aria-hidden="true">!</div>
          <p>
            <strong id="manual-sei-govbr-title">Acesso exclusivo com GOV.BR</strong>
            Use apenas <b>“Entrar com gov.br”</b> e ignore os campos de e-mail e senha.
          </p>
          <span className="manual-sei-card-action">
            Acessar o Protocolo Digital <span aria-hidden="true">↗</span>
          </span>
        </a>

        <div className="manual-sei-layout">
          <nav className="manual-sei-index" aria-label="Etapas do manual">
            <strong>Nesta página</strong>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>

          <div className="manual-sei-steps">
            <section className="manual-sei-before" aria-labelledby="antes-de-comecar">
              <h2 id="antes-de-comecar">Antes de começar</h2>
              <p>Separe estes itens antes de iniciar o peticionamento.</p>
              <ol>
                <li>
                  <span className="manual-sei-prep-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="3.25" />
                      <path d="M5.5 19c.7-3.3 3-5 6.5-5s5.8 1.7 6.5 5" />
                    </svg>
                  </span>
                  <span className="manual-sei-prep-copy">
                    <small>Passo 1</small>
                    <strong>Conta GOV.BR</strong>
                  </span>
                </li>
                <li>
                  <span className="manual-sei-prep-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <rect x="5" y="4" width="14" height="17" rx="2" />
                      <path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" />
                    </svg>
                  </span>
                  <span className="manual-sei-prep-copy">
                    <small>Passo 2</small>
                    <strong>Informações do pedido</strong>
                  </span>
                </li>
                <li>
                  <span className="manual-sei-prep-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M6 3h8l4 4v14H6zM14 3v5h4" />
                      <path d="m9 15 2 2 4-5" />
                    </svg>
                  </span>
                  <span className="manual-sei-prep-copy">
                    <small>Passo 3</small>
                    <strong>Arquivos legíveis</strong>
                  </span>
                </li>
                <li>
                  <span className="manual-sei-prep-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 7h7l2 2h9v10H3z" />
                      <path d="m9 14 2 2 4-4" />
                    </svg>
                  </span>
                  <span className="manual-sei-prep-copy">
                    <small>Passo 4</small>
                    <strong>Documentos exigidos para o serviço</strong>
                  </span>
                </li>
              </ol>
            </section>

            <section id="acessar" className="manual-sei-step">
              <header>
                <span>1</span>
                <h2>Acessar a página principal</h2>
              </header>
              <p>
                Abra o Portal de Protocolo Digital e selecione exclusivamente
                <strong> Entrar com gov.br</strong>.
              </p>
              <ManualFigure
                src="/manual-sei/01-acesso-gov-br.png"
                alt="Página principal do SEI Amargosa, com destaque para o acesso GOV.BR"
                caption="Tela 1. Página principal e acesso com GOV.BR."
              />
            </section>

            <section id="escolher" className="manual-sei-step">
              <header>
                <span>2</span>
                <h2>Escolher o tipo de processo</h2>
              </header>
              <p>
                Abra <strong>Peticionamento</strong>, selecione <strong>Processo Novo</strong> e
                procure o serviço no campo <strong>Tipo do Processo</strong>.
              </p>
              <ManualFigure
                src="/manual-sei/02-tipo-processo.png"
                alt="Tela do SEI para escolha do tipo de processo"
                caption="Tela 2. Processo Novo e tipo processual."
              />
            </section>

            <section id="formulario" className="manual-sei-step">
              <header>
                <span>3</span>
                <h2>Preencher o formulário</h2>
              </header>
              <p>
                Leia as orientações, preencha a especificação com um resumo objetivo e
                confira o interessado.
              </p>
              <ManualFigure
                src="/manual-sei/03-formulario.png"
                alt="Formulário de peticionamento do SEI"
                caption="Tela 3. Especificação e documentos."
              />
            </section>

            <section id="documento-principal" className="manual-sei-step">
              <header>
                <span>4</span>
                <h2>Preencher o documento principal</h2>
              </header>
              <p>
                Clique no documento principal indicado pelo sistema, preencha o conteúdo
                e selecione <strong>Salvar</strong>. Nos documentos complementares,
                selecione o tipo de documento e confira o nível de acesso e a hipótese
                legal.
              </p>
              <ManualFigure
                src="/manual-sei/04-documentos.png"
                alt="Documento principal e documentos complementares no SEI"
                caption="Tela 4. Documento principal e documentos complementares."
              />
            </section>

            <section id="arquivo-complementar" className="manual-sei-step">
              <header>
                <span>5</span>
                <h2>Incluir arquivo complementar</h2>
              </header>
              <p>Para cada arquivo complementar, siga esta sequência:</p>
              <ol>
                <li>Selecione o <strong>Tipo de Documento</strong>.</li>
                <li>
                  Informe o <strong>título do arquivo</strong> no campo
                  <strong> Complemento do Tipo de Documento</strong>.
                </li>
                <li>
                  Selecione o formato <strong>Nato-digital</strong> ou
                  <strong> Digitalizado</strong>.
                </li>
                <li>
                  Selecione <strong>Escolher arquivo</strong> e localize o documento.
                </li>
                <li>Selecione <strong>Adicionar</strong>.</li>
                <li>Confirme se o arquivo apareceu na lista.</li>
              </ol>
              <dl className="manual-sei-definitions">
                <div className="manual-sei-definition-formats">
                  <dt>Nato-digital</dt>
                  <dd>Arquivo criado originalmente em meio eletrônico.</dd>
                  <dt>Digitalizado</dt>
                  <dd>Arquivo gerado pela digitalização de documento em papel.</dd>
                </div>
                <div className="manual-sei-definition-limit">
                  <dt>Limite</dt>
                  <dd>A tela apresentada informa tamanho máximo de 10 MB por arquivo.</dd>
                </div>
              </dl>
              <ManualFigure
                src="/manual-sei/05-arquivo-complementar.png"
                alt="Inclusão de arquivo complementar e botão Adicionar no SEI"
                caption="Tela 5. Escolha do arquivo, botão Adicionar, lista e Peticionar."
              />
              <aside className="manual-sei-warning">
                <strong>Atenção</strong>
                Escolher o arquivo não conclui a inclusão. O documento deve aparecer na
                lista após selecionar <b>Adicionar</b>.
              </aside>
            </section>

            <section id="revisar" className="manual-sei-step">
              <header>
                <span>6</span>
                <h2>Revisar e peticionar</h2>
              </header>
              <ul className="manual-sei-checklist">
                {checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                Depois da conferência, selecione <strong>Peticionar</strong> e conclua
                conforme as instruções do sistema.
              </p>
            </section>

            <section id="protocolo" className="manual-sei-step">
              <header>
                <span>7</span>
                <h2>Receber o protocolo e consultar o recibo</h2>
              </header>
              <p>
                Após a conclusão, o <strong>recibo eletrônico</strong> e o
                <strong> número do processo protocolado</strong> são enviados para o e-mail
                vinculado ao acesso GOV.BR.
              </p>
              <p>
                O recibo também permanece disponível na plataforma, no menu
                <strong> Recibos Eletrônicos de Protocolo</strong>.
              </p>
              <a
                className="manual-sei-public-search"
                href="https://acesso.amargosa.ba.gov.br/consultaprocessos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <p>
                  <strong>Consulta sem login</strong>
                  Com o número do processo recebido por e-mail, qualquer pessoa pode
                  consultar publicamente o andamento.
                </p>
                <span className="manual-sei-card-action">
                  Consultar processo na Pesquisa Pública
                  <span aria-hidden="true">↗</span>
                </span>
              </a>
            </section>

            <section id="acompanhar" className="manual-sei-step">
              <header>
                <span>8</span>
                <h2>Acompanhar ou complementar</h2>
              </header>
              <p>
                O menu <strong>Controle de Acessos Externos</strong> é destinado à consulta
                de processos e documentos disponibilizados ao usuário autenticado.
              </p>
              <p>
                Para enviar documentos a um processo existente, use
                <strong> Peticionamento &gt; Intercorrente</strong> e informe o número
                completo.
              </p>
            </section>

          </div>
        </div>
      </article>

      <PortalFooter />
    </main>
  );
}
