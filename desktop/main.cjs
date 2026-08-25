const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  contentSignature,
  isPathInside,
  isReactPortal,
  readPortalProject,
  writeFileAtomic,
  writePortalContent,
  writeReactPortalContent,
} = require("./portal-project.cjs");
const { runPortalBuild } = require("./project-build.cjs");

let mainWindow;
let activePortal = null;

function sourceContentPath() {
  return path.join(process.cwd(), "content", "site.json");
}

function editableContentPath() {
  const source = sourceContentPath();
  if (!app.isPackaged && fs.existsSync(source)) return source;
  return path.join(app.getPath("userData"), "site.json");
}

function seedPackagedContent() {
  const destination = editableContentPath();
  if (fs.existsSync(destination)) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const bundled = path.join(process.resourcesPath, "content", "site.json");
  fs.copyFileSync(bundled, destination);
}

function templateContentPath() {
  return app.isPackaged ? path.join(process.resourcesPath, "content", "site.json") : sourceContentPath();
}

function templateDirectory() {
  return path.join(__dirname, "templates");
}

function readPreviewAssets(portalDirectory = null) {
  if (portalDirectory && isReactPortal(portalDirectory)) {
    const fallbacks = { "legacy.css": "styles.css", "segments.css": "dynamic.css", "fonts.css": "fonts.css", "accessibility.css": "accessibility.css" };
    const readReactCss = (file) => {
      const candidate = path.join(portalDirectory, "app", file);
      return fs.readFileSync(fs.existsSync(candidate) ? candidate : path.join(templateDirectory(), fallbacks[file]), "utf8");
    };
    const fontCss = readReactCss("fonts.css").replaceAll('url("/fonts/', 'url("public/fonts/').replaceAll('url("fonts/', 'url("public/fonts/');
    return {
      baseUrl: pathToFileURL(`${portalDirectory}${path.sep}`).href,
      css: [readReactCss("legacy.css"), readReactCss("segments.css"), fontCss, readReactCss("accessibility.css")],
      appScript: fs.readFileSync(path.join(templateDirectory(), "app.js"), "utf8"),
    };
  }
  const sourceDirectory = portalDirectory || templateDirectory();
  const fallbackDirectory = templateDirectory();
  const readAsset = (file) => {
    const candidate = path.join(sourceDirectory, file);
    const filePath = fs.existsSync(candidate) ? candidate : path.join(fallbackDirectory, file);
    return fs.readFileSync(filePath, "utf8");
  };
  const baseDirectory = fs.existsSync(sourceDirectory) ? sourceDirectory : fallbackDirectory;
  return {
    baseUrl: pathToFileURL(`${baseDirectory}${path.sep}`).href,
    css: ["styles.css", "dynamic.css", "fonts.css", "accessibility.css"].map(readAsset),
    appScript: fs.readFileSync(path.join(fallbackDirectory, "app.js"), "utf8"),
  };
}

function projectInfo(portal = activePortal) {
  if (!portal) return { kind: "internal", name: "Projeto interno", directory: null, version: app.getVersion(), contentSource: "site.json" };
  return {
    kind: "portal",
    portalType: portal.portalType,
    name: path.basename(portal.directory),
    directory: portal.directory,
    version: portal.manifest?.builderVersion || portal.packageJson?.version || "versão anterior",
    contentSource: portal.contentSource,
  };
}

function withoutDeprecatedContent(content) {
  const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const isAdministration = (value) => normalize(value) === "administracao e governo";
  const removedItemIds = new Set(["hero-description", "hero-privacy", "audiences-eyebrow", "audiences-description", "featured-description"]);
  for (const page of content?.pages || []) {
    page.segments = (page.segments || []).filter((segment) => !isAdministration(segment.name));
    const removedServices = new Set();
    for (const segment of page.segments) {
      segment.items = (segment.items || []).filter((item) => {
        if (removedItemIds.has(item.id)) return false;
        if (item.type === "category" && isAdministration(item.label)) return false;
        if (item.type === "service" && isAdministration(item.category)) { removedServices.add(item.id); return false; }
        return true;
      });
    }
    for (const segment of page.segments) segment.items = (segment.items || []).filter((item) => item.type !== "serviceRef" || !removedServices.has(item.serviceId));
  }
  return content;
}

function normalizeContent(content) {
  const template = JSON.parse(fs.readFileSync(templateContentPath(), "utf8"));
  if ((content?.schemaVersion || 1) >= 3 && Array.isArray(content.pages)) {
    return withoutDeprecatedContent(content);
  }
  const migrated = JSON.parse(JSON.stringify(template));
  const segments = migrated.pages[0].segments;
  const findSegment = (type) => segments.find((segment) => segment.type === type);
  const setText = (segmentType, role, value) => {
    const item = findSegment(segmentType)?.items.find((entry) => entry.role === role);
    if (item && typeof value === "string") item.value = value;
  };
  const identity = content?.identity || {};
  migrated.site.primaryColor = identity.primaryColor || migrated.site.primaryColor;
  migrated.site.accentColor = identity.accentColor || migrated.site.accentColor;
  for (const segment of segments) {
    if (segment.style.accent === template.site.primaryColor) segment.style.accent = migrated.site.primaryColor;
  }
  setText("header", "brandLine", identity.brandLine);
  setText("header", "municipality", identity.municipality);
  setText("header", "subtitle", "Central de Serviços");
  setText("hero", "eyebrow", content?.hero?.eyebrow);
  setText("hero", "title", content?.hero?.title);
  setText("hero", "description", content?.hero?.description);
  const search = findSegment("hero")?.items.find((entry) => entry.type === "search");
  if (search && content?.hero?.searchPlaceholder) search.placeholder = content.hero.searchPlaceholder;
  for (const type of ["utility", "header", "help"]) {
    for (const link of findSegment(type)?.items.filter((entry) => entry.type === "link") || []) {
      if (link.role === "external" || link.role === "action") link.url = identity.portalUrl || link.url;
    }
  }
  if (Array.isArray(content?.audiences) && content.audiences.length) {
    const segment = findSegment("audiences");
    segment.items = [...segment.items.filter((entry) => entry.type !== "audience"), ...content.audiences.map((entry) => ({ id: entry.id, type: "audience", role: "entry", label: entry.label, description: entry.description || "", initials: entry.initials || entry.label?.slice(0, 2).toUpperCase() || "PU" }))];
  }
  if (Array.isArray(content?.services) && content.services.length) {
    const catalog = findSegment("catalog");
    catalog.items = [...catalog.items.filter((entry) => entry.type !== "service"), ...content.services.map((entry) => ({ id: entry.id, type: "service", role: "entry", title: entry.title, department: entry.department, category: entry.category, audienceId: entry.audience || "cidadao", destination: entry.destination, url: entry.url, initials: entry.initials || "SV" }))];
    const featured = findSegment("featured");
    featured.items = [...featured.items.filter((entry) => entry.type !== "serviceRef"), ...content.services.filter((entry) => entry.featured).map((entry) => ({ id: `featured-${entry.id}`, type: "serviceRef", role: "entry", label: entry.title, serviceId: entry.id }))];
  }
  setText("help", "title", content?.help?.title);
  setText("help", "description", content?.help?.description);
  const helpLink = findSegment("help")?.items.find((entry) => entry.role === "action");
  if (helpLink && content?.help?.label) helpLink.text = `${content.help.label} ↗`;
  setText("footer", "description", identity.tagline);
  migrated.schemaVersion = 3;
  return withoutDeprecatedContent(migrated);
}

function backupContent(filePath) {
  const backupDirectory = path.join(app.getPath("userData"), "backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  fs.copyFileSync(filePath, path.join(backupDirectory, `site-${stamp}.json`));
  const backups = fs.readdirSync(backupDirectory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ file, time: fs.statSync(path.join(backupDirectory, file)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  for (const oldBackup of backups.slice(20)) fs.rmSync(path.join(backupDirectory, oldBackup.file));
}

function backupPortalContent(portal) {
  const directory = portal.directory;
  const safeName = path.basename(directory).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 80) || "portal";
  const backupRoot = path.join(app.getPath("userData"), "portal-backups", safeName);
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const destination = path.join(backupRoot, stamp);
  const files = portal.portalType === "react"
    ? [path.join("content", "site.json"), "portal-project.json"]
    : ["content.js", "content.json", "portal-project.json"];
  fs.mkdirSync(destination, { recursive: true });
  for (const file of files) {
    const source = path.join(directory, file);
    const target = path.join(destination, file);
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  }
  const backups = fs.existsSync(backupRoot)
    ? fs.readdirSync(backupRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort().reverse()
    : [];
  for (const oldBackup of backups.slice(20)) fs.rmSync(path.join(backupRoot, oldBackup.name), { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#edf2ef",
    title: "Editor — Central de Serviços de Amargosa",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function validateContent(content) {
  const errors = [];
  const validateSize = (size, label, minimumWidth) => {
    if (size == null) return;
    const width = Number(size.width); const height = Number(size.height);
    if (!Number.isFinite(width) || width < minimumWidth || width > 4096 || !Number.isFinite(height) || height < 32 || height > 4096) errors.push(`${label}: o tamanho personalizado é inválido.`);
  };
  if (content?.schemaVersion !== 3) errors.push("O projeto precisa usar a estrutura atual (versão 3).");
  if (!Array.isArray(content?.pages) || content.pages.length === 0) return [...errors, "Cadastre ao menos uma página."];
  const slugs = new Set();
  const allSegments = content.pages.flatMap((page) => page.segments || []);
  const audiences = new Set(allSegments.flatMap((segment) => segment.items || []).filter((item) => item.type === "audience").map((item) => item.id));
  const services = new Set(allSegments.flatMap((segment) => segment.items || []).filter((item) => item.type === "service").map((item) => item.id));
  const validUrl = (value, allowAnchor = false) => {
    if (allowAnchor && typeof value === "string" && value.startsWith("#")) return true;
    try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
  };
  for (const [pageIndex, page] of content.pages.entries()) {
    const pageLabel = page.name || `Página ${pageIndex + 1}`;
    if (!page.name?.trim()) errors.push(`Página ${pageIndex + 1}: informe o nome.`);
    if (!page.slug?.startsWith("/")) errors.push(`${pageLabel}: o endereço deve começar com /.`);
    if (slugs.has(page.slug)) errors.push(`${pageLabel}: o endereço está repetido.`); else slugs.add(page.slug);
    if (!Array.isArray(page.segments) || page.segments.length === 0) errors.push(`${pageLabel}: adicione ao menos um segmento.`);
    const segmentIds = new Set();
    for (const [segmentIndex, segment] of (page.segments || []).entries()) {
      const segmentLabel = segment.name || `Segmento ${segmentIndex + 1}`;
      if (!segment.name?.trim()) errors.push(`${pageLabel}, segmento ${segmentIndex + 1}: informe o nome.`);
      if (!segment.type?.trim()) errors.push(`${segmentLabel}: informe o tipo.`);
      validateSize(segment.size, segmentLabel, 160);
      if (segment.mergeWithPrevious != null && typeof segment.mergeWithPrevious !== "boolean") errors.push(`${segmentLabel}: a opção de mesclagem é inválida.`);
      if (segmentIds.has(segment.id)) errors.push(`${segmentLabel}: identificador de segmento repetido.`); else segmentIds.add(segment.id);
      if (!Array.isArray(segment.items)) errors.push(`${segmentLabel}: a lista de itens é inválida.`);
      const itemIds = new Set();
      for (const [itemIndex, item] of (segment.items || []).entries()) {
        const itemLabel = item.label || item.title || `Item ${itemIndex + 1}`;
        if (!item.id || itemIds.has(item.id)) errors.push(`${segmentLabel}: o identificador de “${itemLabel}” é inválido ou repetido.`); else itemIds.add(item.id);
        validateSize(item.size, `${segmentLabel}, ${itemLabel}`, 40);
        if (item.type === "link" && !validUrl(item.url, true)) errors.push(`${segmentLabel}, ${itemLabel}: informe uma URL completa ou uma âncora iniciada por #.`);
        if (item.type === "image" && item.src && !/^data:image\//.test(item.src) && !validUrl(item.src)) errors.push(`${segmentLabel}, ${itemLabel}: a imagem é inválida.`);
        if (item.type === "image" && item.src?.length > 2_900_000) errors.push(`${segmentLabel}, ${itemLabel}: a imagem ultrapassa o limite de 2 MB.`);
        if (item.type === "service") {
          if (!item.title?.trim() || !item.department?.trim()) errors.push(`${segmentLabel}, serviço ${itemIndex + 1}: informe nome e órgão responsável.`);
          if (!audiences.has(item.audienceId)) errors.push(`${segmentLabel}, ${item.title || itemLabel}: selecione um público válido.`);
          if (!validUrl(item.url)) errors.push(`${segmentLabel}, ${item.title || itemLabel}: informe uma URL completa.`);
        }
        if (item.type === "serviceRef" && !services.has(item.serviceId)) errors.push(`${segmentLabel}, ${itemLabel}: selecione um serviço existente no catálogo.`);
      }
    }
  }
  return errors;
}

ipcMain.handle("content:load", () => {
  seedPackagedContent();
  if (!app.isPackaged && isReactPortal(process.cwd())) {
    const portal = readPortalProject(process.cwd());
    portal.content = normalizeContent(portal.content);
    activePortal = portal;
    return { content: portal.content, project: projectInfo(), previewAssets: readPreviewAssets(portal.directory) };
  }
  const content = normalizeContent(JSON.parse(fs.readFileSync(editableContentPath(), "utf8")));
  return { content, project: projectInfo(null), previewAssets: readPreviewAssets() };
});

ipcMain.handle("content:save", async (_event, content) => {
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };
  if (activePortal) {
    const currentSignature = contentSignature(activePortal.directory, activePortal.portalType);
    if (currentSignature !== activePortal.signature) {
      return {
        ok: false,
        conflict: true,
        errors: ["O conteúdo desta pasta foi alterado fora do construtor depois que ela foi aberta. Recarregue o portal para trazer essas mudanças antes de salvar."],
      };
    }
    backupPortalContent(activePortal);
    const written = activePortal.portalType === "react"
      ? writeReactPortalContent(activePortal.directory, content, app.getVersion())
      : writePortalContent(activePortal.directory, content, app.getVersion());
    activePortal.signature = written.signature;
    activePortal.manifest = written.manifest;
    activePortal.contentSource = written.contentSource;
    const build = activePortal.portalType === "react" ? await runPortalBuild(activePortal.directory) : null;
    return {
      ok: true,
      filePath: path.join(activePortal.directory, written.contentSource),
      project: projectInfo(),
      build,
    };
  }
  const filePath = editableContentPath();
  if (fs.existsSync(filePath)) backupContent(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileAtomic(filePath, `${JSON.stringify(content, null, 2)}\n`);
  return { ok: true, filePath, project: projectInfo(null) };
});

ipcMain.handle("content:validate", (_event, content) => validateContent(content));

ipcMain.handle("site:open", async () => {
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: "Abrir projeto React ou versão estática do portal",
    buttonLabel: "Abrir portal",
    properties: ["openDirectory"],
  });
  if (selected.canceled || !selected.filePaths[0]) return { ok: false, canceled: true };
  try {
    const portal = readPortalProject(selected.filePaths[0]);
    portal.content = normalizeContent(portal.content);
    activePortal = portal;
    return {
      ok: true,
      content: portal.content,
      errors: validateContent(portal.content),
      project: projectInfo(),
      previewAssets: readPreviewAssets(portal.directory),
    };
  } catch (error) {
    return { ok: false, errors: [error.message || "Não foi possível abrir esta pasta."] };
  }
});

ipcMain.handle("site:reload", () => {
  if (!activePortal) return { ok: false, errors: ["Nenhum portal está aberto."] };
  try {
    const portal = readPortalProject(activePortal.directory);
    portal.content = normalizeContent(portal.content);
    activePortal = portal;
    return {
      ok: true,
      content: portal.content,
      errors: validateContent(portal.content),
      project: projectInfo(),
      previewAssets: readPreviewAssets(portal.directory),
    };
  } catch (error) {
    return { ok: false, errors: [error.message || "Não foi possível recarregar esta pasta."] };
  }
});

ipcMain.handle("site:status", () => {
  if (!activePortal) return { ok: true, changed: false };
  try {
    return {
      ok: true,
      changed: contentSignature(activePortal.directory, activePortal.portalType) !== activePortal.signature,
    };
  } catch (error) {
    return { ok: false, errors: [error.message || "Não foi possível verificar a pasta do portal."] };
  }
});

ipcMain.handle("site:build", async () => {
  if (!activePortal || activePortal.portalType !== "react") {
    return { ok: false, errors: ["Abra um projeto React para executar a compilação."] };
  }
  const build = await runPortalBuild(activePortal.directory);
  return build.ok ? { ok: true, build } : { ok: false, build, errors: [build.error] };
});

ipcMain.handle("site:export", async (_event, content) => {
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };
  if (activePortal?.portalType === "react") {
    const build = await runPortalBuild(activePortal.directory);
    return build.ok
      ? { ok: true, exportDirectory: activePortal.directory, compiledReactPortal: true, build }
      : { ok: false, build, errors: [build.error] };
  }
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: "Escolha onde criar a versão publicável",
    buttonLabel: "Criar nesta pasta",
    properties: ["openDirectory", "createDirectory"],
  });
  if (selected.canceled || !selected.filePaths[0]) return { ok: false, canceled: true };
  const now = new Date();
  const suffix = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0"), String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join("");
  const exportDirectory = path.join(selected.filePaths[0], `central-servicos-amargosa-${suffix}`);
  if (activePortal && isPathInside(activePortal.directory, exportDirectory)) {
    return { ok: false, errors: ["Crie a nova versão fora da pasta do portal que está aberto."] };
  }
  fs.mkdirSync(exportDirectory, { recursive: false });
  if (activePortal) {
    fs.cpSync(activePortal.directory, exportDirectory, { recursive: true });
  } else {
    const templates = templateDirectory();
    for (const file of ["index.html", "styles.css", "dynamic.css", "fonts.css", "accessibility.css", "app.js"]) {
      fs.copyFileSync(path.join(templates, file), path.join(exportDirectory, file));
    }
    fs.cpSync(path.join(templates, "fonts"), path.join(exportDirectory, "fonts"), { recursive: true });
    fs.cpSync(path.join(templates, "menu"), path.join(exportDirectory, "menu"), { recursive: true });
  }
  writePortalContent(exportDirectory, content, app.getVersion(), { exportedAt: new Date().toISOString() });
  shell.showItemInFolder(path.join(exportDirectory, "index.html"));
  return { ok: true, exportDirectory, basedOnOpenPortal: Boolean(activePortal) };
});

ipcMain.handle("external:open", (_event, url) => shell.openExternal(url));

app.whenReady().then(() => {
  seedPackagedContent();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
