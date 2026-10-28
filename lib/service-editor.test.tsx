import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { editService, initialEditorSnapshot, validateServicePatch, compareServiceContent, restoreServiceContent } from "./service-editor";
import { snapshotServices } from "./catalog-preview";
import { serviceEditValues } from "../app/direct-service-content";
import { ServiceDetail } from "../app/internal-portal";
import { CatalogPreviewProvider } from "../app/catalog-provider";
import type { CatalogSnapshot } from "./catalog-db";

function page(snapshot: CatalogSnapshot, id: string) {
  const services = snapshotServices(snapshot);
  const service = services.find((s) => s.id === id)!;
  return renderToStaticMarkup(<CatalogPreviewProvider services={services}><ServiceDetail slug={service.slug!} initialService={service} /></CatalogPreviewProvider>);
}
const actions = (html: string) => [...html.matchAll(/<a\b[^>]*class="service-(?:reference-notice|sei-guide)[^"]*"[\s\S]*?<\/a>/g)].map((m) => m[0]);

test("direct edits update every mirror, preserve archived cells and URLs and render the exact edited text", () => {
  const before = initialEditorSnapshot();
  const original = structuredClone(before);
  const selected = before.services.find((s) => s.sourceRow === 22)!;
  const result = editService(before, selected.id, { title: "Certidão revisada", summary: "  Texto literal\nCom pontuação!  ", requiredDocuments: "Documento novo", optionalDocuments: "", cost: "" });
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
  const after = editService(before, service.id, { whereWhen: "", department: "Outro setor", summary: "", phone: "", email: "", steps: "1. Primeira etapa.\n2. Segunda etapa." });
  assert.deepEqual(actions(page(before, service.id)), actions(page(after.snapshot, service.id)));
  const html = page(after.snapshot, service.id);
  assert.match(html, /Primeira etapa/);
  assert.match(html, /id="onde-quando"/);
  assert.match(html, /Não informado/);
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
  const result = editService(before, selected.id, { requiredDocuments: "", steps: "", whereWhen: "Agendar o atendimento previamente.", legislation: "Legislação revisada", phone: "", email: "" });
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

test("optional documents retain the original list and are never duplicated when content is resolved again", () => {
  const before = initialEditorSnapshot();
  const selected = before.services.find((s) => s.id === "1doc-isencao-de-iptu")!;
  const original = serviceEditValues(selected).requiredDocuments;
  const result = editService(before, selected.id, { optionalDocuments: "Documento opcional revisado" });
  const service = snapshotServices(result.snapshot).find((s) => s.id === selected.id)!;
  assert.equal(serviceEditValues(service).requiredDocuments, original);
  assert.equal(serviceEditValues(service).optionalDocuments, "Documento opcional revisado");
  assert.equal(service.documents?.filter((value) => value === "Documento opcional revisado").length, 1);
  const again = editService(result.snapshot, selected.id, { summary: "Uma outra informação." });
  assert.equal(snapshotServices(again.snapshot).find((s) => s.id === selected.id)!.documents?.filter((value) => value === "Documento opcional revisado").length, 1);
});
