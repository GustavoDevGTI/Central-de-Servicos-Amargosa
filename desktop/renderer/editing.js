function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }
function setDirtyState() { dirty = true; $(".save-state").className = "save-state dirty"; $("#save-state").textContent = "Alterações ainda não salvas"; }
function markDirty() { setDirtyState(); renderPreview(); }

function renderProjectInfo() {
  const openedPortal = project?.kind === "portal";
  const reactPortal = openedPortal && project.portalType === "react";
  const label = openedPortal ? `${project.name} · ${project.version}` : "Projeto interno";
  $("#project-source").textContent = label;
  $("#project-source").title = project?.directory || label;
  $("#reload-portal").hidden = !openedPortal;
  $("#save").textContent = reactPortal ? "Salvar alterações" : openedPortal ? "Atualizar portal aberto" : "Salvar alterações";
  $("#export").textContent = reactPortal ? "Compilar portal" : openedPortal ? "Gerar nova versão" : "Gerar portal estático";
  const brandImage = content?.pages?.find((entry) => entry.id === "home")?.segments?.find((entry) => entry.type === "header")?.items?.find((item) => item.type === "image" && item.role === "logo")?.src;
  const editorBrand = $("#editor-brand-image");
  if (editorBrand) { editorBrand.src = brandImage || ""; editorBrand.hidden = !brandImage; }
}

function applyProjectPayload(payload, message) {
  content = payload.content;
  project = payload.project;
  previewAssets = payload.previewAssets;
  previewRuntime = payload.previewRuntime || null;
  selectedPageId = content.pages[0]?.id;
  selectedSegmentId = content.pages[0]?.segments[0]?.id;
  selectedItemId = null;
  dirty = false;
  $(".save-state").className = "save-state";
  $("#save-state").textContent = message;
  renderProjectInfo();
  renderEditor();
  renderPreview();
}

function renderPages() {
  $("#page-select").innerHTML = content.pages.map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.name)}</option>`).join("");
  $("#page-select").value = page().id;
  $("#page-name").value = page().name;
  $("#page-slug").value = page().slug;
}

function renderSegments() {
  const current = page();
  const siteButton = `<button type="button" data-site-complete class="site-complete ${selectedSegmentId === SITE_SELECTION_ID ? "active" : ""}"><b>∞</b><span>Site completo</span></button>`;
  $("#segment-nav").innerHTML = siteButton + current.segments.map((entry, index) => `<button type="button" data-segment-id="${escapeHtml(entry.id)}" class="${entry.id === selectedSegmentId ? "active" : ""} ${entry.enabled ? "" : "is-hidden"}"><b>${String(index + 1).padStart(2, "0")}</b><span>${escapeHtml(entry.name)}</span></button>`).join("");
  $("[data-site-complete]").addEventListener("click", () => { selectedSegmentId = SITE_SELECTION_ID; selectedItemId = null; selectEditorMode("design"); renderEditor(); renderPreview(); });
  $$('[data-segment-id]').forEach((button) => button.addEventListener("click", () => { selectedSegmentId = button.dataset.segmentId; selectedItemId = null; renderEditor(); renderPreview(); }));
}

function renderEditor() {
  renderPages(); renderSegments();
  const siteSelected = selectedSegmentId === SITE_SELECTION_ID;
  const current = segment();
  $("#site-editor").classList.toggle("hidden", !siteSelected);
  $("#segment-empty").classList.toggle("hidden", Boolean(current) || siteSelected);
  $("#segment-editor").classList.toggle("hidden", !current);
  if (siteSelected) { renderSiteEditor(); return; }
  if (!current) return;
  $("#segment-heading").textContent = current.name;
  $("#segment-name").value = current.name;
  $("#segment-type").innerHTML = segmentTypes.map((value) => `<option value="${value}">${typeLabels[value]}</option>`).join("");
  $("#segment-type").value = current.type;
  $("#segment-type-label").textContent = typeLabels[current.type] || current.type;
  $("#segment-enabled").checked = current.enabled;
  const style = current.style ||= {};
  $("#style-background").value = style.background || "#ffffff";
  $("#style-color").value = style.color || "#193a31";
  $("#style-accent").value = style.accent || content.site.primaryColor || "#0b6b50";
  $("#style-width").value = style.width || "contained";
  $("#style-spacing").value = style.spacing || "comfortable";
  $("#style-radius").value = style.radius || "soft";
  $("#style-heading-font").value = style.headingFont || "lora";
  $("#style-body-font").value = style.bodyFont || "source";
  $("#style-font-size").value = style.fontSize || "normal";
  $("#style-hover-effect").value = style.hoverEffect || content.site?.design?.hoverEffect || "none";
  $("#style-click-effect").value = style.clickEffect || content.site?.design?.clickEffect || "none";
  renderVariantPicker(current);
  renderHeroGallery(current, style);
  $("#background-label").textContent = ["hero", "internalHero", "serviceHero"].includes(current.type) ? "Imagem principal do segmento" : "Imagem de fundo";
  $("#background-status").textContent = style.backgroundImage ? "Imagem incorporada ao projeto" : "Nenhuma imagem";
  $("#new-item-type").innerHTML = itemTypes.map((value) => `<option value="${value}">${typeLabels[value]}</option>`).join("");
  renderItems(); renderMergeControls(); renderResizeControls();
}

function ensureSiteDesign() {
  const site = content.site ||= {};
  const design = site.design ||= { theme: "institutional", palette: "amargosa", headingFont: "lora", bodyFont: "source", fontSize: "large" };
  return design;
}

function renderSiteEditor() {
  const design = ensureSiteDesign();
  $("#site-theme-picker").innerHTML = Object.entries(siteThemePresets).map(([value, preset]) => `<button type="button" data-site-theme="${value}" class="${design.theme === value ? "active" : ""}"><i><span></span><span></span><span></span></i><strong>${escapeHtml(preset.label)}</strong><small>${escapeHtml(preset.description)}</small></button>`).join("");
  $$('[data-site-theme]').forEach((button) => button.addEventListener("click", () => applySiteTheme(button.dataset.siteTheme)));
  $("#site-palette-picker").innerHTML = Object.entries(sitePalettePresets).map(([value, palette]) => `<button type="button" data-site-palette="${value}" class="${design.palette === value ? "active" : ""}"><span class="site-palette-swatches">${[palette.primary, palette.accent, palette.deep, palette.soft, palette.surface].map((color) => `<i style="background:${color}"></i>`).join("")}</span><strong>${escapeHtml(palette.label)}</strong></button>`).join("");
  $$('[data-site-palette]').forEach((button) => button.addEventListener("click", () => applySitePalette(button.dataset.sitePalette)));
  $("#site-heading-font").value = design.headingFont || "lora";
  $("#site-body-font").value = design.bodyFont || "source";
  $("#site-font-size").value = design.fontSize || "large";
}

function allSegments() { return content.pages.flatMap((entry) => entry.segments || []); }

function applySiteTheme(value) {
  const preset = siteThemePresets[value]; if (!preset) return;
  ensureSiteDesign().theme = value;
  for (const entry of allSegments()) Object.assign(entry.style ||= {}, { variant: preset.variant, width: preset.width, spacing: preset.spacing, radius: preset.radius });
  renderEditor(); markDirty();
}

function paletteForSegment(type, palette) {
  if (["hero", "internalHero", "serviceHero", "help"].includes(type)) return { background: palette.primary, color: "#ffffff", accent: palette.accent };
  if (type === "footer") return { background: palette.deep, color: "#ffffff", accent: palette.accent };
  if (["categories", "internalCatalog", "serviceContent"].includes(type)) return { background: palette.soft, color: palette.ink, accent: palette.primary };
  if (type === "utility") return { background: palette.surface, color: palette.muted, accent: palette.accent };
  return { background: palette.surface, color: palette.ink, accent: palette.primary };
}

function applySitePalette(value) {
  const palette = sitePalettePresets[value]; if (!palette) return;
  const design = ensureSiteDesign(); design.palette = value;
  Object.assign(content.site, { primaryColor: palette.primary, accentColor: palette.accent, deepColor: palette.deep, surfaceColor: palette.surface, softColor: palette.soft, textColor: palette.ink, mutedColor: palette.muted });
  for (const entry of allSegments()) Object.assign(entry.style ||= {}, paletteForSegment(entry.type, palette));
  renderEditor(); markDirty();
}

function applySiteTypography(field, value) {
  const design = ensureSiteDesign(); design[field] = value;
  for (const entry of allSegments()) {
    const style = entry.style ||= {};
    if (field === "headingFont") style.headingFont = value;
    if (field === "bodyFont") style.bodyFont = value;
    if (field === "fontSize") style.fontSize = value;
  }
  renderSiteEditor(); markDirty();
}

function renderHeroGallery(current, style) {
  const controls = $("#hero-gallery-controls"); if (!controls) return;
  const isHero = ["hero", "internalHero", "serviceHero"].includes(current.type);
  controls.hidden = !isHero;
  if (!isHero) return;
  const images = Array.isArray(style.backgroundImages) ? style.backgroundImages : [];
  $("#hero-gallery-status").textContent = images.length ? `${images.length} imagem${images.length === 1 ? "" : "s"} no carrossel` : "Adicione de 2 a 6 imagens. A primeira também aparece enquanto o carrossel carrega.";
  $("#hero-gallery-list").innerHTML = images.map((source, index) => `<article><img src="${source}" alt="Prévia ${index + 1}"><span>Imagem ${index + 1}</span><button type="button" data-remove-hero-image="${index}">Remover</button></article>`).join("");
  $$('[data-remove-hero-image]').forEach((button) => button.addEventListener("click", () => { const gallery = segment().style.backgroundImages || []; gallery.splice(Number(button.dataset.removeHeroImage), 1); renderEditor(); markDirty(); }));
}

function previousVisibleSegment(current = segment()) {
  const segments = page()?.segments || [];
  const index = segments.findIndex((entry) => entry.id === current?.id);
  return index > 0 ? [...segments.slice(0, index)].reverse().find((entry) => entry.enabled && entry.type !== "amanda") : null;
}

function renderMergeControls() {
  const current = segment(); const previous = previousVisibleSegment(current);
  const available = Boolean(current && previous && current.type !== "amanda");
  $("#merge-previous").checked = available && current.mergeWithPrevious === true;
  $("#merge-previous").disabled = !available;
  $("#merge-previous-label").textContent = previous ? previous.name : "Primeiro segmento da página";
}

function resizeTarget() { return item() || segment(); }
function renderResizeControls() {
  const target = resizeTarget(); if (!target || !$("#resize-target")) return;
  const targetIsItem = Boolean(item());
  $("#resize-target").textContent = targetIsItem ? (target.label || target.title || target.text || typeLabels[target.type] || "Item") : target.name;
  const size = target.size?.width && target.size?.height ? `${target.size.width} × ${target.size.height} px` : "tamanho automático";
  const position = target.position && (target.position.x || target.position.y) ? `posição ${Math.round(target.position.x || 0)}, ${Math.round(target.position.y || 0)}` : "posição original";
  $("#resize-value").textContent = `${size} · ${position}`;
  $("#reset-size").disabled = !target.size && !target.position;
}

function renderVariantPicker(current) {
  const names = segmentModels[current.type] || segmentModels.generic;
  const active = current.style?.variant || "institutional";
  $("#variant-heading").textContent = `Modelos de ${typeLabels[current.type].toLocaleLowerCase("pt-BR")}`;
  $("#variant-picker").dataset.segmentKind = current.type;
  $("#variant-picker").innerHTML = modelKeys.map((value, index) => `<button type="button" data-variant="${value}" class="${value === active ? "active" : ""}"><i class="variant-${value}"><span></span><span></span><span></span></i><strong>${escapeHtml(names[index])}</strong></button>`).join("");
  $$('[data-variant]').forEach((button) => button.addEventListener("click", () => applyVariant(button.dataset.variant)));
}

function variantDefaults(value) {
  if (value === "editorial") return { radius: "square", spacing: "airy" };
  if (value === "compact") return { radius: "square", spacing: "compact" };
  if (value === "contrast") return { radius: "square", spacing: "comfortable" };
  return { radius: "soft", spacing: "comfortable" };
}

function applyVariant(value) {
  const style = segment().style;
  Object.assign(style, { variant: value }, variantDefaults(value));
  renderEditor(); markDirty();
}

function renderItems() {
  const current = segment(); if (!current) return;
  $("#item-list").innerHTML = current.items.map((entry, index) => `<button type="button" data-item-id="${escapeHtml(entry.id)}" class="${entry.id === selectedItemId ? "active" : ""}"><i>${String(index + 1).padStart(2, "0")}</i><span><strong>${escapeHtml(entry.label || entry.title || entry.text || entry.value || typeLabels[entry.type])}</strong></span><em>›</em></button>`).join("");
  $$('[data-item-id]').forEach((button) => button.addEventListener("click", () => { selectedItemId = button.dataset.itemId; renderItems(); renderResizeControls(); renderPreview(); }));
  renderItemEditor();
}

function inputField(label, field, value, multiline = false) { return `<label>${label}${multiline ? `<textarea rows="3" data-item-field="${field}">${escapeHtml(value || "")}</textarea>` : `<input data-item-field="${field}" value="${escapeHtml(value || "")}">`}</label>`; }
function listField(label, field, values) { return `<label>${label}<textarea rows="4" data-list-field="${field}" placeholder="Um item por linha">${escapeHtml((values || []).join("\n"))}</textarea></label>`; }
function selectField(label, field, value, options) { return `<label>${label}<select data-item-field="${field}">${options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></label>`; }

function renderItemEditor() {
  const current = item();
  $("#item-editor").classList.toggle("hidden", !current);
  if (!current) { $("#item-editor").innerHTML = ""; return; }
  let fields = inputField("Nome interno", "label", current.label);
  if (current.type === "text") fields += inputField("Texto", "value", current.value, true);
  if (current.type === "link") fields += inputField("Texto visível", "text", current.text) + inputField("Endereço ou âncora", "url", current.url);
  if (current.type === "image") fields += inputField("Texto alternativo", "alt", current.alt) + `<div class="image-field"><label>Escolher imagem<input id="item-image-upload" type="file" accept="image/*"></label><button id="remove-item-image" type="button">Remover imagem</button><small>${current.src ? "Imagem incorporada" : "Nenhuma imagem"}</small></div>`;
  if (current.type === "search") fields += inputField("Texto de exemplo", "placeholder", current.placeholder) + inputField("Texto do botão", "buttonText", current.buttonText);
  if (["audience", "category"].includes(current.type)) fields += inputField("Nome visível", "label", current.label) + inputField("Descrição", "description", current.description, true);
  if (current.type === "service") fields += inputField("Nome do serviço", "title", current.title) + inputField("Endereço interno", "slug", current.slug || current.id) + inputField("Órgão responsável", "department", current.department) + inputField("Categoria", "category", current.category) + `<fieldset class="audience-checks"><legend>Públicos atendidos</legend>${audiences().map((entry) => `<label><input type="checkbox" data-service-audience="${escapeHtml(entry.id)}" ${(current.audienceIds?.length ? current.audienceIds : [current.audienceId]).includes(entry.id) ? "checked" : ""}><span>${escapeHtml(entry.label)}</span></label>`).join("")}</fieldset>` + inputField("Canal responsável", "destination", current.destination) + inputField("Endereço oficial", "url", current.url) + inputField("Sigla", "initials", current.initials) + inputField("Resumo explicativo", "summary", current.summary, true) + inputField("Quem pode solicitar", "eligibility", current.eligibility, true) + listField("Documentos necessários", "documents", current.documents) + listField("Etapas — como fazer", "steps", current.steps) + inputField("Custo", "cost", current.cost) + inputField("Prazo", "duration", current.duration) + inputField("Última atualização", "updatedAt", current.updatedAt);
  if (current.type === "serviceRef") fields += selectField("Serviço do catálogo", "serviceId", current.serviceId, catalogServices().map((entry) => ({ value: entry.id, label: entry.title })));
  $("#item-editor").innerHTML = `<header><div><strong>${escapeHtml(typeLabels[current.type] || current.type)}</strong></div><div class="mini-actions"><button id="delete-item" class="danger">Excluir</button></div></header>${fields}`;
  $$('[data-item-field]').forEach((field) => field.addEventListener("input", () => { const currentItem = item(); if (!currentItem) return; currentItem[field.dataset.itemField] = field.value; renderSegments(); renderPreview(); setDirtyState(); }));
  $$('[data-list-field]').forEach((field) => field.addEventListener("input", () => { const currentItem = item(); if (!currentItem) return; currentItem[field.dataset.listField] = field.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean); renderPreview(); setDirtyState(); }));
  $$('[data-service-audience]').forEach((field) => field.addEventListener("change", () => { const currentItem = item(); if (!currentItem) return; currentItem.audienceIds = $$('[data-service-audience]:checked').map((entry) => entry.dataset.serviceAudience); currentItem.audienceId = currentItem.audienceIds[0] || ""; renderPreview(); setDirtyState(); }));
  $("#delete-item").addEventListener("click", () => { if (!confirm("Excluir este item?")) return; segment().items = segment().items.filter((entry) => entry.id !== selectedItemId); selectedItemId = null; renderEditor(); markDirty(); });
  if (current.type === "image") {
    $("#item-image-upload").addEventListener("change", (event) => readImage(event.target.files[0], (source) => { item().src = source; renderItems(); markDirty(); }));
    $("#remove-item-image").addEventListener("click", () => { item().src = ""; renderItems(); markDirty(); });
  }
}

function defaultItem(type) {
  const base = { id: uid(type), type, role: "entry", label: typeLabels[type] };
  if (type === "text") return { ...base, role: "description", value: "Novo texto" };
  if (type === "link") return { ...base, role: "action", text: "Novo link", url: "#" };
  if (type === "image") return { ...base, role: "image", src: "", alt: "Descrição da imagem" };
  if (type === "search") return { ...base, role: "search", placeholder: "O que você procura?", buttonText: "Buscar" };
  if (type === "audience") return { ...base, label: "Novo público", description: "Descrição do público" };
  if (type === "category") return { ...base, label: "Nova categoria", description: "Descrição da categoria" };
  if (type === "service") return { ...base, title: "Novo serviço", department: "Órgão responsável", category: "Geral", audienceId: audiences()[0]?.id || "", destination: "Canal oficial", url: "https://amargosa.ba.gov.br/", initials: "NS" };
  return { ...base, label: "Serviço em destaque", serviceId: catalogServices()[0]?.id || "" };
}

function readImage(file, done) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return showToast("Escolha um arquivo de imagem");
  if (file.size > 2 * 1024 * 1024) return showToast("A imagem deve ter no máximo 2 MB");
  const reader = new FileReader(); reader.onload = () => done(reader.result); reader.readAsDataURL(file);
}

globalThis.CentralEditorEditing = { applySitePalette, applySiteTheme, applySiteTypography, defaultItem, ensureSiteDesign, paletteForSegment, previousVisibleSegment, variantDefaults };
if (typeof module !== "undefined" && module.exports) module.exports = { paletteForSegment, variantDefaults };
