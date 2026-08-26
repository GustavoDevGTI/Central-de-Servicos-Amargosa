const fs = require("node:fs");
const path = require("node:path");

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function removeOldEntries(directory, entries, limit) {
  for (const entry of entries.slice(limit)) fs.rmSync(path.join(directory, entry.name), { recursive: entry.directory, force: true });
}

function createBackupService(userDataDirectory, limit = 20) {
  function backupContent(filePath) {
    const backupDirectory = path.join(userDataDirectory, "backups");
    fs.mkdirSync(backupDirectory, { recursive: true });
    fs.copyFileSync(filePath, path.join(backupDirectory, `site-${timestamp()}.json`));
    const entries = fs.readdirSync(backupDirectory)
      .filter((file) => file.endsWith(".json"))
      .map((name) => ({ name, directory: false }))
      .sort((a, b) => b.name.localeCompare(a.name));
    removeOldEntries(backupDirectory, entries, limit);
  }

  function backupPortalContent(portal) {
    const safeName = path.basename(portal.directory).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 80) || "portal";
    const backupRoot = path.join(userDataDirectory, "portal-backups", safeName);
    const destination = path.join(backupRoot, timestamp());
    const files = portal.portalType === "react" ? [path.join("content", "site.json"), "portal-project.json"] : ["content.js", "content.json", "portal-project.json"];
    fs.mkdirSync(destination, { recursive: true });
    for (const file of files) {
      const source = path.join(portal.directory, file);
      const target = path.join(destination, file);
      if (!fs.existsSync(source)) continue;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
    const entries = fs.existsSync(backupRoot)
      ? fs.readdirSync(backupRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => ({ name: entry.name, directory: true })).sort((a, b) => b.name.localeCompare(a.name))
      : [];
    removeOldEntries(backupRoot, entries, limit);
  }

  return { backupContent, backupPortalContent };
}

module.exports = { createBackupService, removeOldEntries, timestamp };
