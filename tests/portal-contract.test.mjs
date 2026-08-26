import assert from "node:assert/strict";
import test from "node:test";
import contract from "../desktop/portal-contract.cjs";

test("gera manifestos estático e React pelo contrato central", () => {
  const content = { schemaVersion: 3 };
  const dates = { exportedAt: "2026-08-25T12:00:00.000Z", updatedAt: "2026-08-25T13:00:00.000Z" };
  const staticManifest = contract.createStaticManifest({}, content, "0.8.0", dates);
  const reactManifest = contract.createReactManifest({}, content, "0.8.0", dates);
  assert.equal(staticManifest.format, contract.PORTAL_FORMAT);
  assert.equal(staticManifest.formatVersion, contract.STATIC_FORMAT_VERSION);
  assert.deepEqual(staticManifest.contentFiles, ["content.js", "content.json"]);
  assert.equal(reactManifest.formatVersion, contract.REACT_FORMAT_VERSION);
  assert.equal(reactManifest.portalType, "react");
  assert.deepEqual(reactManifest.contentFiles, ["content/site.json"]);
  assert.equal(contract.inspectManifest(reactManifest).compatible, true);
});

test("recusa manifesto de outro produto", () => {
  assert.deepEqual(contract.inspectManifest({ format: "outro", formatVersion: 1 }), { compatible: false, reason: "format" });
});
