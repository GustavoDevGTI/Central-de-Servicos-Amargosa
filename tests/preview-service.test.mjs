import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import previewModule from "../desktop/services/preview-service.cjs";

test("cria uma cópia isolada do projeto para a prévia React", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "central-preview-test-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "source");
  const runtime = path.join(root, "runtime");
  const temporary = path.join(root, "temporary");
  for (const directory of ["app", "content", "public"]) fs.mkdirSync(path.join(source, directory), { recursive: true });
  fs.mkdirSync(runtime, { recursive: true });
  fs.mkdirSync(temporary, { recursive: true });
  fs.writeFileSync(path.join(source, "app", "page.tsx"), "export default function Page(){}");
  fs.writeFileSync(path.join(source, "content", "site.json"), '{"site":{"name":"original"}}');
  fs.writeFileSync(path.join(source, "package.json"), '{"scripts":{"dev":"vite"}}');
  fs.mkdirSync(path.join(source, "node_modules"));
  for (const file of ["vite.config.ts", "preview-entry.tsx", "next-link.tsx", "editor-bridge.js"]) fs.writeFileSync(path.join(runtime, file), "");
  const mirror = previewModule.createProjectMirror(source, temporary, runtime);
  fs.writeFileSync(path.join(mirror, "content", "site.json"), '{"site":{"name":"rascunho"}}');
  assert.equal(JSON.parse(fs.readFileSync(path.join(source, "content", "site.json"))).site.name, "original");
  assert.equal(JSON.parse(fs.readFileSync(path.join(mirror, "content", "site.json"))).site.name, "rascunho");
  assert.ok(fs.lstatSync(path.join(mirror, "node_modules")).isSymbolicLink() || fs.lstatSync(path.join(mirror, "node_modules")).isDirectory());
});
