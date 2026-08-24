let content;
let selectedPageId;
let selectedSegmentId;
let selectedItemId;
let dirty = false;
let editorMode = "content";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const segmentTypes = ["utility", "header", "hero", "audiences", "featured", "categories", "catalog", "help", "footer", "amanda", "generic"];
const itemTypes = ["text", "link", "image", "search", "audience", "category", "service", "serviceRef"];
const typeLabels = { utility: "Barra utilitária", header: "Cabeçalho", hero: "Busca principal", audiences: "Públicos", featured: "Mais usados", categories: "Categorias", catalog: "Catálogo", help: "Ajuda", footer: "Rodapé", amanda: "Amanda — assistente virtual", generic: "Livre", text: "Texto", link: "Link / botão", image: "Imagem / logo", search: "Campo de busca", audience: "Público", category: "Categoria", service: "Serviço", serviceRef: "Serviço em destaque" };

function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function page() { return content.pages.find((item) => item.id === selectedPageId) || content.pages[0]; }
function segment() { return page()?.segments.find((item) => item.id === selectedSegmentId); }
function item() { return segment()?.items.find((entry) => entry.id === selectedItemId); }
function catalogServices() { return content.pages.flatMap((entry) => entry.segments).filter((entry) => entry.type === "catalog").flatMap((entry) => entry.items).filter((entry) => entry.type === "service"); }
function audiences() { return content.pages.flatMap((entry) => entry.segments).filter((entry) => entry.type === "audiences").flatMap((entry) => entry.items).filter((entry) => entry.type === "audience"); }
function textByRole(entry, role, fallback = "") { return entry.items.find((item) => item.role === role)?.value || fallback; }

function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }
function markDirty() { dirty = true; $(".save-state").className = "save-state dirty"; $("#save-state").textContent = "Alterações ainda não salvas"; renderPreview(); }
function move(array, index, direction) { const target = index + direction; if (index < 0 || target < 0 || target >= array.length) return false; [array[index], array[target]] = [array[target], array[index]]; return true; }

function renderPages() {
  $("#page-select").innerHTML = content.pages.map((entry) => `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.name)}</option>`).join("");
  $("#page-select").value = page().id;
  $("#page-name").value = page().name;
  $("#page-slug").value = page().slug;
}

function renderSegments() {
  const current = page();
  $("#segment-nav").innerHTML = current.segments.map((entry, index) => `<button type="button" data-segment-id="${escapeHtml(entry.id)}" class="${entry.id === selectedSegmentId ? "active" : ""}"><b>${String(index + 1).padStart(2, "0")}</b><span>${escapeHtml(entry.name)}</span><em>${entry.enabled ? entry.items.length : "oculto"}</em></button>`).join("");
  $$('[data-segment-id]').forEach((button) => button.addEventListener("click", () => { selectedSegmentId = button.dataset.segmentId; selectedItemId = null; renderEditor(); }));
}

function renderEditor() {
  renderPages(); renderSegments();
  const current = segment();
  $("#segment-empty").classList.toggle("hidden", Boolean(current));
  $("#segment-editor").classList.toggle("hidden", !current);
  if (!current) return;
  $("#segment-heading").textContent = current.name;
  $("#segment-name").value = current.name;
  $("#segment-type").innerHTML = segmentTypes.map((value) => `<option value="${value}">${typeLabels[value]}</option>`).join("");
  $("#segment-type").value = current.type;
  $("#segment-enabled").checked = current.enabled;
  const style = current.style ||= {};
  $("#style-background").value = style.background || "#ffffff";
  $("#style-color").value = style.color || "#193a31";
  $("#style-accent").value = style.accent || content.site.primaryColor || "#0b6b50";
  $("#style-width").value = style.width || "contained";
  $("#style-spacing").value = style.spacing || "comfortable";
  $("#style-radius").value = style.radius || "soft";
  $$('[data-variant]').forEach((button) => button.classList.toggle("active", button.dataset.variant === (style.variant || "institutional")));
  $("#background-status").textContent = style.backgroundImage ? "Imagem incorporada ao projeto" : "Nenhuma imagem";
  $("#new-item-type").innerHTML = itemTypes.map((value) => `<option value="${value}">${typeLabels[value]}</option>`).join("");
  renderItems();
}

function renderItems() {
  const current = segment(); if (!current) return;
  $("#item-list").innerHTML = current.items.map((entry, index) => `<button type="button" data-item-id="${escapeHtml(entry.id)}" class="${entry.id === selectedItemId ? "active" : ""}"><i>${String(index + 1).padStart(2, "0")}</i><span><strong>${escapeHtml(entry.label || entry.title || entry.text || entry.value || typeLabels[entry.type])}</strong><small>${escapeHtml(typeLabels[entry.type] || entry.type)} · ${escapeHtml(entry.role || "sem função")}</small></span><em>›</em></button>`).join("");
  $$('[data-item-id]').forEach((button) => button.addEventListener("click", () => { selectedItemId = button.dataset.itemId; renderItems(); }));
  renderItemEditor();
}

function inputField(label, field, value, multiline = false) { return `<label>${label}${multiline ? `<textarea rows="3" data-item-field="${field}">${escapeHtml(value || "")}</textarea>` : `<input data-item-field="${field}" value="${escapeHtml(value || "")}">`}</label>`; }
function selectField(label, field, value, options) { return `<label>${label}<select data-item-field="${field}">${options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></label>`; }

function renderItemEditor() {
  const current = item();
  $("#item-editor").classList.toggle("hidden", !current);
  if (!current) { $("#item-editor").innerHTML = ""; return; }
  let fields = inputField("Nome interno", "label", current.label);
  fields += inputField("Função no segmento", "role", current.role);
  if (current.type === "text") fields += inputField("Texto", "value", current.value, true);
  if (current.type === "link") fields += inputField("Texto visível", "text", current.text) + inputField("Endereço ou âncora", "url", current.url);
  if (current.type === "image") fields += inputField("Texto alternativo", "alt", current.alt) + `<div class="image-field"><label>Escolher imagem<input id="item-image-upload" type="file" accept="image/*"></label><button id="remove-item-image" type="button">Remover imagem</button><small>${current.src ? "Imagem incorporada" : "Nenhuma imagem"}</small></div>`;
  if (current.type === "search") fields += inputField("Texto de exemplo", "placeholder", current.placeholder) + inputField("Texto do botão", "buttonText", current.buttonText);
  if (["audience", "category"].includes(current.type)) fields += inputField("Nome visível", "label", current.label) + inputField("Descrição", "description", current.description, true) + inputField("Sigla", "initials", current.initials);
  if (current.type === "service") fields += inputField("Nome do serviço", "title", current.title) + inputField("Órgão responsável", "department", current.department) + inputField("Categoria", "category", current.category) + selectField("Público", "audienceId", current.audienceId, audiences().map((entry) => ({ value: entry.id, label: entry.label }))) + inputField("Canal responsável", "destination", current.destination) + inputField("Endereço oficial", "url", current.url) + inputField("Sigla", "initials", current.initials);
  if (current.type === "serviceRef") fields += selectField("Serviço do catálogo", "serviceId", current.serviceId, catalogServices().map((entry) => ({ value: entry.id, label: entry.title })));
  $("#item-editor").innerHTML = `<header><div><small>ITEM SELECIONADO</small><strong>${escapeHtml(typeLabels[current.type] || current.type)}</strong></div><div class="mini-actions"><button id="item-up">↑</button><button id="item-down">↓</button><button id="delete-item" class="danger">Excluir</button></div></header>${fields}`;
  $$('[data-item-field]').forEach((field) => field.addEventListener("input", () => { const currentItem = item(); if (!currentItem) return; currentItem[field.dataset.itemField] = field.value; renderSegments(); renderPreview(); dirty = true; $(".save-state").className = "save-state dirty"; $("#save-state").textContent = "Alterações ainda não salvas"; }));
  $("#item-up").addEventListener("click", () => { const items = segment().items; if (move(items, items.findIndex((entry) => entry.id === selectedItemId), -1)) { renderItems(); markDirty(); } });
  $("#item-down").addEventListener("click", () => { const items = segment().items; if (move(items, items.findIndex((entry) => entry.id === selectedItemId), 1)) { renderItems(); markDirty(); } });
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
  if (type === "audience") return { ...base, label: "Novo público", description: "Descrição do público", initials: "NP" };
  if (type === "category") return { ...base, label: "Nova categoria", description: "Descrição da categoria", initials: "NC" };
  if (type === "service") return { ...base, title: "Novo serviço", department: "Órgão responsável", category: "Geral", audienceId: audiences()[0]?.id || "", destination: "Canal oficial", url: "https://amargosa.ba.gov.br/", initials: "NS" };
  return { ...base, label: "Serviço em destaque", serviceId: catalogServices()[0]?.id || "" };
}

function readImage(file, done) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return showToast("Escolha um arquivo de imagem");
  if (file.size > 2 * 1024 * 1024) return showToast("A imagem deve ter no máximo 2 MB");
  const reader = new FileReader(); reader.onload = () => done(reader.result); reader.readAsDataURL(file);
}

function previewHtml() {
  const selectedPage = page();
  const previewContent = { ...content, pages: [selectedPage, ...content.pages.filter((entry) => entry.id !== selectedPage.id)] };
  const serialized = JSON.stringify(previewContent).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../templates/styles.css"><link rel="stylesheet" href="../templates/dynamic.css"><script>window.CENTRAL_CONTENT=${serialized};</script><script defer src="../templates/app.js"></script></head><body><a class="skip" href="#conteudo">Ir para o conteúdo</a><main id="conteudo"></main></body></html>`;
  /* O código abaixo é mantido temporariamente apenas como fallback para instalações antigas. */
  const current = page();
  const services = current.segments.find((entry) => entry.type === "catalog")?.items.filter((entry) => entry.type === "service") || [];
  const render = (entry) => {
    if (!entry.enabled) return "";
    const style = entry.style || {}; const radius = style.radius === "round" ? "16px" : style.radius === "square" ? "0" : "6px"; const padding = style.spacing === "compact" ? "30px" : style.spacing === "airy" ? "64px" : "48px"; const css = `--bg:${style.background || "#fff"};--color:${style.color || "#193a31"};--accent:${style.accent || "#0b6b50"};--radius:${radius};--pad:${padding};${style.backgroundImage ? `background-image:linear-gradient(#063d32bb,#063d32bb),url('${style.backgroundImage}')` : ""}`;
    const links = entry.items.filter((item) => item.type === "link").map((item) => `<a>${escapeHtml(item.text)}</a>`).join("");
    const logo = entry.items.find((item) => item.type === "image" && item.role === "logo");
    if (entry.type === "utility") return `<section class="utility" style="${css}"><span>${escapeHtml(textByRole(entry, "label"))}</span><nav>${links}</nav></section>`;
    if (entry.type === "header") return `<section class="header" style="${css}"><div class="brand">${logo?.src ? `<img src="${logo.src}">` : "<b>AM</b>"}<span><small>${escapeHtml(textByRole(entry, "brandLine"))}</small><strong>${escapeHtml(textByRole(entry, "municipality"))}</strong><em>${escapeHtml(textByRole(entry, "subtitle"))}</em></span></div><nav>${links}</nav></section>`;
    if (entry.type === "hero") { const search = entry.items.find((item) => item.type === "search"); return `<section class="hero" style="${css}"><small>${escapeHtml(textByRole(entry, "eyebrow"))}</small><h1>${escapeHtml(textByRole(entry, "title"))}</h1><p>${escapeHtml(textByRole(entry, "description"))}</p><div class="search">⌕ <span>${escapeHtml(search?.placeholder)}</span><b>${escapeHtml(search?.buttonText)}</b></div></section>`; }
    if (entry.type === "audiences") return `<section class="block float" style="${css}">${previewHeading(entry)}<div class="cards audiences">${entry.items.filter((item) => item.type === "audience").map((item) => `<article><i>${escapeHtml(item.initials)}</i><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></article>`).join("")}</div></section>`;
    if (entry.type === "featured") return `<section class="block" style="${css}">${previewHeading(entry)}<div class="cards services">${entry.items.filter((item) => item.type === "serviceRef").map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean).map((service) => `<article><i>${escapeHtml(service.initials)}</i><strong>${escapeHtml(service.title)}</strong><small>${escapeHtml(service.department)}</small></article>`).join("")}</div></section>`;
    if (entry.type === "categories") return `<section class="block" style="${css}">${previewHeading(entry)}<div class="cards categories">${entry.items.filter((item) => item.type === "category").map((item) => `<article><i>${escapeHtml(item.initials)}</i><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></article>`).join("")}</div></section>`;
    if (entry.type === "catalog") return `<section class="block" style="${css}">${previewHeading(entry)}<div class="list">${services.map((service) => `<article><i>${escapeHtml(service.initials)}</i><span><strong>${escapeHtml(service.title)}</strong><small>${escapeHtml(service.department)}</small></span><b>↗</b></article>`).join("")}</div></section>`;
    if (entry.type === "help") return `<section class="help" style="${css}">${previewHeading(entry)}${links}</section>`;
    if (entry.type === "footer") return `<section class="footer" style="${css}"><strong>${escapeHtml(textByRole(entry, "title"))}</strong><p>${escapeHtml(textByRole(entry, "description"))}</p>${links}</section>`;
    if (entry.type === "amanda") return `<aside class="amanda-demo" style="${css}"><div class="amanda-demo-head"><b>A</b><span><small>${escapeHtml(textByRole(entry, "eyebrow"))}</small><strong>${escapeHtml(textByRole(entry, "title"))}</strong></span><em>✦</em></div><p>${escapeHtml(textByRole(entry, "description"))}</p><div>${entry.items.filter((item) => item.role === "prompt").map((item) => `<span>${escapeHtml(item.value)}　↗</span>`).join("")}</div></aside>`;
    return `<section class="block" style="${css}">${previewHeading(entry)}${entry.items.map((item) => item.type === "image" && item.src ? `<img src="${item.src}">` : item.type === "link" ? `<a>${escapeHtml(item.text)}</a>` : `<p>${escapeHtml(item.value || item.label)}</p>`).join("")}</section>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#193a31;font-family:Arial,sans-serif}section{background:var(--bg);color:var(--color)}nav{display:flex;gap:18px;margin-left:auto}a{font-size:10px;font-weight:800}.utility,.header{display:flex;align-items:center;padding:10px 5%;border-bottom:1px solid #d8e3df}.utility{font-size:8px}.header{padding-block:18px}.brand{display:flex;align-items:center;gap:10px}.brand>b,.cards i,.list i{display:grid;place-items:center;background:var(--accent);color:white;border-radius:var(--radius);font-style:normal;font-weight:900}.brand>b{width:38px;height:38px}.brand img{max-width:150px;max-height:48px}.brand span{display:flex;flex-direction:column}.brand small,.brand em{font-size:7px}.brand strong{font-family:Georgia;font-size:18px}.hero{padding:var(--pad) 8%;background-position:center;background-size:cover;text-align:center}.hero h1{max-width:760px;margin:12px auto;font-family:Georgia;font-size:50px}.hero p{max-width:650px;margin:auto;opacity:.75}.search{max-width:800px;display:flex;align-items:center;gap:12px;margin:28px auto 0;padding:8px 8px 8px 18px;border-radius:var(--radius);background:white;color:#193a31}.search span{flex:1;text-align:left}.search b{padding:16px 22px;border-radius:var(--radius);background:var(--accent);color:white}.block{padding:var(--pad) 6%}.float{margin:0 4%;border-radius:var(--radius)}.heading small{color:var(--accent);font-weight:900}.heading h2{margin:7px 0;font-family:Georgia;font-size:28px}.heading p{opacity:.7}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:22px}.audiences{grid-template-columns:repeat(5,1fr)}.cards article,.list article{display:flex;gap:10px;padding:16px;border:1px solid #d8e3df;border-radius:var(--radius);background:white;color:#193a31}.cards article{min-height:110px;align-items:flex-start;flex-direction:column}.cards i,.list i{width:36px;height:36px}.cards small,.list small{color:#718079}.list{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:22px}.list article{align-items:center}.list span{display:flex;flex:1;flex-direction:column}.help,.footer{padding:var(--pad) 6%}.footer{background:var(--bg)}.amanda-demo{position:fixed;z-index:5;right:22px;bottom:22px;width:300px;padding:16px;border:1px solid #cadaD4;border-radius:var(--radius);background:var(--bg);color:var(--color);box-shadow:0 18px 50px #053e302f}.amanda-demo-head{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:9px}.amanda-demo-head>b{width:38px;height:38px;display:grid;place-items:center;border-radius:var(--radius);background:var(--accent);color:#fff;font-family:Georgia}.amanda-demo-head span{display:flex;flex-direction:column}.amanda-demo-head small{font-size:6px;text-transform:uppercase}.amanda-demo-head strong{margin-top:3px;font-family:Georgia}.amanda-demo-head em{color:var(--accent)}.amanda-demo>p{font-family:Georgia;font-size:16px;line-height:1.3}.amanda-demo>div:last-child{display:flex;flex-direction:column}.amanda-demo>div:last-child span{padding:8px 0;border-top:1px solid #dce6e2;font-size:8px}@media(max-width:650px){.header nav{display:none}.hero h1{font-size:36px}.audiences,.cards,.list{grid-template-columns:1fr 1fr}.amanda-demo{right:10px;bottom:10px;width:230px}}</style></head><body>${current.segments.map(render).join("")}</body></html>`;
}
function previewHeading(entry) { return `<div class="heading"><small>${escapeHtml(textByRole(entry, "eyebrow"))}</small><h2>${escapeHtml(textByRole(entry, "title", entry.name))}</h2><p>${escapeHtml(textByRole(entry, "description"))}</p></div>`; }
function renderPreview() { $("#preview").srcdoc = previewHtml(); }

function showValidation(errors) { const success = errors.length === 0; $(".dialog-icon").textContent = success ? "✓" : "!"; $("#dialog-title").textContent = success ? "Pronto para gerar" : "Revise estes pontos"; $("#dialog-content").innerHTML = success ? "A estrutura de páginas, segmentos e itens foi validada." : `<ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`; $("#validation-dialog").showModal(); }
async function save() { const result = await window.centralAPI.save(content); if (!result.ok) { showValidation(result.errors); return false; } dirty = false; $(".save-state").className = "save-state"; $("#save-state").textContent = "Todas as alterações foram salvas"; showToast("Projeto salvo com cópia de segurança"); return true; }

function bindStaticEvents() {
  $$('[data-editor-mode]').forEach((button) => button.addEventListener("click", () => {
    editorMode = button.dataset.editorMode;
    $$('[data-editor-mode]').forEach((entry) => entry.classList.toggle("active", entry === button));
    $$('[data-editor-pane]').forEach((pane) => pane.classList.toggle("hidden", pane.dataset.editorPane !== editorMode));
    $("#segment-editor").scrollTop = 0;
  }));
  $("#page-select").addEventListener("change", (event) => { selectedPageId = event.target.value; selectedSegmentId = page().segments[0]?.id; selectedItemId = null; renderEditor(); renderPreview(); });
  $("#page-name").addEventListener("input", (event) => { page().name = event.target.value; $("#page-select").selectedOptions[0].textContent = event.target.value || "Página sem nome"; markDirty(); });
  $("#page-slug").addEventListener("input", (event) => { page().slug = event.target.value; markDirty(); });
  $("#add-page").addEventListener("click", () => { const id = uid("pagina"); content.pages.push({ id, name: "Nova página", slug: `/${id}`, segments: [] }); selectedPageId = id; selectedSegmentId = null; selectedItemId = null; renderEditor(); markDirty(); });
  $("#add-segment").addEventListener("click", () => { const entry = { id: uid("segmento"), name: "Novo segmento", type: "generic", enabled: true, style: { background: "#ffffff", color: "#193a31", accent: content.site.primaryColor, width: "contained", spacing: "comfortable", radius: "soft", variant: "institutional", backgroundImage: "" }, items: [] }; page().segments.push(entry); selectedSegmentId = entry.id; selectedItemId = null; renderEditor(); markDirty(); });
  $("#segment-name").addEventListener("input", (event) => { segment().name = event.target.value; $("#segment-heading").textContent = event.target.value; renderSegments(); markDirty(); });
  $("#segment-type").addEventListener("change", (event) => { segment().type = event.target.value; renderSegments(); markDirty(); });
  $("#segment-enabled").addEventListener("change", (event) => { segment().enabled = event.target.checked; renderSegments(); markDirty(); });
  [["style-background", "background"], ["style-color", "color"], ["style-accent", "accent"], ["style-width", "width"], ["style-spacing", "spacing"], ["style-radius", "radius"]].forEach(([id, field]) => $("#" + id).addEventListener("input", (event) => { segment().style[field] = event.target.value; markDirty(); }));
  $$('[data-variant]').forEach((button) => button.addEventListener("click", () => {
    const style = segment().style;
    style.variant = button.dataset.variant;
    if (style.variant === "institutional") { style.radius = "soft"; style.spacing = "comfortable"; }
    if (style.variant === "editorial") { style.radius = "square"; style.spacing = "airy"; }
    if (style.variant === "compact") { style.radius = "square"; style.spacing = "compact"; }
    if (style.variant === "soft") { style.radius = "round"; style.spacing = "comfortable"; }
    renderEditor(); markDirty();
  }));
  $("#background-upload").addEventListener("change", (event) => readImage(event.target.files[0], (source) => { segment().style.backgroundImage = source; renderEditor(); markDirty(); }));
  $("#remove-background").addEventListener("click", () => { segment().style.backgroundImage = ""; renderEditor(); markDirty(); });
  $("#segment-up").addEventListener("click", () => { const segments = page().segments; if (move(segments, segments.findIndex((entry) => entry.id === selectedSegmentId), -1)) { renderEditor(); markDirty(); } });
  $("#segment-down").addEventListener("click", () => { const segments = page().segments; if (move(segments, segments.findIndex((entry) => entry.id === selectedSegmentId), 1)) { renderEditor(); markDirty(); } });
  $("#delete-segment").addEventListener("click", () => { if (!confirm("Excluir este segmento e todos os seus itens?")) return; page().segments = page().segments.filter((entry) => entry.id !== selectedSegmentId); selectedSegmentId = page().segments[0]?.id; selectedItemId = null; renderEditor(); markDirty(); });
  $("#add-item").addEventListener("click", () => { const entry = defaultItem($("#new-item-type").value); segment().items.push(entry); selectedItemId = entry.id; renderEditor(); markDirty(); });
  $$(".devices button").forEach((button) => button.addEventListener("click", () => { $$(".devices button").forEach((entry) => entry.classList.toggle("active", entry === button)); $("#preview").className = button.dataset.device === "desktop" ? "" : button.dataset.device; $("#viewport-label").textContent = button.dataset.device === "desktop" ? "1440 × 900 · 100%" : button.dataset.device === "tablet" ? "768 × 1024" : "390 × 844"; }));
  $("#save").addEventListener("click", save); $("#validate").addEventListener("click", async () => showValidation(await window.centralAPI.validate(content)));
  $("#export").addEventListener("click", async () => { if (dirty && !(await save())) return; const result = await window.centralAPI.exportSite(content); if (result.canceled) return; if (!result.ok) return showValidation(result.errors); showToast("Portal estático gerado"); });
  $("#close-dialog").addEventListener("click", () => $("#validation-dialog").close());
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
}

async function init() { content = await window.centralAPI.load(); selectedPageId = content.pages[0]?.id; selectedSegmentId = content.pages[0]?.segments[0]?.id; bindStaticEvents(); renderEditor(); renderPreview(); }
init();
