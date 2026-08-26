import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import state from "../desktop/renderer/state.js";
import communicationModule from "../desktop/renderer/communication.js";
import editing from "../desktop/renderer/editing.js";
import preview from "../desktop/renderer/preview.js";

test("estado oferece cinco modelos para todos os segmentos", () => {
  assert.equal(state.modelKeys.length, 5);
  assert.equal(Object.keys(state.siteThemePresets).length, 5);
  assert.equal(Object.keys(state.sitePalettePresets).length, 5);
  assert.equal(state.SITE_SELECTION_ID, "__site__");
  for (const type of state.segmentTypes) assert.equal((state.segmentModels[type] || state.segmentModels.generic).length, 5, type);
  assert.equal(state.segmentModels.hero.at(-1), "Busca sobre carrossel");
  for (const type of ["internalHeader", "internalHero", "contextualSearch", "internalCatalog", "serviceHero", "serviceContent"]) {
    assert.ok(state.segmentTypes.includes(type));
    assert.equal(state.segmentModels[type].length, 5);
  }
  const values = ["a", "b", "c"];
  assert.equal(state.move(values, 1, -1), true);
  assert.deepEqual(values, ["b", "a", "c"]);
});

test("páginas internas são compostas por segmentos editáveis", () => {
  const content = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "site.json"), "utf8"));
  const directory = content.pages.find((entry) => entry.id === "directory");
  const detail = content.pages.find((entry) => entry.id === "service-detail");
  assert.deepEqual(directory.segments.map((entry) => entry.type), ["internalHeader", "internalHero", "contextualSearch", "internalCatalog"]);
  assert.deepEqual(detail.segments.map((entry) => entry.type), ["internalHeader", "serviceHero", "serviceContent"]);
  for (const segment of [...directory.segments, ...detail.segments]) assert.ok(state.segmentModels[segment.type]?.length === 5, segment.type);
});

test("edição mantém padrões visuais isolados", () => {
  assert.deepEqual(editing.variantDefaults("editorial"), { radius: "square", spacing: "airy" });
  assert.deepEqual(editing.variantDefaults("soft"), { radius: "soft", spacing: "comfortable" });
  assert.deepEqual(editing.paletteForSegment("hero", state.sitePalettePresets.civic), { background: "#174f73", color: "#ffffff", accent: "#d1962d" });
  assert.deepEqual(editing.paletteForSegment("categories", state.sitePalettePresets.earth), { background: "#f2e7dc", color: "#3e3029", accent: "#704b38" });
});

test("prévia calcula escala sem alterar o viewport nativo", () => {
  assert.equal(preview.calculatePreviewScale(1490, { width: 1440, height: 900 }, "readable"), 1);
  assert.equal(preview.calculatePreviewScale(770, { width: 1440, height: 900 }, "readable"), 0.5);
  assert.equal(preview.calculatePreviewScale(770, { width: 1440, height: 900 }, "actual"), 1);
  assert.doesNotThrow(() => new Function(preview.resizePreviewScript()));
});

test("comunicação encaminha chamadas somente pela ponte segura", async () => {
  const calls = [];
  const api = new Proxy({}, { get: (_target, method) => (...args) => { calls.push([method, ...args]); return Promise.resolve(method); } });
  const bridge = communicationModule.createEditorCommunication(api);
  assert.equal(await bridge.save({ pages: [] }), "save");
  assert.deepEqual(calls, [["save", { pages: [] }]]);
});

test("prévia mantém o contrato visual, a tipografia editável e o painel oculto", () => {
  const templateDirectory = path.join(process.cwd(), "desktop", "templates");
  const appScript = fs.readFileSync(path.join(templateDirectory, "app.js"), "utf8");
  const portalCss = fs.readFileSync(path.join(process.cwd(), "app", "segments.css"), "utf8");
  const portalAccessibilityCss = fs.readFileSync(path.join(process.cwd(), "app", "accessibility.css"), "utf8");
  const staticCss = fs.readFileSync(path.join(templateDirectory, "dynamic.css"), "utf8");
  const staticAccessibilityCss = fs.readFileSync(path.join(templateDirectory, "accessibility.css"), "utf8");
  assert.match(appScript, /class="brand-image logo-image"/);
  assert.match(appScript, /text-size-/);
  assert.match(appScript, /hero-carousel/);
  assert.match(appScript, /site-root site-theme-/);
  assert.match(appScript, /siteDesign\.fontSize/);
  assert.match(appScript, /site-hover-\$\{siteDesign\.hoverEffect/);
  assert.match(appScript, /routeParams\.get\("publico"\)/);
  assert.match(appScript, /internal-query/);
  assert.match(appScript, /routeParams\.get\("servico"\)/);
  assert.match(appScript, /currentPage\.id === "directory"/);
  assert.match(appScript, /internalSegment\(directoryPage, "contextualSearch"\)/);
  assert.match(appScript, /internalSegment\(detailPage, "serviceContent"\)/);
  assert.match(appScript, /<nav aria-label="Navegação principal">.*accessibility-entry.*<\/nav><div class="header-actions"><a class="menu"/s);
  const previewScript = fs.readFileSync(path.join(process.cwd(), "desktop", "renderer", "preview.js"), "utf8");
  assert.match(previewScript, /type: "document-size"/);
  assert.match(previewScript, /type: "preview-scroll"/);
  assert.match(previewScript, /type: "move"/);
  assert.match(previewScript, /editor-alignment-guide/);
  assert.match(previewScript, /type: "reveal-selection"/);
  assert.doesNotMatch(appScript, /selectedSegment\)\?\.scrollIntoView/);
  const editorHtml = fs.readFileSync(path.join(process.cwd(), "desktop", "renderer", "index.html"), "utf8");
  const editorCss = fs.readFileSync(path.join(process.cwd(), "desktop", "renderer", "extensions.css"), "utf8");
  assert.doesNotMatch(editorHtml, /id="segment-(?:up|down)"/);
  assert.match(editorHtml, /id="segment-type" hidden/);
  assert.match(editorCss, /\.right-panel\{height:100%;max-height:100%;min-height:0;display:grid;grid-template-rows:50px minmax\(0,1fr\) auto;overflow:hidden\}/);
  assert.match(editorCss, /\.dynamic-editor\{width:100%;height:100%;max-height:100%;min-height:0;overflow-x:hidden;overflow-y:auto/);
  assert.match(portalCss, /\.amanda-panel\[hidden\]\{display:none!important\}/);
  assert.match(portalCss, /\.editable-segment\.text-size-large/);
  assert.match(portalAccessibilityCss, /translateY\(-3px\)/);
  assert.match(portalAccessibilityCss, /\.site-hover-lift/);
  assert.doesNotMatch(portalAccessibilityCss, /^:where\([^\n]+:hover\{/m);
  assert.match(portalAccessibilityCss, /prefers-reduced-motion:reduce.*transform:none!important/s);
  assert.match(staticCss, /\.amanda-panel\[hidden\]\{display:none!important\}/);
  assert.match(staticCss, /\.editable\.text-size-large/);
  assert.match(staticCss, /\.segment-contextualSearch\.variant-contrast/);
  assert.match(staticCss, /\.segment-serviceContent\.variant-editorial/);
  assert.match(staticAccessibilityCss, /translateY\(-3px\)/);
});
