const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("centralAPI", {
  load: () => ipcRenderer.invoke("content:load"),
  save: (content) => ipcRenderer.invoke("content:save", content),
  validate: (content) => ipcRenderer.invoke("content:validate", content),
  exportSite: (content) => ipcRenderer.invoke("site:export", content),
  openExternal: (url) => ipcRenderer.invoke("external:open", url),
});
