const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  CONTENT_JSON_FILE,
  CONTENT_SCRIPT_FILE,
  MANIFEST_FILE,
  PACKAGE_FILE,
  PORTAL_FORMAT,
  REACT_CONTENT_FILE,
  createReactManifest,
  createStaticManifest,
} = require("./portal-contract.cjs");

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

function readPackage(directory) {
  const filePath = path.join(directory, PACKAGE_FILE);
  if (!fs.existsSync(filePath)) return null;
  try { return readJson(filePath); } catch { return null; }
}

function isReactPortal(directory) {
  const resolved = path.resolve(directory);
  const packageJson = readPackage(resolved);
  return Boolean(
    packageJson?.scripts?.build
    && fs.existsSync(path.join(resolved, REACT_CONTENT_FILE))
    && (fs.existsSync(path.join(resolved, "app")) || fs.existsSync(path.join(resolved, "src"))),
  );
}

function readPortalProject(directory) {
  const resolved = path.resolve(directory);
  if (isReactPortal(resolved)) {
    const contentPath = path.join(resolved, REACT_CONTENT_FILE);
    return {
      directory: resolved,
      portalType: "react",
      content: readJson(contentPath),
      contentSource: REACT_CONTENT_FILE,
      manifest: readManifest(resolved),
      packageJson: readPackage(resolved),
      signature: contentSignature(resolved, "react"),
    };
  }
  const indexPath = path.join(resolved, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error("Escolha a pasta principal do projeto React ou de uma versão estática do portal.");
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
    portalType: "static",
    content,
    contentSource,
    manifest: readManifest(resolved),
    signature: contentSignature(resolved, "static"),
  };
}

function serializeContentScript(content) {
  return `window.CENTRAL_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
}

function writeFileAtomic(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  try {
    fs.writeFileSync(temporary, contents, "utf8");
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary);
  }
}

function writePortalContent(directory, content, builderVersion, dates = {}) {
  const resolved = path.resolve(directory);
  const existingManifest = readManifest(resolved) || {};
  const manifest = createStaticManifest(existingManifest, content, builderVersion, dates);
  writeFileAtomic(path.join(resolved, CONTENT_SCRIPT_FILE), serializeContentScript(content));
  writeFileAtomic(path.join(resolved, CONTENT_JSON_FILE), `${JSON.stringify(content, null, 2)}\n`);
  writeFileAtomic(path.join(resolved, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, contentSource: CONTENT_SCRIPT_FILE, signature: contentSignature(resolved, "static") };
}

function writeReactPortalContent(directory, content, builderVersion, dates = {}) {
  const resolved = path.resolve(directory);
  if (!isReactPortal(resolved)) throw new Error("Esta pasta não contém um projeto React compatível com a Central de Serviços.");
  const existingManifest = readManifest(resolved) || {};
  const manifest = createReactManifest(existingManifest, content, builderVersion, dates);
  writeFileAtomic(path.join(resolved, REACT_CONTENT_FILE), `${JSON.stringify(content, null, 2)}\n`);
  writeFileAtomic(path.join(resolved, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, contentSource: REACT_CONTENT_FILE, signature: contentSignature(resolved, "react") };
}

function hashFile(filePath, hash) {
  if (!fs.existsSync(filePath)) return;
  hash.update(path.basename(filePath));
  hash.update(fs.readFileSync(filePath));
}

function contentSignature(directory, portalType = isReactPortal(directory) ? "react" : "static") {
  const hash = crypto.createHash("sha256");
  if (portalType === "react") hashFile(path.join(directory, REACT_CONTENT_FILE), hash);
  else {
    hashFile(path.join(directory, CONTENT_SCRIPT_FILE), hash);
    hashFile(path.join(directory, CONTENT_JSON_FILE), hash);
  }
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
  REACT_CONTENT_FILE,
  PORTAL_FORMAT,
  contentSignature,
  extractAssignedJson,
  isPathInside,
  isReactPortal,
  readPortalProject,
  serializeContentScript,
  writeFileAtomic,
  writePortalContent,
  writeReactPortalContent,
};
