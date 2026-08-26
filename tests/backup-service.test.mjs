import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import backupModule from "../desktop/services/backup-service.cjs";

test("cria cópia do conteúdo e respeita o limite de retenção", (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "central-backup-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "site.json");
  const backupDirectory = path.join(root, "backups");
  fs.writeFileSync(source, "{}"); fs.mkdirSync(backupDirectory);
  fs.writeFileSync(path.join(backupDirectory, "antigo-1.json"), "{}");
  fs.writeFileSync(path.join(backupDirectory, "antigo-2.json"), "{}");
  const service = backupModule.createBackupService(root, 2);
  service.backupContent(source);
  const backups = fs.readdirSync(backupDirectory).filter((file) => file.endsWith(".json"));
  assert.equal(backups.length, 2);
  assert.ok(backups.some((file) => file.startsWith("site-")));
});
