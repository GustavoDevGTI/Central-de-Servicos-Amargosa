const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { contentSignature, isReactPortal, readPortalProject, writeFileAtomic, writePortalContent, writeReactPortalContent } = require("./portal-project.cjs");
const { runPortalBuild } = require("./services/compilation-service.cjs");
const { createBackupService } = require("./services/backup-service.cjs");
const { normalizeContent } = require("./services/content-normalization.cjs");
const { createFileService } = require("./services/file-service.cjs");
const { validateContent } = require("./services/validation.cjs");

const files = createFileService({ app, moduleDirectory: __dirname });
let backups;
let mainWindow;
let activePortal = null;

const normalize = (content) => normalizeContent(content, files.readTemplateContent());
const projectInfo = (portal = activePortal) => files.projectInfo(portal, app.getVersion());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#edf2ef",
    title: "Editor — Central de Serviços de Amargosa",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function portalPayload(portal, ok = true) {
  return { ok, content: portal.content, errors: validateContent(portal.content), project: projectInfo(portal), previewAssets: files.readPreviewAssets(portal.directory) };
}

ipcMain.handle("content:load", () => {
  files.seedPackagedContent();
  if (!app.isPackaged && isReactPortal(process.cwd())) {
    const portal = readPortalProject(process.cwd());
    portal.content = normalize(portal.content);
    activePortal = portal;
    return portalPayload(portal);
  }
  const content = normalize(JSON.parse(fs.readFileSync(files.editableContentPath(), "utf8")));
  return { content, project: projectInfo(null), previewAssets: files.readPreviewAssets() };
});

ipcMain.handle("content:save", async (_event, content) => {
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };
  if (activePortal) {
    const currentSignature = contentSignature(activePortal.directory, activePortal.portalType);
    if (currentSignature !== activePortal.signature) return { ok: false, conflict: true, errors: ["O conteúdo desta pasta foi alterado fora do construtor depois que ela foi aberta. Recarregue o portal para trazer essas mudanças antes de salvar."] };
    backups.backupPortalContent(activePortal);
    const written = activePortal.portalType === "react" ? writeReactPortalContent(activePortal.directory, content, app.getVersion()) : writePortalContent(activePortal.directory, content, app.getVersion());
    activePortal.signature = written.signature;
    activePortal.manifest = written.manifest;
    activePortal.contentSource = written.contentSource;
    const build = activePortal.portalType === "react" ? await runPortalBuild(activePortal.directory) : null;
    return { ok: true, filePath: path.join(activePortal.directory, written.contentSource), project: projectInfo(), build };
  }
  const filePath = files.editableContentPath();
  if (fs.existsSync(filePath)) backups.backupContent(filePath);
  writeFileAtomic(filePath, `${JSON.stringify(content, null, 2)}\n`);
  return { ok: true, filePath, project: projectInfo(null) };
});

ipcMain.handle("content:validate", (_event, content) => validateContent(content));

ipcMain.handle("site:open", async () => {
  const selected = await dialog.showOpenDialog(mainWindow, { title: "Abrir projeto React ou versão estática do portal", buttonLabel: "Abrir portal", properties: ["openDirectory"] });
  if (selected.canceled || !selected.filePaths[0]) return { ok: false, canceled: true };
  try {
    const portal = readPortalProject(selected.filePaths[0]);
    portal.content = normalize(portal.content);
    activePortal = portal;
    return portalPayload(portal);
  } catch (error) {
    return { ok: false, errors: [error.message || "Não foi possível abrir esta pasta."] };
  }
});

ipcMain.handle("site:reload", () => {
  if (!activePortal) return { ok: false, errors: ["Nenhum portal está aberto."] };
  try {
    const portal = readPortalProject(activePortal.directory);
    portal.content = normalize(portal.content);
    activePortal = portal;
    return portalPayload(portal);
  } catch (error) {
    return { ok: false, errors: [error.message || "Não foi possível recarregar esta pasta."] };
  }
});

ipcMain.handle("site:status", () => {
  if (!activePortal) return { ok: true, changed: false };
  try { return { ok: true, changed: contentSignature(activePortal.directory, activePortal.portalType) !== activePortal.signature }; }
  catch (error) { return { ok: false, errors: [error.message || "Não foi possível verificar a pasta do portal."] }; }
});

ipcMain.handle("site:build", async () => {
  if (!activePortal || activePortal.portalType !== "react") return { ok: false, errors: ["Abra um projeto React para executar a compilação."] };
  const build = await runPortalBuild(activePortal.directory);
  return build.ok ? { ok: true, build } : { ok: false, build, errors: [build.error] };
});

ipcMain.handle("site:export", async (_event, content) => {
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };
  if (activePortal?.portalType === "react") {
    const build = await runPortalBuild(activePortal.directory);
    return build.ok ? { ok: true, exportDirectory: activePortal.directory, compiledReactPortal: true, build } : { ok: false, build, errors: [build.error] };
  }
  const selected = await dialog.showOpenDialog(mainWindow, { title: "Escolha onde criar a versão publicável", buttonLabel: "Criar nesta pasta", properties: ["openDirectory", "createDirectory"] });
  if (selected.canceled || !selected.filePaths[0]) return { ok: false, canceled: true };
  try {
    const exportDirectory = files.createExportDirectory(selected.filePaths[0], activePortal);
    writePortalContent(exportDirectory, content, app.getVersion(), { exportedAt: new Date().toISOString() });
    shell.showItemInFolder(path.join(exportDirectory, "index.html"));
    return { ok: true, exportDirectory, basedOnOpenPortal: Boolean(activePortal) };
  } catch (error) {
    return { ok: false, errors: [error.message || "Não foi possível gerar o portal."] };
  }
});

ipcMain.handle("external:open", (_event, url) => shell.openExternal(url));

app.whenReady().then(() => {
  backups = createBackupService(app.getPath("userData"));
  files.seedPackagedContent();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
