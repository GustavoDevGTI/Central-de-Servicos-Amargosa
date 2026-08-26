function createEditorCommunication(api) {
  if (!api) throw new Error("A ponte segura do construtor não está disponível.");
  return Object.freeze({
    load: () => api.load(),
    save: (nextContent) => api.save(nextContent),
    validate: (nextContent) => api.validate(nextContent),
    openPortal: () => api.openPortal(),
    reloadPortal: () => api.reloadPortal(),
    checkPortalChanges: () => api.checkPortalChanges(),
    updatePreview: (nextContent) => api.updatePreview(nextContent),
    buildPortal: () => api.buildPortal(),
    exportSite: (nextContent) => api.exportSite(nextContent),
    openExternal: (url) => api.openExternal(url),
  });
}

const communication = typeof window !== "undefined" ? createEditorCommunication(window.centralAPI) : null;

function showMessage(title, messages, success = false) {
  $(".dialog-icon").textContent = success ? "✓" : "!";
  $("#dialog-title").textContent = title;
  $("#dialog-content").innerHTML = Array.isArray(messages) ? `<ul>${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>` : escapeHtml(messages);
  $("#validation-dialog").showModal();
}

function showValidation(errors) {
  const success = errors.length === 0;
  showMessage(success ? "Pronto para gerar" : "Revise estes pontos", success ? "A estrutura de páginas, segmentos e itens foi validada." : errors, success);
}

async function save() {
  const saveButton = $("#save"); const originalLabel = saveButton.textContent;
  saveButton.disabled = true; saveButton.textContent = project?.portalType === "react" ? "Salvando e compilando…" : "Salvando…";
  let result;
  try { result = await communication.save(content); }
  catch (error) { showMessage("Não foi possível salvar", error?.message || "O construtor não conseguiu acessar o projeto."); return false; }
  finally { saveButton.disabled = false; saveButton.textContent = originalLabel; }
  if (!result.ok) { showMessage(result.conflict ? "O portal mudou fora do construtor" : "Não foi possível salvar", result.errors || ["Revise o conteúdo e tente novamente."]); return false; }
  project = result.project || project; dirty = false; $(".save-state").className = "save-state";
  if (result.build && !result.build.ok) { $(".save-state").className = "save-state error"; $("#save-state").textContent = "Conteúdo salvo; compilação pendente"; }
  else if (result.localPortal && !result.localPortal.ok) { $(".save-state").className = "save-state error"; $("#save-state").textContent = "Portal salvo; servidor local indisponível"; }
  else $("#save-state").textContent = project?.portalType === "react" ? "Portal React salvo e compilado" : project?.kind === "portal" ? "Portal aberto atualizado" : "Todas as alterações foram salvas";
  renderProjectInfo();
  if (result.build && !result.build.ok) showMessage("O conteúdo foi salvo, mas a compilação falhou", [result.build.error || "Execute a compilação novamente depois de corrigir o projeto."]);
  else if (result.localPortal && !result.localPortal.ok) showMessage("O portal foi salvo, mas não abriu no navegador", [result.localPortal.error || "Não foi possível iniciar o servidor local."]);
  else showToast(project?.portalType === "react" ? "Conteúdo gravado e portal compilado" : project?.kind === "portal" ? "Conteúdo atualizado na pasta do portal" : "Projeto salvo com cópia de segurança");
  return true;
}

globalThis.CentralEditorCommunication = { createEditorCommunication };
if (typeof module !== "undefined" && module.exports) module.exports = { createEditorCommunication };
