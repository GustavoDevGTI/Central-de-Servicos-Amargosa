function selectEditorMode(mode) {
  editorMode = mode;
  $$('[data-editor-mode]').forEach((entry) => entry.classList.toggle("active", entry.dataset.editorMode === editorMode));
  $$('[data-editor-pane]').forEach((pane) => pane.classList.toggle("hidden", pane.dataset.editorPane !== editorMode));
  $$(".dynamic-editor").forEach((editor) => { editor.scrollTop = 0; });
}

function bindStaticEvents() {
  $("#open-portal").addEventListener("click", async () => {
    if (dirty && !confirm("Há alterações não salvas. Deseja abrir outro portal e descartá-las?")) return;
    const result = await communication.openPortal();
    if (result.canceled) return;
    if (!result.ok) return showMessage("Não foi possível abrir o portal", result.errors || ["Escolha outra pasta."]);
    applyProjectPayload(result, result.project?.portalType === "react" ? "Projeto React aberto" : "Portal estático aberto");
    showToast("Portal aberto para edição");
    if (result.errors?.length) showMessage("Portal aberto com pontos para revisar", result.errors);
  });
  $("#reload-portal").addEventListener("click", async () => {
    if (dirty && !confirm("Recarregar descarta as alterações ainda não salvas e lê novamente os arquivos externos. Continuar?")) return;
    const result = await communication.reloadPortal();
    if (!result.ok) return showMessage("Não foi possível recarregar o portal", result.errors || ["Tente abrir a pasta novamente."]);
    applyProjectPayload(result, "Mudanças externas recarregadas");
    showToast("Mudanças externas carregadas");
    if (result.errors?.length) showMessage("Portal recarregado com pontos para revisar", result.errors);
  });
  $$('[data-editor-mode]').forEach((button) => button.addEventListener("click", () => selectEditorMode(button.dataset.editorMode)));
  $("#page-select").addEventListener("change", (event) => { selectedPageId = event.target.value; selectedSegmentId = page().segments[0]?.id; selectedItemId = null; renderEditor(); renderPreview(); });
  $("#page-name").addEventListener("input", (event) => { page().name = event.target.value; $("#page-select").selectedOptions[0].textContent = event.target.value || "Página sem nome"; markDirty(); });
  $("#page-slug").addEventListener("input", (event) => { page().slug = event.target.value; markDirty(); });
  $("#add-page").addEventListener("click", () => { const id = uid("pagina"); content.pages.push({ id, name: "Nova página", slug: `/${id}`, segments: [] }); selectedPageId = id; selectedSegmentId = null; selectedItemId = null; renderEditor(); markDirty(); });
  $("#add-segment").addEventListener("click", () => {
    const entry = { id: uid("segmento"), name: "Novo segmento", type: "generic", enabled: true, mergeWithPrevious: false, style: { background: "#ffffff", color: "#193a31", accent: content.site.primaryColor, width: "contained", spacing: "comfortable", radius: "soft", variant: "institutional", headingFont: "lora", bodyFont: "source", fontSize: "normal", hoverEffect: "none", clickEffect: "none", backgroundImage: "" }, items: [] };
    page().segments.push(entry); selectedSegmentId = entry.id; selectedItemId = null; renderEditor(); markDirty();
  });
  $("#segment-name").addEventListener("input", (event) => { segment().name = event.target.value; $("#segment-heading").textContent = event.target.value; renderSegments(); markDirty(); });
  $("#segment-enabled").addEventListener("change", (event) => { segment().enabled = event.target.checked; renderSegments(); markDirty(); });
  [["style-background", "background"], ["style-color", "color"], ["style-accent", "accent"], ["style-width", "width"], ["style-spacing", "spacing"], ["style-radius", "radius"], ["style-heading-font", "headingFont"], ["style-body-font", "bodyFont"], ["style-font-size", "fontSize"], ["style-hover-effect", "hoverEffect"], ["style-click-effect", "clickEffect"]].forEach(([id, field]) => $("#" + id).addEventListener("input", (event) => { segment().style[field] = event.target.value; markDirty(); }));
  [["site-heading-font", "headingFont"], ["site-body-font", "bodyFont"], ["site-font-size", "fontSize"]].forEach(([id, field]) => $("#" + id).addEventListener("input", (event) => applySiteTypography(field, event.target.value)));
  $("#background-upload").addEventListener("change", (event) => readImage(event.target.files[0], (source) => { segment().style.backgroundImage = source; renderEditor(); markDirty(); }));
  $("#remove-background").addEventListener("click", () => { segment().style.backgroundImage = ""; renderEditor(); markDirty(); });
  $("#hero-gallery-upload").addEventListener("change", (event) => {
    const current = segment(); if (!current || !["hero", "internalHero", "serviceHero"].includes(current.type)) return;
    const gallery = current.style.backgroundImages ||= [];
    const files = [...event.target.files].slice(0, Math.max(0, 6 - gallery.length));
    if (!files.length) return showToast("O carrossel aceita até 6 imagens");
    if (event.target.files.length > files.length) showToast("Foram adicionadas somente as imagens que cabem no limite de 6");
    files.forEach((file) => readImage(file, (source) => { gallery.push(source); renderEditor(); markDirty(); }));
    event.target.value = "";
  });
  $("#clear-hero-gallery").addEventListener("click", () => { const current = segment(); if (!current || !["hero", "internalHero", "serviceHero"].includes(current.type)) return; current.style.backgroundImages = []; renderEditor(); markDirty(); });
  $("#merge-previous").addEventListener("change", (event) => { const current = segment(); if (!current) return; current.mergeWithPrevious = event.target.checked; renderMergeControls(); markDirty(); });
  $("#reset-size").addEventListener("click", () => { const target = resizeTarget(); if (!target?.size && !target?.position) return; delete target.size; delete target.position; renderResizeControls(); markDirty(); });
  $("#delete-segment").addEventListener("click", () => { if (!confirm("Remover definitivamente esta seção do site e todos os seus itens? O portal ficará menor após salvar.")) return; page().segments = page().segments.filter((entry) => entry.id !== selectedSegmentId); selectedSegmentId = page().segments[0]?.id; selectedItemId = null; renderEditor(); markDirty(); });
  $("#add-item").addEventListener("click", () => { const entry = defaultItem($("#new-item-type").value); segment().items.push(entry); selectedItemId = entry.id; renderEditor(); markDirty(); });
  $$(".devices button").forEach((button) => button.addEventListener("click", () => { $$(".devices button").forEach((entry) => entry.classList.toggle("active", entry === button)); activeDevice = button.dataset.device; previewDocumentHeight = deviceViewports[activeDevice].height; renderPreview(); requestAnimationFrame(fitPreview); }));
  $("#preview-zoom").addEventListener("change", (event) => { previewZoomMode = event.target.value; fitPreview(); });
  $("#save").addEventListener("click", save);
  $("#validate").addEventListener("click", async () => showValidation(await communication.validate(content)));
  $("#export").addEventListener("click", async () => {
    if (project?.portalType === "react") {
      if (dirty) return void (await save());
      const result = await communication.buildPortal();
      if (!result.ok) return showMessage("Não foi possível compilar o portal", result.errors || ["Revise o projeto React e tente novamente."]);
      return showToast("Portal React compilado");
    }
    if (dirty && !(await save())) return;
    const result = await communication.exportSite(content);
    if (result.canceled) return;
    if (!result.ok) return showMessage("Não foi possível gerar a versão", result.errors || ["Escolha outra pasta."]);
    showToast("Portal estático gerado");
  });
  $("#close-dialog").addEventListener("click", () => $("#validation-dialog").close());
  window.addEventListener("message", handlePreviewResize);
  $("#preview").addEventListener("load", () => { fitPreview(); postReactPreviewSelection(); });
  new ResizeObserver(fitPreview).observe($(".preview-stage"));
  window.addEventListener("focus", async () => {
    if (project?.kind !== "portal") return;
    const result = await communication.checkPortalChanges();
    if (result.ok && result.changed) { $(".save-state").className = "save-state error"; $("#save-state").textContent = "Mudanças externas detectadas — clique em Recarregar"; }
  });
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
}

async function init() {
  const initial = await communication.load();
  content = initial.content; project = initial.project; previewAssets = initial.previewAssets; previewRuntime = initial.previewRuntime || null;
  selectedPageId = content.pages[0]?.id; selectedSegmentId = content.pages[0]?.segments[0]?.id;
  bindStaticEvents(); renderProjectInfo(); renderEditor(); renderPreview(); requestAnimationFrame(fitPreview);
}

init();
