import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { editService, initialEditorSnapshot, validateServicePatch, compareServiceContent, restoreServiceContent } from "./service-editor";
import { snapshotServices } from "./catalog-preview";
import { serviceEditValues, publicServiceContent } from "../app/direct-service-content";
import { serviceEditFields, serviceEditGroups } from "../app/service-edit-fields";
import { ServiceDetail } from "../app/internal-portal";
import { CatalogPreviewProvider } from "../app/catalog-provider";
import type { CatalogSnapshot } from "./catalog-db";

function page(snapshot: CatalogSnapshot, id: string) {
  const services = snapshotServices(snapshot);
  const service = services.find((s) => s.id === id)!;
  return renderToStaticMarkup(<CatalogPreviewProvider services={services}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
}
const actions = (html: string) => [...html.matchAll(/<a\b[^>]*class="service-(?:reference-notice|sei-guide)[^"]*"[\s\S]*?<\/a>/g)].map((m) => m[0]);

test("access link changes only the main start destinations, without an extra URL row or help changes", () => {
  const snapshot = initialEditorSnapshot();
  const selected = [snapshot.services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!, snapshot.services.find((s) => !s.workbookCells && s.slug && s.url)!];
  for (const service of selected) {
    const before = page(snapshot, service.id);
    const url = "https://example.invalid/novo-acesso";
    const result = editService(snapshot, service.id, { accessUrl: url });
    const html = page(result.snapshot, service.id);
    const startActions = actions(html).filter((a) => a.includes('class="service-reference-notice'));
    assert.ok(startActions.length > 0);
    if (service.slug === "parcelamento-de-debito-do-iptu") assert.equal(startActions.length, 2);
    for (const action of startActions) { assert.ok(action.includes(`href="${url}"`)); assert.ok(action.includes("INICIAR")); }
    assert.ok(!html.includes("Site / link de acesso"));
    assert.ok(!html.includes(`>${url}</a>`));
    assert.deepEqual(actions(html).filter((a) => a.includes('class="service-sei-guide')), actions(before).filter((a) => a.includes('class="service-sei-guide')));
  }
});

test("direct edits update every mirror, preserve archived cells and URLs and render the exact edited text", () => {
  const before = initialEditorSnapshot();
  const original = structuredClone(before);
  const selected = before.services.find((s) => s.sourceRow === 22)!;
  const result = editService(before, selected.id, { title: "Certidão revisada", summary: "  Texto literal\nCom pontuação!  ", requiredDocuments: "Documento novo", stage2Documents: "Documento complementar", cost: "" });
  assert.equal(result.report.updated, 1);
  assert.equal(result.report.changes.length, 5);
  assert.equal(result.affectedIds.length, 3);
  for (const service of snapshotServices(result.snapshot).filter((s) => s.sourceRow === 22)) {
    assert.equal(service.title, "Certidão revisada");
    assert.equal(service.summary, "  Texto literal\nCom pontuação!  ");
    assert.equal(service.slug, before.services.find((s) => s.id === service.id)!.slug);
    assert.deepEqual(actions(page(before, service.id)), actions(page(result.snapshot, service.id)));
  }
  assert.deepEqual(before, original);
  assert.deepEqual(result.snapshot.rows, before.rows);
  assert.equal(editService(result.snapshot, selected.id, { title: "Certidão revisada" }).report.changes.length, 0);
});

test("URLs, action text, identifiers, layout, styles and publication state cannot be submitted", () => {
  for (const key of ["url", "id", "slug", "destination", "requestSystem", "accessMode", "notice", "noticeAction", "requestLabel", "inactive", "directEdit", "layout", "style", "__proto__", "constructor"]) {
    assert.throws(() => validateServicePatch(JSON.parse(`{"${key}":"x"}`)), /fixo|editado/);
  }
  assert.throws(() => validateServicePatch({ title: "  " }), /nome/);
  assert.throws(() => validateServicePatch({ summary: { text: "x" } }), /Texto inválido/);
  assert.throws(() => validateServicePatch({ summary: "x".repeat(20001) }), /limite/);
});

test("editing attendance or clearing fields retains the page structure and protected start/help actions", () => {
  const before = initialEditorSnapshot();
  const service = before.services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!;
  const after = editService(before, service.id, { hours: "", department: "Outro setor", summary: "", phone: "", email: "", steps: "1. Primeira etapa.\n2. Segunda etapa." });
  assert.deepEqual(actions(page(before, service.id)), actions(page(after.snapshot, service.id)));
  const html = page(after.snapshot, service.id);
  assert.match(html, /Primeira etapa/);
  assert.match(html, /id="onde-quando"/);
  assert.match(html, /<em class="service-pending-information">\* Informações a serem adicionadas\.<\/em>/);
  assert.equal(snapshotServices(after.snapshot).find((s) => s.id === service.id)!.directEdit?.layout.mergeContact, true);
});

test("services without spreadsheet mirrors support literal editing and restoration without changing their actions", () => {
  const before = initialEditorSnapshot();
  const service = before.services.find((s) => !s.workbookCells && s.slug && s.url)!;
  const after = editService(before, service.id, { summary: "Texto com SEI e 1Doc preservado.", phone: "", email: "", additional: "Informação adicional do serviço." });
  const edited = snapshotServices(after.snapshot).find((s) => s.id === service.id)!;
  assert.equal(serviceEditValues(edited).summary, "Texto com SEI e 1Doc preservado.");
  assert.equal(serviceEditValues(edited).email, "");
  assert.deepEqual(actions(page(before, service.id)), actions(page(after.snapshot, service.id)));
  assert.equal(compareServiceContent(before, after.snapshot).updated, 1);
  assert.ok(page(after.snapshot, service.id).includes("Informação adicional do serviço."));
  const restored = restoreServiceContent(after.snapshot, before);
  assert.equal(compareServiceContent(before, restored).changes.length, 0);
  assert.deepEqual(actions(page(before, service.id)), actions(page(restored, service.id)));
});

test("clearing legacy content preserves its template and edited attendance and laws replace old text", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.id === "1doc-isencao-de-iptu")!;
  const oldHtml = page(before, selected.id);
  const result = editService(before, selected.id, { requiredDocuments: "", steps: "", additional: "Agendar o atendimento previamente.", legislation: "Legislação revisada", phone: "", email: "" });
  const html = page(result.snapshot, selected.id);
  assert.match(html, /Agendar o atendimento previamente/);
  assert.match(html, /Legislação revisada/);
  assert.ok(!html.includes("Lei nº 5.172/1966"));
  assert.deepEqual([...oldHtml.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]), [...html.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual(actions(oldHtml), actions(html));
  const restored = restoreServiceContent(result.snapshot, before);
  assert.equal(compareServiceContent(before, restored).changes.length, 0);
  assert.match(page(restored, selected.id), /Lei nº 5.172\/1966/);
  assert.ok(!page(restored, selected.id).includes("Legislação revisada"));
});

test("new information fields are editable without turning text into HTML or modifying the help button", () => {
  const before = initialEditorSnapshot();
  const service = before.services.find((s) => s.workbookCells)!;
  const after = editService(before, service.id, { waitingTime: "10 minutos", priorities: "Orientação da unidade", legislation: "<script>alert(1)</script>", additional: "Dados complementares" });
  const html = page(after.snapshot, service.id);
  assert.ok(html.includes("10 minutos"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.deepEqual(actions(page(before, service.id)), actions(page(after.snapshot, service.id)));
  const restored = restoreServiceContent(after.snapshot, before);
  assert.equal(compareServiceContent(before, restored).changes.length, 0);
});

test("documents of stage two do not replace or duplicate existing stage-one documents", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.id === "1doc-isencao-de-iptu")!;
  const original = serviceEditValues(selected).requiredDocuments;
  const result = editService(before, selected.id, { stage2Documents: "Documento complementar revisado" });
  const service = snapshotServices(result.snapshot).find((s) => s.id === selected.id)!;
  assert.equal(serviceEditValues(service).requiredDocuments, original);
  assert.equal(serviceEditValues(service).stage2Documents, "Documento complementar revisado");
  assert.equal(service.documents?.includes("Documento complementar revisado"), false);
  const again = editService(result.snapshot, selected.id, { summary: "Uma outra informação." });
  assert.equal(serviceEditValues(snapshotServices(again.snapshot).find((s) => s.id === selected.id)!).requiredDocuments, original);
});

test("the editor mirrors all 34 PDF fields plus platform in six groups, with scoped stage labels", () => {
  const expected = ["NOME DO SERVIÇO", "NOME(S) POPULAR(ES)", "ÓRGÃO / SECRETARIA / SETOR", "CATEGORIA(S)", "PÚBLICO-ALVO / USUÁRIO", "CANAL DE PRESTAÇÃO", "STATUS DO SERVIÇO", "ÁREA RESPONSÁVEL", "RESPONSÁVEL PELO PREENCHIMENTO", "DESCRIÇÃO DETALHADA", "PREVISÃO DE ESPERA PARA ATENDIMENTO", "PRAZO MÁXIMO PARA CONCLUSÃO", "CUSTO / TAXA", "MODALIDADES DE ATENDIMENTO", "ENDEREÇO PRESENCIAL", "HORÁRIO DE ATENDIMENTO", "TELEFONE / WHATSAPP", "E-MAIL OFICIAL", "SITE / LINK DE ACESSO", "MECANISMOS DE CONSULTA E ACOMPANHAMENTO", "LINK ATUAL DO SERVIÇO NO BA.GOV", "REQUISITOS PARA SOLICITAR O SERVIÇO", "DESCRIÇÃO DA ETAPA", "DOCUMENTOS NECESSÁRIOS", "DESCRIÇÃO DA ETAPA", "DOCUMENTOS NECESSÁRIOS", "OUTRAS ETAPAS / INFORMAÇÕES ADICIONAIS", "BASE LEGAL", "PRIORIDADES DE ATENDIMENTO", "CANAL DA OUVIDORIA", "PROCEDIMENTOS PARA REGISTRO DE MANIFESTAÇÕES", "DATA DO PREENCHIMENTO / ATUALIZAÇÃO", "CONTATO DO RESPONSÁVEL", "OBSERVAÇÕES PARA A SIMP"];
  assert.deepEqual(serviceEditFields.filter((field) => field.key !== "platform").map((field) => field.label.toLocaleUpperCase("pt-BR")), expected);
  assert.equal(serviceEditFields.find((field) => field.key === "platform")!.label, "Plataforma");
  assert.equal(serviceEditGroups.length, 6);
  assert.equal(new Set(serviceEditFields.map((field) => field.key)).size, expected.length + 1);
  for (const field of ["whereWhen", "extension", "optionalDocuments", "communication", "maximumTime", "contactMeans"]) assert.throws(() => validateServicePatch({ [field]: "novo valor" }));
});

test("platform edits update public contact cards and mirrors, preserve actions, and restore exactly", () => {
  const before = initialEditorSnapshot();
  const selected = [before.services.find((s) => s.sourceRow === 22)!, before.services.find((s) => !s.workbookCells && s.slug && s.url)!];
  for (const original of selected) {
    const platform = "  Canal revisado / SEI\nAtendimento digital.  ";
    const result = editService(before, original.id, { platform });
    assert.equal(result.report.changes.length, 1);
    assert.equal(result.report.changes[0].column, "Plataforma");
    assert.equal(result.report.changes[0].before, serviceEditValues(original).platform);
    assert.equal(result.report.changes[0].after, platform);
    for (const id of result.affectedIds) {
      const service = snapshotServices(result.snapshot).find((entry) => entry.id === id)!;
      assert.equal(serviceEditValues(service).platform, platform);
      assert.equal(service.destination, platform);
      if (service.workbookCells) assert.equal(service.workbookCells.Plataforma, platform);
      const html = page(result.snapshot, id);
      assert.ok(html.includes(platform));
      assert.deepEqual(actions(html), actions(page(before, id)));
      assert.equal(service.requestSystem, before.services.find((entry) => entry.id === id)!.requestSystem);
    }
    assert.deepEqual(result.snapshot.rows, before.rows);
    assert.equal(editService(result.snapshot, original.id, { platform }).report.changes.length, 0);
    const restored = restoreServiceContent(result.snapshot, before);
    assert.equal(serviceEditValues(snapshotServices(restored).find((entry) => entry.id === original.id)!).platform, serviceEditValues(original).platform);
    if (!original.workbookCells) assert.ok(!page(restored, original.id).includes("<span>Plataforma</span>"));
    assert.equal(compareServiceContent(before, restored).changes.length, 0);
    const empty = editService(result.snapshot, original.id, { platform: "" });
    assert.equal(serviceEditValues(snapshotServices(empty.snapshot).find((entry) => entry.id === original.id)!).platform, "");
    assert.match(page(empty.snapshot, original.id), /Plataforma[\s\S]*?Informações a serem adicionadas/);
  }
  assert.throws(() => validateServicePatch({ platform: "x".repeat(20001) }), /limite/);
  const script = editService(before, selected[0].id, { platform: "<script>alert(1)</script>" });
  assert.ok(page(script.snapshot, selected[0].id).includes("&lt;script&gt;"));
  assert.ok(!page(script.snapshot, selected[0].id).includes("<script>alert(1)</script>"));
});

test("audience and eligibility are public: audience labels the header and eligibility fills its own section", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.slug === "abastecimento-de-agua")!;
  const result = editService(before, selected.id, { audience: "Cidadãos, Empresas", eligibility: "Requisito confirmado para a solicitação." });
  const html = page(result.snapshot, selected.id);
  assert.match(html, /<small>Cidadãos, Empresas<\/small>/);
  assert.match(html, /<section id="quem-pode">[\s\S]*?Requisito confirmado para a solicitação\./);
});

test("audience selections update header and filter IDs in mirrors and independent records and restore", () => {
  const before = initialEditorSnapshot();
  const selected = [before.services.find((s) => s.sourceRow === 22)!, before.services.find((s) => !s.workbookCells && s.slug)!];
  for (const original of selected) {
    const result = editService(before, original.id, { audience: "Servidores, Órgãos Públicos e ONGs, Ouvidoria" });
    for (const id of result.affectedIds) {
      const service = snapshotServices(result.snapshot).find((s) => s.id === id)!;
      assert.deepEqual(service.audienceIds, ["servidor", "orgaos-publicos-ongs", "ouvidoria"]);
      assert.equal(service.audienceId, "servidor");
      assert.equal(serviceEditValues(service).audience, "Servidores, Órgãos Públicos e ONGs, Ouvidoria");
      assert.match(page(result.snapshot, id), /<small>Servidores, Órgãos Públicos e ONGs, Ouvidoria<\/small>/);
    }
    assert.deepEqual(result.snapshot.rows, before.rows);
    const restored = restoreServiceContent(result.snapshot, before);
    assert.equal(serviceEditValues(snapshotServices(restored).find((s) => s.id === original.id)!).audience, serviceEditValues(original).audience);
    const cleared = editService(result.snapshot, original.id, { audience: "" });
    assert.deepEqual(snapshotServices(cleared.snapshot).find((s) => s.id === original.id)!.audienceIds, []);
  }
  for (const audience of ["Público inventado", "Cidadãos, Empresas, Qualquer outro", "Cidadãos, Cidadãos", "Empresa inventada", "e"]) assert.throws(() => validateServicePatch({ audience }), /públicos/);
  assert.throws(() => validateServicePatch({ audience: ["cidadao"] }), /Texto inválido/);
});

test("access links change in every mirror and restore without changing button text, guides, page URLs or source rows", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.sourceRow === 22)!;
  const url = "https://www.ba.gov.br/servico/pm-amargosa/servico-revisado";
  const result = editService(before, selected.id, { accessUrl: url, baGovUrl: url });
  for (const service of snapshotServices(result.snapshot).filter((s) => s.sourceRow === 22)) {
    assert.equal(service.url, url);
    const updated = actions(page(result.snapshot, service.id)).map((html) => html.replaceAll(url, before.services.find((s) => s.id === service.id)!.url));
    assert.deepEqual(updated, actions(page(before, service.id)));
    assert.equal(service.slug, before.services.find((s) => s.id === service.id)!.slug);
  }
  assert.deepEqual(result.snapshot.rows, before.rows);
  const restored = restoreServiceContent(result.snapshot, before);
  assert.equal(snapshotServices(restored).find((s) => s.id === selected.id)!.url, selected.url);
  assert.equal(compareServiceContent(before, restored).changes.length, 0);
  for (const accessUrl of ["javascript:alert(1)", "data:text/html,x", "ftp://example.com", "https://a:b@example.com", " https://example.com", "https://example.com\nx"]) assert.throws(() => validateServicePatch({ accessUrl }), /endereço/);
  assert.throws(() => validateServicePatch({ baGovUrl: "https://example.com" }), /BA.GOV/);
});

test("inactive services remain editable and can be reactivated with their aliases and history", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.sourceRow === 22)!;
  const hidden = editService(before, selected.id, { status: "Inativo" });
  assert.equal(hidden.report.deactivated, 1);
  assert.ok(snapshotServices(hidden.snapshot).filter((s) => s.sourceRow === 22).every((s) => s.inactive));
  const maintained = editService(hidden.snapshot, selected.id, { status: "Em manutenção" });
  assert.equal(maintained.report.reactivated, 1);
  assert.ok(snapshotServices(maintained.snapshot).filter((s) => s.sourceRow === 22).every((s) => !s.inactive));
  const restored = restoreServiceContent(hidden.snapshot, before);
  assert.ok(snapshotServices(restored).filter((s) => s.sourceRow === 22).every((s) => !s.inactive));
  assert.deepEqual(hidden.snapshot.rows, before.rows);
  assert.throws(() => validateServicePatch({ status: "publicado" }), /opção válida/);
});

test("private filling controls are stored and compared but absent from public serialization and service HTML", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.sourceRow === 22)!;
  const secret = { filledBy: "Responsável interno de conferência", responsibleContact: "interno-conferencia@example.invalid", simpNotes: "Observação interna exclusiva", updatedDate: "31/12/2099" };
  const result = editService(before, selected.id, secret);
  const service = snapshotServices(result.snapshot).find((s) => s.id === selected.id)!;
  for (const [key, value] of Object.entries(secret)) {
    assert.equal(service.directEdit!.fields[key as keyof typeof secret], value);
    assert.ok(!JSON.stringify(publicServiceContent(service)).includes(value));
    assert.ok(!page(result.snapshot, selected.id).includes(value));
  }
  assert.equal(result.report.changes.length, 4);
});

test("new PDF answers use existing attendance cards and the drawer, never the PDF example answers", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!;
  const result = editService(before, selected.id, { hours: "Segundas, 10h às 12h.", address: "Endereço confirmado pela unidade", popularNames: "Parcelamento municipal", stage2Description: "Conferir a documentação e comunicar o resultado.", stage2Documents: "Comprovante complementar", procedures: "Registrar manifestação e guardar o protocolo.", deliveryChannel: "Híbrido", attendanceModes: "Presencial\nSite ou sistema" });
  const html = page(result.snapshot, selected.id);
  for (const value of ["Segundas, 10h às 12h.", "Endereço confirmado pela unidade", "Parcelamento municipal", "Conferir a documentação e comunicar o resultado.", "Comprovante complementar", "Registrar manifestação e guardar o protocolo."]) assert.ok(html.includes(value), value);
  assert.equal((html.match(/Segundas, 10h às 12h\./g) || []).length, 1);
  assert.deepEqual(actions(page(before, selected.id)), actions(html));
});

test("historical optional documents and drawer answers survive migration without obsolete writable fields", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.sourceRow === 22)!;
  const legacy = editService(before, selected.id, { summary: "Descrição histórica" }).snapshot;
  legacy.services = legacy.services.map((service) => service.sourceRow !== 22 ? service : { ...service, directEdit: { layout: service.directEdit!.layout, fields: { summary: "Descrição histórica", requiredDocuments: "Documento exigido", optionalDocuments: "Documento opcional antigo", communication: "Comunicação histórica", contactMeans: "Meio de contato histórico", maximumTime: "45 dias" } } });
  const changed = editService(legacy, selected.id, { summary: "Descrição atualizada" });
  const values = serviceEditValues(snapshotServices(changed.snapshot).find((s) => s.id === selected.id)!);
  assert.equal(values.requiredDocuments, "Documento exigido\nDocumento opcional antigo");
  assert.equal(values.stage2Documents, "");
  for (const text of ["Comunicação histórica", "Meio de contato histórico", "45 dias"]) assert.ok(values.additional.includes(text));
  assert.equal(compareServiceContent(legacy, changed.snapshot).changes.length, 1);
});

test("an inherited source number never couples an unlinked service to workbook mirrors", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => !s.workbookCells)!;
  before.services = before.services.map((s) => s.id === selected.id ? { ...s, sourceRow: 22 } : s);
  const result = editService(before, selected.id, { title: "Nome independente" });
  assert.deepEqual(result.affectedIds, [selected.id]);
  assert.equal(result.report.changes[0].sourceRow, undefined);
  for (const service of snapshotServices(result.snapshot).filter((s) => s.workbookCells && s.sourceRow === 22)) assert.notEqual(service.title, "Nome independente");
});

test("editing the PDF phone and hours does not leave stale duplicates in the attendance introduction", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.slug === "parcelamento-de-debito-do-iptu")!;
  const result = editService(before, selected.id, { phone: "(75) 99999-8888", hours: "Quintas, 9h às 11h." });
  const html = page(result.snapshot, selected.id);
  assert.ok(html.includes("(75) 99999-8888"));
  assert.ok(!html.includes("Telefone: (75) 3512-7811."));
  assert.equal((html.match(/Quintas, 9h às 11h\./g) || []).length, 1);
});
