import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { serviceDisplayValue, missingServiceInformation } from "./service-presentation";
import { ServiceMoreInformation } from "./service-more-information";
import { services } from "./service-catalog";
import { applyWorkbookCells } from "./workbook-service";
import { ServiceDetail } from "./internal-portal";
import { CatalogPreviewProvider } from "./catalog-provider";
import { serviceEditValues } from "./direct-service-content";
import { readTopics, documentTopicParts } from "./service-topics";
import { editService, initialEditorSnapshot, restoreServiceContent } from "../lib/service-editor";
import { snapshotServices } from "../lib/catalog-preview";

test("both service templates put contacts before costs, matching Central editor groups", () => {
  const original = services.find((service) => !service.workbookCells && service.slug)!;
  for (const detailLayout of ["rich", "standard"] as const) {
    const service = { ...original, detailLayout };
    const untouched = structuredClone(service);
    const html = renderToStaticMarkup(<CatalogPreviewProvider services={[service]}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
    const contacts = html.indexOf('id="canais"');
    const costs = html.indexOf('id="informacoes"');
    assert.ok(contacts > 0 && costs > contacts, detailLayout);
    assert.ok(html.indexOf('href="#canais"') < html.indexOf('href="#informacoes"'), `${detailLayout}: navigation`);
    assert.deepEqual(service, untouched);
  }
});

function documentItems(html: string) {
  const section = html.match(/<section id="documentos">([\s\S]*?)<\/section>/)![1];
  return [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
}

test("public and preview document lists match the editor's six IPTU topics without changing stored content", () => {
  const service = services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!;
  const source = structuredClone(service);
  const expected = readTopics(serviceEditValues(service).requiredDocuments, "bulleted").items;
  assert.equal(expected.length, 6);
  for (const detailLayout of ["rich", "standard"] as const) {
    const selected = { ...service, detailLayout };
    const html = renderToStaticMarkup(<CatalogPreviewProvider services={[selected]}><ServiceDetail slug={selected.slug!} initialService={selected} /></CatalogPreviewProvider>);
    assert.deepEqual(documentItems(html), expected);
  }
  assert.deepEqual(service, source);
});

test("edited document order and stage-two topics appear in every mirror and restoration", () => {
  const snapshot = initialEditorSnapshot();
  const selected = snapshot.services.find((s) => s.sourceRow === 22)!;
  const result = editService(snapshot, selected.id, { requiredDocuments: "Procuração;  CPF\r\nIdentificação", stage2Documents: "Parecer; Autorização" });
  for (const service of snapshotServices(result.snapshot).filter((s) => s.sourceRow === 22)) {
    const html = renderToStaticMarkup(<CatalogPreviewProvider services={[service]}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
    assert.deepEqual(documentItems(html), ["Procuração", "CPF", "Identificação"]);
    assert.match(html, /<section id="etapa-2"><h2>Etapa 2 - análise e conclusão<\/h2><ul><li\b[^>]*>Parecer<\/li><li\b[^>]*>Autorização<\/li><\/ul>/);
    assert.equal(serviceEditValues(service).requiredDocuments, "Procuração;  CPF\r\nIdentificação");
  }
  const restored = restoreServiceContent(result.snapshot, snapshot);
  assert.deepEqual(restored.rows, snapshot.rows);
  for (const service of snapshotServices(restored).filter((s) => s.sourceRow === 22)) {
    const html = renderToStaticMarkup(<CatalogPreviewProvider services={[service]}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
    assert.deepEqual(documentItems(html), readTopics(serviceEditValues(service).requiredDocuments, "bulleted").items);
  }
});

test("document boundaries preserve punctuation, spaces, unicode and original source offsets", () => {
  const text = "  RG (frente e verso);\r\nCPF: titular.\n📄 Procuração, se aplicável.  ";
  const untouched = text;
  const parts = documentTopicParts(text);
  assert.deepEqual(parts.map((part) => part.text), readTopics(text, "bulleted").items);
  for (const part of parts) assert.equal(text.slice(part.start, part.end), part.text);
  assert.equal(text, untouched);
  assert.deepEqual(documentTopicParts(""), [{ text: "", start: 0, end: 0 }]);
});

test("the optional second stage follows stage one in both templates and never remains in the drawer", () => {
  const snapshot = initialEditorSnapshot();
  const selected = snapshot.services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!;
  const cases = [
    { stage2Description: "", stage2Documents: "", visible: false },
    { stage2Description: " \r\n ", stage2Documents: "A preencher", visible: false },
    { stage2Description: "Não informado.", stage2Documents: "* Informação a ser adicionada.", visible: false },
    { stage2Description: "1. Conferir os documentos.\n2. Comunicar o resultado!", stage2Documents: "", visible: true },
    { stage2Description: "", stage2Documents: "Parecer; Autorização", visible: true },
    { stage2Description: "Conferir os documentos.\nComunicar o resultado!", stage2Documents: "Parecer; Autorização", visible: true },
  ];
  for (const { visible, ...fields } of cases) {
    const result = editService(snapshot, selected.id, fields);
    const current = snapshotServices(result.snapshot).find((s) => s.id === selected.id)!;
    for (const detailLayout of ["rich", "standard"] as const) {
      const service = { ...current, detailLayout };
      const html = renderToStaticMarkup(<CatalogPreviewProvider services={[service]}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
      assert.equal(html.includes('<section id="etapa-2">'), visible);
      assert.equal(html.includes('href="#etapa-2"'), visible);
      const drawer = html.match(/<section id="quer-saber-mais"[^>]*>([\s\S]*?)<\/section>/)![1];
      assert.ok(!drawer.includes("Etapa 2 - análise e conclusão"));
      if (!visible) continue;
      const firstId = detailLayout === "rich" ? "como-solicitar" : "como-fazer";
      assert.match(html, new RegExp(`<section id="${firstId}">[\\s\\S]*?<\\/section><section id="etapa-2">`));
      const stage = html.match(/<section id="etapa-2">([\s\S]*?)<\/section>/)![1];
      assert.ok(!stage.includes("Não informado."));
      assert.equal(stage.includes('<ol class="service-steps">'), Boolean(fields.stage2Description));
      assert.ok(!stage.includes("Documentos necessários"));
      assert.ok(!stage.includes("<h3>"));
      assert.equal(stage.includes("Parecer"), Boolean(fields.stage2Documents));
      if (fields.stage2Description) {
        assert.match(stage, /<b>1\.<\/b><span[^>]*>Conferir os documentos\.<\/span>/);
        assert.match(stage, /<b>2\.<\/b><span[^>]*>Comunicar o resultado!<\/span>/);
      }
    }
  }
  const filled = editService(snapshot, selected.id, { stage2Description: "Analisar o pedido." }).snapshot;
  const cleared = editService(filled, selected.id, { stage2Description: "" });
  const restored = restoreServiceContent(cleared.snapshot, filled);
  assert.equal(snapshotServices(restored).find((s) => s.id === selected.id)!.directEdit!.fields.stage2Description, "Analisar o pedido.");
});

test("missing values are presented without changing substantive costs, dates, links or cells", () => {
  for (const value of [undefined, null, "", "  ", "A preencher", " a PREENCHER. ", "* Informação a ser adicionada."]) {
    assert.equal(serviceDisplayValue(value), missingServiceInformation);
    assert.equal(serviceDisplayValue(value, "Prazo"), missingServiceInformation);
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
  for (const label of ["Mecanismos de consulta e acompanhamento", "Previsão de espera para atendimento", "Modalidades de atendimento", "Base legal", "Prioridades de atendimento", "Procedimentos para registro de manifestações", "Outras etapas / informações adicionais"]) assert.ok(html.includes(label), label);
  assert.ok(!html.includes("Etapa 2 - análise e conclusão"));
  assert.ok(!html.includes("Não informado."));
  assert.ok(!html.includes(missingServiceInformation));
  assert.match(html, /<h4>Nome\(s\) popular\(es\)<\/h4><p><\/p>/);
  assert.match(html, /<h4>Previsão de espera para atendimento<\/h4><p><\/p>/);
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
  for (const title of ["Descrição detalhada", "Requisitos para solicitar o serviço", "Documentos necessários", "Etapa 1 - solicitação", "Prazo máximo para conclusão", "Custo / taxa", "Quer saber mais?"]) assert.ok(html.includes(title), title);
  assert.ok(html.includes('<section id="documentos"><h2>Documentos necessários</h2><ul><li><em class="service-pending-information">' + missingServiceInformation + '</em></li>'));
  for (const id of ["o-que-e", "quem-pode", "como-solicitar", "informacoes", "canais"]) {
    const section = html.match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))![1];
    assert.ok(section.includes('<em class="service-pending-information">' + missingServiceInformation + '</em>'), id);
  }
  const drawer = html.match(/<section id="quer-saber-mais"[^>]*>([\s\S]*?)<\/section>/)![1];
  assert.ok(!drawer.includes(missingServiceInformation));
  assert.ok(!html.includes("Indeterminado."));
  assert.ok(!html.includes("A preencher"));
  assert.equal(service.workbookCells!.Custo, "A preencher");
  assert.equal(service.workbookCells!.Prazo, "A preencher");
});
