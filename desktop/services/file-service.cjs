const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { isPathInside, isReactPortal } = require("../portal-project.cjs");

function createFileService({ app, moduleDirectory, workingDirectory = process.cwd() }) {
  const sourceContentPath = () => path.join(workingDirectory, "content", "site.json");
  const templateDirectory = () => path.join(moduleDirectory, "templates");
  const recentProjectPath = () => path.join(app.getPath("userData"), "recent-project.json");
  const editableContentPath = () => {
    const source = sourceContentPath();
    if (!app.isPackaged && fs.existsSync(source)) return source;
    return path.join(app.getPath("userData"), "site.json");
  };
  const templateContentPath = () => app.isPackaged ? path.join(process.resourcesPath, "content", "site.json") : sourceContentPath();
  const readTemplateContent = () => JSON.parse(fs.readFileSync(templateContentPath(), "utf8"));
  const readRecentPortalDirectory = () => {
    try { return JSON.parse(fs.readFileSync(recentProjectPath(), "utf8")).directory || null; }
    catch { return null; }
  };
  const rememberPortalDirectory = (directory) => {
    const destination = recentProjectPath();
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${JSON.stringify({ directory: path.resolve(directory) }, null, 2)}\n`, "utf8");
  };

  function seedPackagedContent() {
    const destination = editableContentPath();
    if (fs.existsSync(destination)) return;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(process.resourcesPath, "content", "site.json"), destination);
  }

  function readPreviewAssets(portalDirectory = null) {
    const fallbackDirectory = templateDirectory();
    if (portalDirectory && isReactPortal(portalDirectory)) {
      const fallbacks = { "legacy.css": "styles.css", "segments.css": "dynamic.css", "fonts.css": "fonts.css", "accessibility.css": "accessibility.css" };
      const readReactCss = (file) => {
        const candidate = path.join(portalDirectory, "app", file);
        return fs.readFileSync(fs.existsSync(candidate) ? candidate : path.join(fallbackDirectory, fallbacks[file]), "utf8");
      };
      const fontCss = readReactCss("fonts.css").replaceAll('url("/fonts/', 'url("public/fonts/').replaceAll('url("fonts/', 'url("public/fonts/');
      return {
        baseUrl: pathToFileURL(`${portalDirectory}${path.sep}`).href,
        css: [readReactCss("legacy.css"), readReactCss("segments.css"), fontCss, readReactCss("accessibility.css")],
        appScript: fs.readFileSync(path.join(fallbackDirectory, "app.js"), "utf8"),
      };
    }
    const sourceDirectory = portalDirectory || fallbackDirectory;
    const readAsset = (file) => {
      const candidate = path.join(sourceDirectory, file);
      return fs.readFileSync(fs.existsSync(candidate) ? candidate : path.join(fallbackDirectory, file), "utf8");
    };
    const baseDirectory = fs.existsSync(sourceDirectory) ? sourceDirectory : fallbackDirectory;
    return {
      baseUrl: pathToFileURL(`${baseDirectory}${path.sep}`).href,
      css: ["styles.css", "dynamic.css", "portal-fixes.css", "fonts.css", "accessibility.css"].map(readAsset),
      appScript: fs.readFileSync(path.join(fallbackDirectory, "app.js"), "utf8"),
    };
  }

  function projectInfo(portal, version) {
    if (!portal) return { kind: "internal", name: "Projeto interno", directory: null, version, contentSource: "site.json" };
    return { kind: "portal", portalType: portal.portalType, name: path.basename(portal.directory), directory: portal.directory, version: portal.portalType === "react" ? portal.packageJson?.version || portal.manifest?.builderVersion || "versão anterior" : portal.manifest?.builderVersion || "versão anterior", contentSource: portal.contentSource };
  }

  function createExportDirectory(parentDirectory, activePortal) {
    const now = new Date();
    const suffix = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0"), String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join("");
    const exportDirectory = path.join(parentDirectory, `central-servicos-amargosa-${suffix}`);
    if (activePortal && isPathInside(activePortal.directory, exportDirectory)) throw new Error("Crie a nova versão fora da pasta do portal que está aberto.");
    fs.mkdirSync(exportDirectory, { recursive: false });
    if (activePortal) fs.cpSync(activePortal.directory, exportDirectory, { recursive: true });
    else {
      const templates = templateDirectory();
      for (const file of ["index.html", "styles.css", "dynamic.css", "portal-fixes.css", "fonts.css", "accessibility.css", "app.js"]) fs.copyFileSync(path.join(templates, file), path.join(exportDirectory, file));
      fs.cpSync(path.join(templates, "fonts"), path.join(exportDirectory, "fonts"), { recursive: true });
      fs.cpSync(path.join(templates, "menu"), path.join(exportDirectory, "menu"), { recursive: true });
    }
    return exportDirectory;
  }

  return { createExportDirectory, editableContentPath, projectInfo, readPreviewAssets, readRecentPortalDirectory, readTemplateContent, recentProjectPath, rememberPortalDirectory, seedPackagedContent, sourceContentPath, templateContentPath, templateDirectory };
}

module.exports = { createFileService };
