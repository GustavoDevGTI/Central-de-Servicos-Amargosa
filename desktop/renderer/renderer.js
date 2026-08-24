let content;
let selectedServiceId = null;
let dirty = false;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function getPath(object, path) { return path.split(".").reduce((value, key) => value?.[key], object); }
function setPath(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((value, key) => value[key], object);
  target[last] = value;
}

function previewHtml() {
  const identity = content.identity;
  const audienceCards = content.audiences.map((item) => `<article class="audience"><i>${escapeHtml(item.initials)}</i><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small><b>Ver serviços →</b></article>`).join("");
  const featured = content.services.filter((service) => service.featured).map((service, index) => `<article class="card"><span class="rank">${String(index + 1).padStart(2, "0")}</span><i>${escapeHtml(service.initials)}</i><span><small>${escapeHtml(service.category)}</small><strong>${escapeHtml(service.title)}</strong><em>${escapeHtml(service.department)}</em></span><b>↗</b></article>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#193a31;font-family:Arial,sans-serif}header{height:70px;display:flex;align-items:center;padding:0 5%;border-top:3px solid ${identity.accentColor};border-bottom:1px solid #dae5e0;background:#fff}.brand{display:flex;align-items:center;gap:9px}.mark{width:36px;height:36px;display:grid;place-items:center;border-radius:4px 12px 4px 12px;background:${identity.primaryColor};color:#fff;font-size:10px;font-weight:900}.brand span{display:flex;flex-direction:column}.brand small{color:#68756f;font-size:6px;text-transform:uppercase}.brand strong{font-family:Georgia,serif;font-size:14px}.brand em{color:${identity.primaryColor};font-size:6px;font-style:normal}.menu{display:flex;gap:18px;margin-left:auto;color:#43554e;font-size:7px;font-weight:800}.hero{display:flex;align-items:center;flex-direction:column;padding:49px 6% 54px;background:linear-gradient(115deg,#064b39,${identity.primaryColor});color:#fff;text-align:center}.eyebrow{color:#bfe5d8;font-size:6px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.hero h1{max-width:720px;margin:12px 0 12px;font-family:Georgia,serif;font-size:42px;line-height:1;letter-spacing:-.04em}.hero p{max-width:620px;margin:0;color:rgba(255,255,255,.74);font-size:9px;line-height:1.6}.search{width:min(720px,100%);display:flex;margin-top:23px;padding:6px 6px 6px 15px;border-radius:11px;background:#fff;box-shadow:0 12px 30px rgba(2,40,30,.25);color:#193a31;text-align:left}.search span{flex:1;padding:10px;color:#80908a;font-size:8px}.search b{padding:10px 18px;border-radius:7px;background:${identity.accentColor};color:#fff;font-size:7px}.publics{margin:-15px 4% 0;padding:22px;border:1px solid #dbe5e1;border-radius:13px;background:#fff;box-shadow:0 12px 28px rgba(5,75,55,.08)}.title small{color:${identity.accentColor};font-size:6px;font-weight:900;text-transform:uppercase}.title h2{margin:5px 0 0;font-family:Georgia,serif;font-size:22px}.audiences{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:17px}.audience{min-height:120px;display:flex;align-items:flex-start;flex-direction:column;padding:12px;border:1px solid #dbe5e1;border-radius:9px}.audience i{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#e6f3ee;color:${identity.primaryColor};font-size:6px;font-style:normal;font-weight:900}.audience strong{margin-top:10px;font-family:Georgia,serif;font-size:11px}.audience small{margin-top:5px;color:#74837d;font-size:6px;line-height:1.4}.audience b{margin-top:auto;padding-top:7px;color:${identity.primaryColor};font-size:6px}.services{padding:40px 5% 55px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:17px}.card{position:relative;min-height:82px;display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:9px;padding:12px;border:1px solid #dbe5e1;border-radius:9px;background:#fff}.card .rank{position:absolute;right:7px;top:4px;color:#e7eeeb;font-family:Georgia,serif;font-size:18px}.card i{width:34px;height:34px;display:grid;place-items:center;border-radius:8px;background:#e3f1eb;color:${identity.primaryColor};font-size:6px;font-style:normal;font-weight:900}.card>span:nth-child(3){display:flex;flex-direction:column}.card small{color:${identity.accentColor};font-size:5px;font-weight:900;text-transform:uppercase}.card strong{margin-top:4px;font-family:Georgia,serif;font-size:9px}.card em{margin-top:4px;color:#7b8983;font-size:6px;font-style:normal}.card>b{position:relative;color:${identity.primaryColor}}footer{padding:25px 6%;background:#04392d;color:#fff;font-size:7px}@media(max-width:560px){.menu{display:none}.hero h1{font-size:31px}.audiences{display:flex;overflow:hidden}.audience{min-width:150px}.grid{grid-template-columns:1fr}}
  </style></head><body><header><div class="brand"><div class="mark">AM</div><span><small>${escapeHtml(identity.brandLine)}</small><strong>${escapeHtml(identity.municipality)}</strong><em>Central de Serviços</em></span></div><nav class="menu">Serviços por público　Mais usados　Categorias　Ajuda</nav></header><section class="hero"><span class="eyebrow">${escapeHtml(content.hero.eyebrow)}</span><h1>${escapeHtml(content.hero.title)}</h1><p>${escapeHtml(content.hero.description)}</p><div class="search"><span>⌕　${escapeHtml(content.hero.searchPlaceholder)}</span><b>Buscar</b></div></section><section class="publics"><div class="title"><small>ESCOLHA O SEU PERFIL</small><h2>Serviços para cada público</h2></div><div class="audiences">${audienceCards}</div></section><section class="services"><div class="title"><small>ACESSO RÁPIDO</small><h2>Serviços mais usados</h2></div><div class="grid">${featured}</div></section><footer><strong>${escapeHtml(content.help.title)}</strong>　${escapeHtml(content.help.description)}</footer></body></html>`;
}

function renderPreview() { $("#preview").srcdoc = previewHtml(); }
function markDirty() { dirty = true; $(".save-state").className = "save-state dirty"; $("#save-state").textContent = "Alterações ainda não salvas"; renderPreview(); }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }

function fillGeneralFields() {
  $$('[name]').forEach((field) => { field.value = getPath(content, field.name) ?? ""; });
}

function renderAudienceEditor() {
  $("#audience-count").textContent = content.audiences.length;
  $("#audience-editor-list").innerHTML = content.audiences.map((item) => `<article class="audience-editor-card" data-audience-card="${escapeHtml(item.id)}"><header><i>${escapeHtml(item.initials)}</i><strong>${escapeHtml(item.label)}</strong></header><label>Nome do público<input data-audience-id="${escapeHtml(item.id)}" data-audience-field="label" value="${escapeHtml(item.label)}"></label><label>Descrição<textarea rows="2" data-audience-id="${escapeHtml(item.id)}" data-audience-field="description">${escapeHtml(item.description)}</textarea></label><label>Sigla<input maxlength="3" data-audience-id="${escapeHtml(item.id)}" data-audience-field="initials" value="${escapeHtml(item.initials)}"></label></article>`).join("");
  $$('[data-audience-field]').forEach((field) => field.addEventListener("input", () => {
    const item = content.audiences.find((audience) => audience.id === field.dataset.audienceId);
    if (!item) return;
    item[field.dataset.audienceField] = field.value;
    renderAudienceOptions();
    markDirty();
  }));
}

function renderAudienceOptions() {
  const select = $("#service-audience");
  const currentValue = select.value;
  select.innerHTML = content.audiences.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
  select.value = currentValue || content.audiences[0]?.id || "";
}

function renderServiceList() {
  $("#service-count").textContent = content.services.length;
  $("#service-list").innerHTML = content.services.map((service, index) => {
    const audienceLabel = content.audiences.find((item) => item.id === service.audience)?.label || "Sem público";
    return `<button type="button" data-id="${escapeHtml(service.id)}" class="${service.id === selectedServiceId ? "active" : ""}"><i>${escapeHtml(service.initials)}</i><span><strong>${service.featured ? `★ ${escapeHtml(service.title)}` : escapeHtml(service.title)}</strong><small>${String(index + 1).padStart(2, "0")} · ${escapeHtml(audienceLabel)} · ${escapeHtml(service.category)}</small></span><em>›</em></button>`;
  }).join("");
  $$("#service-list button").forEach((button) => button.addEventListener("click", () => selectService(button.dataset.id)));
}

function selectService(id) {
  selectedServiceId = id;
  const service = content.services.find((item) => item.id === id);
  renderServiceList();
  if (!service) { $("#service-editor").classList.add("hidden"); return; }
  renderAudienceOptions();
  $("#service-editor").classList.remove("hidden");
  $("#selected-service-title").textContent = service.title;
  $$('[data-service]').forEach((field) => { field[field.type === "checkbox" ? "checked" : "value"] = service[field.dataset.service] ?? false; });
}

function moveSelectedService(direction) {
  const index = content.services.findIndex((service) => service.id === selectedServiceId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= content.services.length) return;
  [content.services[index], content.services[target]] = [content.services[target], content.services[index]];
  renderServiceList();
  markDirty();
}

function changeSection(section) {
  $$(".section-nav button").forEach((button) => button.classList.toggle("active", button.dataset.section === section));
  $$(".form-section").forEach((form) => form.classList.toggle("active", form.dataset.form === section));
}

function showValidation(errors) {
  const success = errors.length === 0;
  $(".dialog-icon").textContent = success ? "✓" : "!";
  $("#dialog-title").textContent = success ? "Pronto para gerar" : "Revise estes pontos";
  $("#dialog-content").innerHTML = success ? "Todos os campos obrigatórios e endereços foram verificados." : `<ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`;
  $("#validation-dialog").showModal();
}

async function save() {
  const result = await window.centralAPI.save(content);
  if (!result.ok) { showValidation(result.errors); return false; }
  dirty = false;
  $(".save-state").className = "save-state";
  $("#save-state").textContent = "Todas as alterações foram salvas";
  showToast("Projeto salvo com uma cópia de segurança");
  return true;
}

async function init() {
  content = await window.centralAPI.load();
  fillGeneralFields();
  renderAudienceEditor();
  renderAudienceOptions();
  renderServiceList();
  renderPreview();
  $$('[name]').forEach((field) => field.addEventListener("input", () => { setPath(content, field.name, field.value); markDirty(); }));
  $$(".section-nav button").forEach((button) => button.addEventListener("click", () => changeSection(button.dataset.section)));
  $$(".devices button").forEach((button) => button.addEventListener("click", () => { $$(".devices button").forEach((item) => item.classList.toggle("active", item === button)); $("#preview").className = button.dataset.device === "desktop" ? "" : button.dataset.device; $("#viewport-label").textContent = button.dataset.device === "desktop" ? "1440 × 900 · 100%" : button.dataset.device === "tablet" ? "768 × 1024" : "390 × 844"; }));
  $$('[data-service]').forEach((field) => field.addEventListener("input", () => { const service = content.services.find((item) => item.id === selectedServiceId); if (!service) return; service[field.dataset.service] = field.type === "checkbox" ? field.checked : field.value; $("#selected-service-title").textContent = service.title; renderServiceList(); markDirty(); }));
  $("#add-service").addEventListener("click", () => { const id = `servico-${Date.now()}`; content.services.push({ id, title: "Novo serviço", department: "Órgão responsável", category: "Geral", audience: content.audiences[0]?.id || "cidadao", destination: "Canal oficial", url: content.identity.portalUrl, initials: "NS", featured: false }); renderServiceList(); selectService(id); markDirty(); });
  $("#move-service-up").addEventListener("click", () => moveSelectedService(-1));
  $("#move-service-down").addEventListener("click", () => moveSelectedService(1));
  $("#delete-service").addEventListener("click", () => { if (!selectedServiceId || !confirm("Excluir este serviço do projeto?")) return; content.services = content.services.filter((service) => service.id !== selectedServiceId); selectedServiceId = null; renderServiceList(); selectService(null); markDirty(); });
  $("#save").addEventListener("click", save);
  $("#validate").addEventListener("click", async () => showValidation(await window.centralAPI.validate(content)));
  $("#export").addEventListener("click", async () => { if (dirty && !(await save())) return; const result = await window.centralAPI.exportSite(content); if (result.canceled) return; if (!result.ok) return showValidation(result.errors); showToast("Portal estático gerado e pronto para publicar"); });
  $("#close-dialog").addEventListener("click", () => $("#validation-dialog").close());
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
}

init();
