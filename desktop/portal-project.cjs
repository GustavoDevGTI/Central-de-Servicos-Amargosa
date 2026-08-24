const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PORTAL_FORMAT = "central-servicos-amargosa";
const MANIFEST_FILE = "portal-project.json";
const CONTENT_SCRIPT_FILE = "content.js";
const CONTENT_JSON_FILE = "content.json";

function extractAssignedJson(source) {
  const assignment = /(?:window\.)?CENTRAL_CONTENT\s*=/.exec(source);
  if (!assignment) throw new Error("O arquivo content.js não contém CENTRAL_CONTENT.");
  const start = source.indexOf("{", assignment.index + assignment[0].length);
  if (start < 0) throw new Error("O conteúdo do portal não foi encontrado em content.js.");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, index + 1));
    }
  }
  throw new Error("O objeto CENTRAL_CONTENT está incompleto em content.js.");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readManifest(directory) {
  const filePath = path.join(directory, MANIFEST_FILE);
  if (!fs.existsSync(filePath)) return null;
  try { return readJson(filePath); } catch { return null; }
}

function readPortalProject(directory) {
  const resolved = path.resolve(directory);
  const indexPath = path.join(resolved, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error("Escolha a pasta principal do portal, onde está o arquivo index.html.");
  const scriptPath = path.join(resolved, CONTENT_SCRIPT_FILE);
  const jsonPath = path.join(resolved, CONTENT_JSON_FILE);
  const legacyPaths = [path.join(resolved, "content", "site.json"), path.join(resolved, "site.json")];
  let content;
  let contentSource;
  const hasScript = fs.existsSync(scriptPath);
  const hasJson = fs.existsSync(jsonPath);
  const jsonIsNewer = hasScript && hasJson && fs.statSync(jsonPath).mtimeMs > fs.statSync(scriptPath).mtimeMs;
  if (hasJson && (!hasScript || jsonIsNewer)) {
    content = readJson(jsonPath);
    contentSource = CONTENT_JSON_FILE;
  } else if (hasScript) {
    content = extractAssignedJson(fs.readFileSync(scriptPath, "utf8"));
    contentSource = CONTENT_SCRIPT_FILE;
  } else if (hasJson) {
    content = readJson(jsonPath);
    contentSource = CONTENT_JSON_FILE;
  } else {
    const legacyPath = legacyPaths.find((candidate) => fs.existsSync(candidate));
    if (!legacyPath) throw new Error("Esta pasta não contém content.js, content.json ou site.json. Ela não parece ser uma versão editável deste portal.");
    content = readJson(legacyPath);
    contentSource = path.relative(resolved, legacyPath);
  }
  return {
    directory: resolved,
    content,
    contentSource,
    manifest: readManifest(resolved),
    signature: contentSignature(resolved),
  };
}

function serializeContentScript(content) {
  return `window.CENTRAL_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
}

function writePortalContent(directory, content, builderVersion, dates = {}) {
  const resolved = path.resolve(directory);
  const exportedAt = dates.exportedAt || new Date().toISOString();
  const existingManifest = readManifest(resolved) || {};
  const manifest = {
    ...existingManifest,
    format: PORTAL_FORMAT,
    formatVersion: 1,
    schemaVersion: content.schemaVersion,
    builderVersion,
    exportedAt: existingManifest.exportedAt || exportedAt,
    updatedAt: dates.updatedAt || exportedAt,
    contentFiles: [CONTENT_SCRIPT_FILE, CONTENT_JSON_FILE],
  };
  fs.writeFileSync(path.join(resolved, CONTENT_SCRIPT_FILE), serializeContentScript(content), "utf8");
  fs.writeFileSync(path.join(resolved, CONTENT_JSON_FILE), `${JSON.stringify(content, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(resolved, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { manifest, signature: contentSignature(resolved) };
}

function hashFile(filePath, hash) {
  if (!fs.existsSync(filePath)) return;
  hash.update(path.basename(filePath));
  hash.update(fs.readFileSync(filePath));
}

function contentSignature(directory) {
  const hash = crypto.createHash("sha256");
  hashFile(path.join(directory, CONTENT_SCRIPT_FILE), hash);
  hashFile(path.join(directory, CONTENT_JSON_FILE), hash);
  return hash.digest("hex");
}

function isPathInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

module.exports = {
  CONTENT_JSON_FILE,
  CONTENT_SCRIPT_FILE,
  MANIFEST_FILE,
  PORTAL_FORMAT,
  contentSignature,
  extractAssignedJson,
  isPathInside,
  readPortalProject,
  serializeContentScript,
  writePortalContent,
};
