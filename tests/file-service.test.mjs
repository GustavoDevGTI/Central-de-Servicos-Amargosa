import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import fileModule from "../desktop/services/file-service.cjs";

test("separa conteúdo editável e informações do portal", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "central-files-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "content"));
  fs.writeFileSync(path.join(root, "content", "site.json"), "{}");
  const app = { isPackaged: false, getPath: () => path.join(root, "user-data"), getVersion: () => "0.8.0" };
  const service = fileModule.createFileService({ app, moduleDirectory: path.join(root, "desktop"), workingDirectory: root });
  assert.equal(service.editableContentPath(), path.join(root, "content", "site.json"));
  assert.deepEqual(service.projectInfo(null, "0.8.0"), { kind: "internal", name: "Projeto interno", directory: null, version: "0.8.0", contentSource: "site.json" });
});
