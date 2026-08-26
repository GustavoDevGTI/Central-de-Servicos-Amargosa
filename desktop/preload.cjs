const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("centralAPI", {
  load: () => ipcRenderer.invoke("content:load"),
  save: (content) => ipcRenderer.invoke("content:save", content),
  validate: (content) => ipcRenderer.invoke("content:validate", content),
  openPortal: () => ipcRenderer.invoke("site:open"),
  reloadPortal: () => ipcRenderer.invoke("site:reload"),
  checkPortalChanges: () => ipcRenderer.invoke("site:status"),
  updatePreview: (content) => ipcRenderer.invoke("preview:update", content),
  buildPortal: () => ipcRenderer.invoke("site:build"),
  exportSite: (content) => ipcRenderer.invoke("site:export", content),
  openExternal: (url) => ipcRenderer.invoke("external:open", url),
});
