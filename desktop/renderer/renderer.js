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
  const categories = ["Todos", ...new Set(content.services.map((service) => service.category).filter(Boolean))];
  const cards = content.services.map((service) => `<article class="card"><i>${escapeHtml(service.initials)}</i><span><small>${escapeHtml(service.category)}</small><strong>${escapeHtml(service.title)}</strong><em>${escapeHtml(service.department)}</em></span><b>↗</b></article>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#fbf8f3;color:#17352d;font-family:Arial,sans-serif}header{height:78px;display:flex;align-items:center;padding:0 5%;border-top:3px solid ${identity.accentColor};border-bottom:1px solid #dae5e0;background:#fff}.brand{display:flex;align-items:center;gap:9px}.mark{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:${identity.primaryColor};color:#fff;font-size:11px;font-weight:900}.brand span{display:flex;flex-direction:column}.brand small{color:#68756f;font-size:6px;text-transform:uppercase}.brand strong{font-size:15px}.brand em{color:${identity.primaryColor};font-size:6px;font-style:normal}.menu{display:flex;gap:18px;margin-left:auto;color:#43554e;font-size:8px;font-weight:800}.portal{margin-left:20px;padding:9px 12px;border-radius:7px;background:${identity.primaryColor};color:#fff;font-size:7px;font-weight:900}.hero{padding:55px 6%;background:linear-gradient(115deg,#f6fbf8 0 68%,#e0eee8 68%)}.eyebrow{color:${identity.accentColor};font-size:7px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.hero h1{max-width:680px;margin:12px 0 13px;font-family:Georgia,serif;font-size:46px;line-height:1;letter-spacing:-.04em}.hero p{max-width:600px;margin:0;color:#64736d;font-size:11px;line-height:1.6}.search{max-width:670px;display:flex;margin-top:25px;padding:6px 6px 6px 15px;border:1px solid #bdd3ca;border-radius:11px;background:#fff;box-shadow:0 12px 30px rgba(7,77,60,.1)}.search span{flex:1;padding:10px;color:#80908a;font-size:9px}.search b{padding:10px 18px;border-radius:7px;background:${identity.accentColor};color:#fff;font-size:8px}.services{padding:45px 6% 65px}.services h2{margin:7px 0 0;font-family:Georgia,serif;font-size:27px}.chips{display:flex;gap:5px;margin:23px 0 15px}.chips span{padding:7px 10px;border:1px solid #dbe5e1;border-radius:20px;background:#fff;color:#66756f;font-size:7px}.chips span:first-child{border-color:${identity.primaryColor};background:${identity.primaryColor};color:#fff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.card{min-height:86px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:11px;padding:14px;border:1px solid #dbe5e1;border-radius:10px;background:#fff}.card i{width:38px;height:38px;display:grid;place-items:center;border-radius:9px;background:#e3f1eb;color:${identity.primaryColor};font-size:7px;font-style:normal;font-weight:900}.card span{display:flex;flex-direction:column}.card small{color:${identity.accentColor};font-size:6px;font-weight:900;text-transform:uppercase}.card strong{margin-top:5px;font-family:Georgia,serif;font-size:11px}.card em{margin-top:5px;color:#7b8983;font-size:7px;font-style:normal}.card b{color:${identity.primaryColor}}footer{padding:30px 6%;background:#082f27;color:#fff;font-size:8px}@media(max-width:500px){.menu{display:none}.portal{margin-left:auto}.hero h1{font-size:34px}.grid{grid-template-columns:1fr}}
  </style></head><body><header><div class="brand"><div class="mark">AM</div><span><small>${escapeHtml(identity.brandLine)}</small><strong>${escapeHtml(identity.municipality.toUpperCase())}</strong><em>${escapeHtml(identity.tagline)}</em></span></div><nav class="menu">Serviços　Como funciona　Ajuda</nav><div class="portal">Portal da Prefeitura ↗</div></header><section class="hero"><span class="eyebrow">${escapeHtml(content.hero.eyebrow)}</span><h1>${escapeHtml(content.hero.title)}</h1><p>${escapeHtml(content.hero.description)}</p><div class="search"><span>⌕　${escapeHtml(content.hero.searchPlaceholder)}</span><b>Buscar</b></div></section><section class="services"><span class="eyebrow">ACESSO RÁPIDO</span><h2>Serviços para você</h2><div class="chips">${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}</div><div class="grid">${cards}</div></section><footer><strong>${escapeHtml(content.help.title)}</strong>　${escapeHtml(content.help.description)}</footer></body></html>`;
}

function renderPreview() { $("#preview").srcdoc = previewHtml(); }
function markDirty() { dirty = true; $(".save-state").className = "save-state dirty"; $("#save-state").textContent = "Alterações ainda não salvas"; renderPreview(); }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2400); }

function fillGeneralFields() {
  $$('[name]').forEach((field) => { field.value = getPath(content, field.name) ?? ""; });
}

function renderServiceList() {
  $("#service-count").textContent = content.services.length;
  $("#service-list").innerHTML = content.services.map((service) => `<button type="button" data-id="${escapeHtml(service.id)}" class="${service.id === selectedServiceId ? "active" : ""}"><i>${escapeHtml(service.initials)}</i><span><strong>${escapeHtml(service.title)}</strong><small>${escapeHtml(service.category)} · ${escapeHtml(service.department)}</small></span><em>›</em></button>`).join("");
  $$("#service-list button").forEach((button) => button.addEventListener("click", () => selectService(button.dataset.id)));
}

function selectService(id) {
  selectedServiceId = id;
  const service = content.services.find((item) => item.id === id);
  renderServiceList();
  if (!service) { $("#service-editor").classList.add("hidden"); return; }
  $("#service-editor").classList.remove("hidden");
  $("#selected-service-title").textContent = service.title;
  $$('[data-service]').forEach((field) => { field[field.type === "checkbox" ? "checked" : "value"] = service[field.dataset.service] ?? false; });
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
  renderServiceList();
  renderPreview();
  $$('[name]').forEach((field) => field.addEventListener("input", () => { setPath(content, field.name, field.value); markDirty(); }));
  $$(".section-nav button").forEach((button) => button.addEventListener("click", () => changeSection(button.dataset.section)));
  $$(".devices button").forEach((button) => button.addEventListener("click", () => { $$(".devices button").forEach((item) => item.classList.toggle("active", item === button)); $("#preview").className = button.dataset.device === "desktop" ? "" : button.dataset.device; $("#viewport-label").textContent = button.dataset.device === "desktop" ? "1440 × 900 · 100%" : button.dataset.device === "tablet" ? "768 × 1024" : "390 × 844"; }));
  $$('[data-service]').forEach((field) => field.addEventListener("input", () => { const service = content.services.find((item) => item.id === selectedServiceId); if (!service) return; service[field.dataset.service] = field.type === "checkbox" ? field.checked : field.value; $("#selected-service-title").textContent = service.title; renderServiceList(); markDirty(); }));
  $("#add-service").addEventListener("click", () => { const id = `servico-${Date.now()}`; content.services.push({ id, title: "Novo serviço", department: "Órgão responsável", category: "Geral", destination: "Canal oficial", url: content.identity.portalUrl, initials: "NS", featured: false }); renderServiceList(); selectService(id); markDirty(); });
  $("#delete-service").addEventListener("click", () => { if (!selectedServiceId || !confirm("Excluir este serviço do projeto?")) return; content.services = content.services.filter((service) => service.id !== selectedServiceId); selectedServiceId = null; renderServiceList(); selectService(null); markDirty(); });
  $("#save").addEventListener("click", save);
  $("#validate").addEventListener("click", async () => showValidation(await window.centralAPI.validate(content)));
  $("#export").addEventListener("click", async () => { if (dirty && !(await save())) return; const result = await window.centralAPI.exportSite(content); if (result.canceled) return; if (!result.ok) return showValidation(result.errors); showToast("Portal estático gerado e pronto para publicar"); });
  $("#close-dialog").addEventListener("click", () => $("#validation-dialog").close());
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
}

init();
