import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import projectBuild from "../desktop/services/compilation-service.cjs";

const { buildConfiguration } = projectBuild;

test("configura a compilação do portal React pela pasta raiz", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "central-build-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ scripts: { build: "vinext build" } }));

  const configuration = buildConfiguration(directory);
  assert.equal(configuration.directory, path.resolve(directory));
  if (process.platform === "win32") {
    assert.match(configuration.command, /cmd\.exe$/i);
    assert.deepEqual(configuration.args, [
      "/d", "/s", "/c", `pushd "${path.resolve(directory)}" && npm run build`,
    ]);
  } else {
    assert.equal(configuration.command, "npm");
    assert.deepEqual(configuration.args, ["run", "build"]);
  }
});

test("recusa projeto sem comando de compilação", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "central-build-invalid-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ scripts: {} }));
  assert.throws(() => buildConfiguration(directory), /comando de compilação/);
});
