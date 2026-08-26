import assert from "node:assert/strict";
import test from "node:test";
import normalization from "../desktop/services/content-normalization.cjs";

test("não recria segmentos excluídos em conteúdo atual", () => {
  const current = { schemaVersion: 3, pages: [{ id: "home", segments: [{ id: "cabecalho", name: "Cabeçalho", items: [] }] }] };
  const template = { schemaVersion: 3, pages: [{ id: "home", segments: [{ id: "cabecalho" }, { id: "busca" }] }] };
  const normalized = normalization.normalizeContent(structuredClone(current), template);
  assert.deepEqual(normalized.pages[0].segments.map((segment) => segment.id), ["cabecalho"]);
});

test("remove categoria descontinuada e suas referências", () => {
  const content = { schemaVersion: 3, pages: [{ segments: [
    { id: "catalogo", name: "Catálogo", items: [{ id: "admin", type: "service", category: "Administração e governo" }] },
    { id: "destaques", name: "Destaques", items: [{ id: "ref", type: "serviceRef", serviceId: "admin" }] },
  ] }] };
  const normalized = normalization.withoutDeprecatedContent(content);
  assert.equal(normalized.pages[0].segments[0].items.length, 0);
  assert.equal(normalized.pages[0].segments[1].items.length, 0);
});

test("migra a interação global antiga para cada segmento", () => {
  const content = { schemaVersion: 3, site: { design: { hoverEffect: "lift", clickEffect: "press" } }, pages: [{ segments: [
    { id: "cabecalho", name: "Cabeçalho", style: {}, items: [] },
    { id: "busca", name: "Busca", style: { hoverEffect: "outline", clickEffect: "none" }, items: [] },
  ] }] };
  const normalized = normalization.normalizeContent(content, content);
  assert.deepEqual(normalized.pages[0].segments.map((segment) => [segment.style.hoverEffect, segment.style.clickEffect]), [["lift", "press"], ["outline", "none"]]);
});
