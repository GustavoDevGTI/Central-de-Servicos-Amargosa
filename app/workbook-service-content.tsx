import type { Service } from "./service-catalog";

const verbatimStyle = { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as const;

function CellText({ service, column }: { service: Service; column: string }) {
  return <span data-workbook-column={column} style={verbatimStyle}>{service.workbookCells?.[column] ?? ""}</span>;
}

/** Render cell strings directly; never infer addresses, contacts or instructions. */
export function WorkbookServiceContent({ service }: { service: Service }) {
  const cells = service.workbookCells!;
  const contacts = [
    ["Setor/Unidade responsável no SEI", "Setor/Unidade responsável no SEI"],
    ["Secretaria responsável", "Secretaria responsável"],
    ["Telefone", "Telefone"],
    ["Ramal", "Ramal"],
    ["E-mail do setor/unidade", "E-mail do setor/unidade"],
    ["É digital?", "É digital?"],
    ["Plataforma", "Plataforma"],
  ];
  return <>
    <section id="o-que-e"><h2>O que é</h2><p><CellText service={service} column="O que é" /></p></section>
    <section id="quem-pode"><h2>Quem pode solicitar</h2><p><CellText service={service} column="Quem pode solicitar2" /></p></section>
    <section id="documentos">
      <h2>Documentos necessários</h2>
      {cells["Documentos obrigatórios"] && <div><h3>Documentos obrigatórios</h3><p><CellText service={service} column="Documentos obrigatórios" /></p></div>}
      {cells["Documentos opcionais"] && <div><h3>Documentos opcionais</h3><p><CellText service={service} column="Documentos opcionais" /></p></div>}
      {cells["Documentação necessária"] && cells["Documentação necessária"] !== cells["Documentos obrigatórios"] && <div>
        <h3>Documentação necessária</h3><p><CellText service={service} column="Documentação necessária" /></p>
      </div>}
    </section>
    <section id="como-solicitar"><h2>Como solicitar</h2><p><CellText service={service} column="Como solicitar - etapas" /></p></section>
    <section id="onde-quando"><h2>Onde e quando solicitar</h2><p><CellText service={service} column="Onde e quando solicitar2" /></p></section>
    <section id="informacoes" className="service-facts">
      <div><span>Custo</span><strong><CellText service={service} column="Custo" /></strong></div>
      <div><span>Prazo estimado</span><strong><CellText service={service} column="Prazo" /></strong></div>
    </section>
    <section id="canais" className="service-contact-section">
      <h2>Canais de atendimento</h2>
      <div className="service-request-option"><dl>
        {contacts.filter(([column]) => cells[column]).map(([column, label]) => <div key={column}>
          <dt>{label}</dt><dd><CellText service={service} column={column} /></dd>
        </div>)}
        {cells["Link de acesso"] && <div><dt>Link de acesso</dt><dd>
          {/^(?:https?:\/\/|mailto:|tel:)/i.test(cells["Link de acesso"])
            ? <a href={cells["Link de acesso"]} target="_blank" rel="noreferrer"><CellText service={service} column="Link de acesso" /></a>
            : <CellText service={service} column="Link de acesso" />}
        </dd></div>}
      </dl></div>
    </section>
  </>;
}
