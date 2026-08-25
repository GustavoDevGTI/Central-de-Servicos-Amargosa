import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import portalProject from "../desktop/portal-project.cjs";

const {
  contentSignature,
  extractAssignedJson,
  isReactPortal,
  readPortalProject,
  serializeContentScript,
  writePortalContent,
  writeReactPortalContent,
} = portalProject;

const sample = {
  schemaVersion: 3,
  site: { title: "Central de teste" },
  pages: [{ id: "home", name: "Início", slug: "/", segments: [] }],
};

test("lê CENTRAL_CONTENT mesmo com JavaScript antes e depois do objeto", () => {
  const source = `/* edição externa */\nwindow.CENTRAL_CONTENT = ${JSON.stringify(sample)};\nconsole.info("portal");`;
  assert.deepEqual(extractAssignedJson(source), sample);
});

test("preserva tamanhos personalizados de segmentos e itens", () => {
  const sized = structuredClone(sample);
  sized.pages[0].segments.push({ id: "busca", name: "Busca", type: "hero", enabled: true, size: { width: 980, height: 420 }, style: {}, items: [{ id: "titulo", type: "text", size: { width: 620, height: 96 } }] });
  assert.deepEqual(extractAssignedJson(serializeContentScript(sized)), sized);
});

test("preserva a mesclagem visual entre segmentos", () => {
  const merged = structuredClone(sample);
  merged.pages[0].segments.push(
    { id: "cabecalho", name: "Cabeçalho", type: "header", enabled: true, style: {}, items: [] },
    { id: "busca", name: "Busca", type: "hero", enabled: true, mergeWithPrevious: true, style: {}, items: [] },
  );
  assert.deepEqual(extractAssignedJson(serializeContentScript(merged)), merged);
});

test("abre, atualiza e reabre uma pasta estática sem substituir seus arquivos externos", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "central-portal-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, "index.html"), "<!doctype html><main></main>");
  fs.writeFileSync(path.join(directory, "styles.css"), "/* ALTERACAO-EXTERNA */\nbody{color:navy}");
  fs.writeFileSync(path.join(directory, "content.js"), `window.CENTRAL_CONTENT = ${JSON.stringify(sample)};\n`);

  const opened = readPortalProject(directory);
  assert.equal(opened.content.site.title, "Central de teste");
  const originalSignature = contentSignature(directory);

  opened.content.site.title = "Central alterada fora e dentro";
  writePortalContent(directory, opened.content, "0.6.0");

  assert.equal(fs.readFileSync(path.join(directory, "styles.css"), "utf8"), "/* ALTERACAO-EXTERNA */\nbody{color:navy}");
  assert.notEqual(contentSignature(directory), originalSignature);
  assert.equal(readPortalProject(directory).content.site.title, "Central alterada fora e dentro");
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, "portal-project.json"), "utf8")).builderVersion, "0.6.0");
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, "content.json"), "utf8")), opened.content);

  const editedJson = structuredClone(opened.content);
  editedJson.site.title = "Alteração externa no JSON portátil";
  const jsonPath = path.join(directory, "content.json");
  fs.writeFileSync(jsonPath, `${JSON.stringify(editedJson, null, 2)}\n`);
  const future = new Date(Date.now() + 2_000);
  fs.utimesSync(jsonPath, future, future);
  assert.equal(readPortalProject(directory).content.site.title, "Alteração externa no JSON portátil");
});

test("abre e atualiza o projeto React sem substituir código editado externamente", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "central-react-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "app"));
  fs.mkdirSync(path.join(directory, "content"));
  fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ name: "portal", version: "1.4.0", scripts: { build: "node build.mjs" } }));
  fs.writeFileSync(path.join(directory, "app", "page.tsx"), "// ALTERACAO-EXTERNA\nexport default function Page(){return null}\n");
  fs.writeFileSync(path.join(directory, "content", "site.json"), `${JSON.stringify(sample, null, 2)}\n`);

  assert.equal(isReactPortal(directory), true);
  const opened = readPortalProject(directory);
  assert.equal(opened.portalType, "react");
  assert.equal(opened.contentSource, path.join("content", "site.json"));
  const originalSignature = opened.signature;

  const updated = structuredClone(opened.content);
  updated.site.title = "Central salva pelo construtor";
  const written = writeReactPortalContent(directory, updated, "0.7.2");

  assert.notEqual(written.signature, originalSignature);
  assert.equal(readPortalProject(directory).content.site.title, "Central salva pelo construtor");
  assert.equal(fs.readFileSync(path.join(directory, "app", "page.tsx"), "utf8"), "// ALTERACAO-EXTERNA\nexport default function Page(){return null}\n");
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "portal-project.json"), "utf8"));
  assert.equal(manifest.portalType, "react");
  assert.equal(manifest.builderVersion, "0.7.2");
  assert.deepEqual(manifest.contentFiles, ["content/site.json"]);
});
