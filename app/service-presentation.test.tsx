import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { serviceDisplayValue } from "./service-presentation";
import { ServiceMoreInformation } from "./service-more-information";
import { services } from "./service-catalog";
import { applyWorkbookCells } from "./workbook-service";
import { ServiceDetail } from "./internal-portal";
import { CatalogPreviewProvider } from "./catalog-provider";

test("missing values are presented without changing substantive costs, dates, links or cells", () => {
  for (const value of [undefined, null, "", "  ", "A preencher", " a PREENCHER. ", "* Informação a ser adicionada."]) {
    assert.equal(serviceDisplayValue(value), "Não informado.");
    assert.equal(serviceDisplayValue(value, "Prazo"), "Indeterminado.");
  }
  for (const value of ["R$ 10,00", "Não se aplica (R$ 0,00)", "  5 dias úteis.\n", "Enviar a preencher depois", "https://example.com"]) {
    assert.equal(serviceDisplayValue(value), value);
  }
});

test("more information uses each service's own data and does not invent waiting times, laws or priorities", () => {
  const original = services.find((s) => s.workbookCells)!;
  const cells = { ...original.workbookCells!, Telefone: "(75) 9999-1111", "E-mail do setor/unidade": "", Plataforma: "Canal de controle", "Link de acesso": "https://example.com/controle", Prazo: "  12 dias.  " };
  const untouched = structuredClone(cells);
  const service = applyWorkbookCells(original, cells, original.sourceRow!);
  const html = renderToStaticMarkup(<ServiceMoreInformation service={service} contactAnchor="#canais" />);
  assert.match(html, /<summary>Quer saber mais\?<\/summary>/);
  for (const label of ["Mecanismos de consulta e comunicação", "Consulta ou acesso", "Comunicação", "Previsão de espera", "Prazo máximo estimado", "Meios de Contato", "Procedimentos", "Prioridades de atendimento", "Legislações Pertinente", "Informações adicionais"]) assert.ok(html.includes(label), label);
  assert.ok(html.includes(cells.Telefone));
  assert.ok(html.includes(cells.Prazo));
  assert.ok(html.includes(cells["Link de acesso"]));
  assert.ok(html.includes("Não informado."));
  assert.ok(!html.includes("sac@amargosa.ba.gov.br"));
  assert.ok(!html.includes("10.048"));
  assert.ok(!html.includes("A preencher"));
  assert.deepEqual(cells, untouched);
});

test("empty imported fields use the same presentation in service pages and private previews", () => {
  const original = services.find((s) => s.workbookCells)!;
  const cells = Object.fromEntries(Object.keys(original.workbookCells!).map((key) => [key, ""]));
  Object.assign(cells, { ID: "900001", Público: "Cidadão", "Nome do serviço consolidado": "Ficha de conferência", Custo: "A preencher", Prazo: "A preencher" });
  const service = applyWorkbookCells({ ...original, id: "planilha-900001", slug: "ficha-de-conferencia", detailLayout: "rich" }, cells, 900001);
  const html = renderToStaticMarkup(<CatalogPreviewProvider services={[service]}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
  for (const title of ["O que é?", "Quem Pode Solicitar?", "Pré requisitos e documentos necessários", "Quais as etapas?", "Quanto tempo leva?", "Taxas", "Quer saber mais?"]) assert.ok(html.includes(title), title);
  assert.ok(html.includes('<section id="documentos"><h2>Pré requisitos e documentos necessários</h2><ul><li>Não informado.</li>'));
  assert.ok(html.includes("Indeterminado."));
  assert.ok(!html.includes("A preencher"));
  assert.equal(service.workbookCells!.Custo, "A preencher");
  assert.equal(service.workbookCells!.Prazo, "A preencher");
});
