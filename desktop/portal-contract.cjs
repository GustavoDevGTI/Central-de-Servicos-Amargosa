const path = require("node:path");

const PORTAL_FORMAT = "central-servicos-amargosa";
const MANIFEST_FILE = "portal-project.json";
const CONTENT_SCRIPT_FILE = "content.js";
const CONTENT_JSON_FILE = "content.json";
const REACT_CONTENT_FILE = path.join("content", "site.json");
const PACKAGE_FILE = "package.json";
const STATIC_FORMAT_VERSION = 1;
const REACT_FORMAT_VERSION = 2;
const SCHEMA_VERSION = 3;

function normalizedContentFile(file) {
  return file.replaceAll("\\", "/");
}

function baseManifest(existing, content, builderVersion, updatedAt) {
  return {
    ...existing,
    format: PORTAL_FORMAT,
    schemaVersion: content.schemaVersion,
    builderVersion,
    updatedAt,
  };
}

function createStaticManifest(existing, content, builderVersion, dates = {}) {
  const updatedAt = dates.updatedAt || new Date().toISOString();
  return {
    ...baseManifest(existing, content, builderVersion, updatedAt),
    formatVersion: STATIC_FORMAT_VERSION,
    exportedAt: existing.exportedAt || dates.exportedAt || updatedAt,
    contentFiles: [CONTENT_SCRIPT_FILE, CONTENT_JSON_FILE],
  };
}

function createReactManifest(existing, content, builderVersion, dates = {}) {
  const updatedAt = dates.updatedAt || new Date().toISOString();
  return {
    ...baseManifest(existing, content, builderVersion, updatedAt),
    formatVersion: REACT_FORMAT_VERSION,
    portalType: "react",
    contentFiles: [normalizedContentFile(REACT_CONTENT_FILE)],
    buildCommand: "npm run build",
  };
}

function inspectManifest(manifest) {
  if (!manifest || typeof manifest !== "object") return { compatible: false, reason: "missing" };
  if (manifest.format !== PORTAL_FORMAT) return { compatible: false, reason: "format" };
  if (!Number.isInteger(manifest.formatVersion) || manifest.formatVersion < 1) return { compatible: false, reason: "version" };
  return { compatible: true, portalType: manifest.portalType === "react" || manifest.formatVersion >= REACT_FORMAT_VERSION ? "react" : "static" };
}

module.exports = {
  CONTENT_JSON_FILE,
  CONTENT_SCRIPT_FILE,
  MANIFEST_FILE,
  PACKAGE_FILE,
  PORTAL_FORMAT,
  REACT_CONTENT_FILE,
  REACT_FORMAT_VERSION,
  SCHEMA_VERSION,
  STATIC_FORMAT_VERSION,
  createReactManifest,
  createStaticManifest,
  inspectManifest,
  normalizedContentFile,
};
