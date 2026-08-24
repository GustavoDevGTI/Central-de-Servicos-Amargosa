const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

let mainWindow;

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

function normalizeContent(content) {
  const template = JSON.parse(fs.readFileSync(templateContentPath(), "utf8"));
  if (!Array.isArray(content.audiences) || content.audiences.length === 0) content.audiences = template.audiences;
  if (!Array.isArray(content.services)) content.services = [];
  if ((content.schemaVersion || 1) < 2) {
    for (const templateService of template.services) {
      const existing = content.services.find((service) => service.id === templateService.id);
      if (existing) {
        existing.audience ||= templateService.audience;
      } else {
        content.services.push(templateService);
      }
    }
  }
  const validAudienceIds = new Set(content.audiences.map((audience) => audience.id));
  for (const service of content.services) {
    if (!validAudienceIds.has(service.audience)) service.audience = "cidadao";
  }
  content.schemaVersion = 2;
  return content;
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
  if (!content?.identity?.municipality?.trim()) errors.push("Informe o nome do município.");
  if (!content?.hero?.title?.trim()) errors.push("Informe o título principal.");
  if (!Array.isArray(content?.audiences) || content.audiences.length === 0) errors.push("Cadastre ao menos um público.");
  for (const [index, audience] of (content.audiences || []).entries()) {
    if (!audience.label?.trim()) errors.push(`Público ${index + 1}: informe o nome.`);
  }
  try {
    const portalUrl = new URL(content?.identity?.portalUrl);
    if (!["https:", "http:"].includes(portalUrl.protocol)) throw new Error("invalid protocol");
  } catch {
    errors.push("Informe a URL completa do portal oficial.");
  }
  if (!Array.isArray(content?.services) || content.services.length === 0) errors.push("Cadastre ao menos um serviço.");
  for (const [index, service] of (content.services || []).entries()) {
    if (!service.title?.trim()) errors.push(`Serviço ${index + 1}: informe o nome.`);
    if (!service.department?.trim()) errors.push(`Serviço ${index + 1}: informe o órgão responsável.`);
    if (!content.audiences?.some((audience) => audience.id === service.audience)) errors.push(`Serviço ${index + 1}: selecione um público válido.`);
    try {
      const url = new URL(service.url);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("invalid protocol");
    } catch {
      errors.push(`Serviço ${index + 1}: informe uma URL completa iniciada por https://.`);
    }
  }
  return errors;
}

ipcMain.handle("content:load", () => {
  seedPackagedContent();
  return normalizeContent(JSON.parse(fs.readFileSync(editableContentPath(), "utf8")));
});

ipcMain.handle("content:save", (_event, content) => {
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };
  const filePath = editableContentPath();
  if (fs.existsSync(filePath)) backupContent(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  return { ok: true, filePath };
});

ipcMain.handle("content:validate", (_event, content) => validateContent(content));

ipcMain.handle("site:export", async (_event, content) => {
  const errors = validateContent(content);
  if (errors.length) return { ok: false, errors };
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: "Escolha onde criar a versão publicável",
    buttonLabel: "Criar nesta pasta",
    properties: ["openDirectory", "createDirectory"],
  });
  if (selected.canceled || !selected.filePaths[0]) return { ok: false, canceled: true };
  const now = new Date();
  const suffix = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0"), String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join("");
  const exportDirectory = path.join(selected.filePaths[0], `central-servicos-amargosa-${suffix}`);
  fs.mkdirSync(exportDirectory, { recursive: false });
  const templateDirectory = path.join(__dirname, "templates");
  for (const file of ["index.html", "styles.css", "app.js"]) {
    fs.copyFileSync(path.join(templateDirectory, file), path.join(exportDirectory, file));
  }
  fs.writeFileSync(path.join(exportDirectory, "content.js"), `window.CENTRAL_CONTENT = ${JSON.stringify(content, null, 2)};\n`, "utf8");
  shell.showItemInFolder(path.join(exportDirectory, "index.html"));
  return { ok: true, exportDirectory };
});

ipcMain.handle("external:open", (_event, url) => shell.openExternal(url));

app.whenReady().then(() => {
  seedPackagedContent();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
