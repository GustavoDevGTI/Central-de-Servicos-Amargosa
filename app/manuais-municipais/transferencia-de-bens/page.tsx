/* eslint-disable @next/next/no-img-element -- telas instrutivas do manual municipal */

import type { Metadata } from "next";
import { PortalHeader } from "../../internal-portal";
import ManualSeiIndex from "../../manual-sei/manual-sei-index";
import PortalFooter from "../../portal-footer";

export const metadata: Metadata = {
  title: "Manual de Transferência de Bens | Central de Serviços de Amargosa",
  description: "Passo a passo para solicitar, responder e acompanhar transferências internas de bens no SIM.",
};

const steps = [
  {
    id: "acessar-modulo",
    label: "Acesse o módulo",
    instruction: <>No SIM, abra <strong>Servidor</strong> e selecione <strong>Transferências / Bens</strong>.</>,
    image: "01-acesso.webp",
    caption: "Menu Servidor com a opção Transferências / Bens.",
  },
  {
    id: "selecionar-bens",
    label: "Localize e selecione os bens",
    instruction: <>Busque pelo número da plaqueta ou pelo nome do item. Confira os dados e marque os bens que quer transferir. Você pode reunir vários bens na mesma solicitação se todos forem para o mesmo ambiente.</>,
    image: "02-selecao.webp",
    caption: "Resultado da busca no SIM, com um bem selecionado.",
  },
  {
    id: "informar-destino",
    label: "Informe o destino e o motivo",
    instruction: <>Clique no botão <strong>+</strong> para abrir a seleção de destino. Pesquise pela secretaria, unidade, setor, ambiente ou responsável. Selecione o destino correto e preencha o motivo da transferência.</>,
    image: "03-destino.webp",
    caption: "Janela de seleção do destino com o campo para informar o motivo.",
  },
  {
    id: "confirmar-solicitacao",
    label: "Confirme a solicitação",
    instruction: <>Confira os bens, o destino e o motivo antes de enviar. Ao concluir, o SIM registra a solicitação e aguarda a resposta do servidor de destino.</>,
    image: "04-confirmacao.webp",
    caption: "Mensagem do SIM confirmando o envio da solicitação.",
  },
  {
    id: "acompanhar-historico",
    label: "Acompanhe o histórico",
    instruction: <>Abra o <strong>Histórico</strong> para consultar a origem, o destino, o motivo, as datas e a situação de cada transferência.</>,
    image: "05-historico.webp",
    caption: "Histórico de movimentações com exemplos de transferências aceitas e recusadas.",
  },
];

const sections = [
  { id: "antes-de-comecar", label: "Antes de começar" },
  ...steps.map(({ id, label }) => ({ id, label })),
  { id: "responder-solicitacao", label: "Responda à solicitação" },
  { id: "situacoes", label: "Situações da transferência" },
];

export default function TransferManualPage() {
  return (
    <main className="site-root internal-site manual-sei-page transfer-manual-page">
      <a className="skip" href="#conteudo-transferencia">Ir para o conteúdo do manual</a>
      <PortalHeader />
      <article id="conteudo-transferencia" className="manual-sei-shell">
        <nav className="manuals-breadcrumb" aria-label="Você está em">
          <a href="/manuais-municipais">Manuais Municipais</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Transferência de Bens</span>
        </nav>
        <header className="manual-sei-hero">
          <h1>Transferência interna de bens</h1>
          <p>Como solicitar, responder e acompanhar transferências patrimoniais no Sistema Integrado Municipal (SIM).</p>
        </header>

        <div className="manual-sei-layout">
          <ManualSeiIndex sections={sections} title="Etapas do manual" />
          <div className="manual-sei-steps">
            <section id="antes-de-comecar" className="manual-sei-step">
              <h2>Antes de começar</h2>
              <p>O SIM concentra o registro, a resposta e o acompanhamento da transferência. Confira a plaqueta, o ambiente de destino e quem vai receber o bem antes de abrir a solicitação.</p>
            </section>
            {steps.map((step, index) => (
              <section key={step.id} id={step.id} className="manual-sei-step">
                <h2>{index + 1}. {step.label}</h2>
                <p>{step.instruction}</p>
                <figure className="manual-sei-figure">
                  <img src={`/manual-transferencia-de-bens/${step.image}`} alt={step.caption} loading="lazy" />
                  <figcaption>Tela {index + 1}. {step.caption}</figcaption>
                </figure>
              </section>
            ))}
            <section id="responder-solicitacao" className="manual-sei-step">
              <h2>Responda à solicitação</h2>
              <p>O servidor de destino tem 48 horas corridas a partir do registro para responder no SIM. Registre o aceite após receber e conferir o bem. Em caso de recusa, informe o motivo no sistema.</p>
              <p>Uma solicitação sem resposta no prazo fica pendente. Acompanhe as orientações da Coordenação de Patrimônio (COPAT) para regularizar a movimentação.</p>
            </section>
            <section id="situacoes" className="manual-sei-step">
              <h2>Situações da transferência</h2>
              <dl className="manual-sei-definitions">
                <div><dt>Aguardando aceite</dt><dd>A solicitação aguarda resposta do destinatário.</dd></div>
                <div><dt>Aceito</dt><dd>O servidor de destino confirmou o recebimento.</dd></div>
                <div><dt>Recusado</dt><dd>O destinatário recusou a transferência. Consulte a justificativa no histórico.</dd></div>
                <div><dt>Cancelado</dt><dd>A solicitação foi encerrada.</dd></div>
              </dl>
              <a className="transfer-manual-source" href="https://dom.amargosa.ba.gov.br/edicoes/5117/download/#page=13">Consultar a Instrução Normativa SEAFI nº 00000543763/2026 <span aria-hidden="true">↗</span></a>
            </section>
          </div>
        </div>
      </article>
      <PortalFooter />
    </main>
  );
}
