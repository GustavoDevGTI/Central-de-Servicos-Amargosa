(() => {
  const content = window.CENTRAL_CONTENT;
  const page = content.pages[0];
  const root = document.getElementById("conteudo");
  let audience = "todos";
  let category = "todos";
  let query = "";
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const segment = (type) => page.segments.find((entry) => entry.type === type);
  const entries = (entry, type) => entry?.items.filter((item) => item.type === type) || [];
  const text = (entry, role, fallback = "") => entry?.items.find((item) => item.role === role)?.value || fallback;
  const services = entries(segment("catalog"), "service");
  const audienceItems = entries(segment("audiences"), "audience");
  const style = (entry) => { const image = entry.style.backgroundImage ? `background-image:linear-gradient(#063d32c9,#063d32c9),url('${entry.style.backgroundImage}')` : ""; return `--segment-bg:${entry.style.background};--segment-color:${entry.style.color};--segment-accent:${entry.style.accent};${image}`; };
  const links = (entry) => entries(entry, "link").map((item) => `<a href="${escapeHtml(item.url)}" ${item.url.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>${escapeHtml(item.text)}</a>`).join("");
  const heading = (entry) => `<header><div><span>${escapeHtml(text(entry, "eyebrow"))}</span><h2>${escapeHtml(text(entry, "title", entry.name))}</h2></div><p>${escapeHtml(text(entry, "description"))}</p></header>`;
  const logo = (entry) => { const image = entries(entry, "image").find((item) => item.role === "logo"); return image?.src ? `<img class="logo-image" src="${image.src}" alt="${escapeHtml(image.alt)}">` : '<span class="mark">AM</span>'; };
  const serviceCard = (service, index, featured = false) => `<a class="${featured ? "featured-card" : "service-card"}" href="${escapeHtml(service.url)}" target="_blank" rel="noreferrer">${featured ? `<span class="rank">${String(index + 1).padStart(2, "0")}</span>` : ""}<span><small>${escapeHtml(service.category)}</small><strong>${escapeHtml(service.title)}</strong><em>${escapeHtml(service.department)}</em></span><b>${featured ? "↗" : `${escapeHtml(service.destination)} ↗`}</b></a>`;

  function renderSegment(entry) {
    if (!entry.enabled) return "";
    const open = `<section id="${entry.type === "catalog" ? "todos-os-servicos" : escapeHtml(entry.id)}" class="editable segment-${escapeHtml(entry.type)} variant-${escapeHtml(entry.style.variant || "institutional")} width-${escapeHtml(entry.style.width)} spacing-${escapeHtml(entry.style.spacing)} radius-${escapeHtml(entry.style.radius)}" style="${style(entry)}">`;
    if (entry.type === "utility") return `${open}<div class="utility"><span>${escapeHtml(text(entry, "label"))}</span><nav>${links(entry)}</nav></div></section>`;
    if (entry.type === "header") return `${open}<div class="header"><a class="brand" href="#">${logo(entry)}<span><small>${escapeHtml(text(entry, "brandLine"))}</small><strong>${escapeHtml(text(entry, "municipality"))}</strong><em>${escapeHtml(text(entry, "subtitle"))}</em></span></a><nav>${links(entry)}</nav><span class="menu">☰ Menu</span></div></section>`;
    if (entry.type === "hero") { const search = entries(entry, "search")[0]; const refs = entries(segment("featured"), "serviceRef").slice(0, 4).map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean); return `${open}<div class="hero"><span class="eyebrow">${escapeHtml(text(entry, "eyebrow"))}</span><h1>${escapeHtml(text(entry, "title"))}</h1><p>${escapeHtml(text(entry, "description"))}</p><label class="search"><span>⌕</span><input id="search" placeholder="${escapeHtml(search?.placeholder)}" aria-label="Buscar serviços"><a href="#todos-os-servicos">${escapeHtml(search?.buttonText || "Buscar")}</a></label><div class="popular"><span>Mais buscados:</span>${refs.map((service) => `<button type="button" data-shortcut="${escapeHtml(service.title)}">${escapeHtml(service.title)}</button>`).join("")}</div><small>${escapeHtml(text(entry, "notice"))}</small></div></section>`; }
    if (entry.type === "audiences") return `${open}<div class="audience-panel">${heading(entry)}<div class="audiences">${entries(entry, "audience").map((item) => `<button type="button" data-audience="${escapeHtml(item.id)}"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small><b>Ver serviços →</b></button>`).join("")}</div></div></section>`;
    if (entry.type === "featured") { const featured = entries(entry, "serviceRef").map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean); return `${open}<div class="section">${heading(entry)}<div class="featured">${featured.map((service, index) => serviceCard(service, index, true)).join("")}</div></div></section>`; }
    if (entry.type === "categories") return `${open}<div class="categories-section"><div class="boundary">${heading(entry)}<div class="categories">${entries(entry, "category").map((item) => `<button type="button" data-category="${escapeHtml(item.label)}"><span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span><b>→</b></button>`).join("")}</div></div></div></section>`;
    if (entry.type === "catalog") return `${open}<div class="results section"><header><div><span>${escapeHtml(text(entry, "eyebrow"))}</span><h2 id="results-title">${escapeHtml(text(entry, "title"))}</h2></div><div><button id="clear" hidden>Limpar filtros ×</button><b id="result-count"></b></div></header><div id="service-grid" class="service-grid"></div><div id="empty" class="empty" hidden>Nenhum serviço encontrado.</div></div></section>`;
    if (entry.type === "help") return `${open}<div class="help"><div><span>${escapeHtml(text(entry, "eyebrow"))}</span><h2>${escapeHtml(text(entry, "title"))}</h2><p>${escapeHtml(text(entry, "description"))}</p></div>${links(entry)}</div></section>`;
    if (entry.type === "footer") return `${open}<footer><div class="brand">${logo(entry)}<span><strong>${escapeHtml(text(entry, "title"))}</strong><em>${escapeHtml(text(entry, "description"))}</em></span></div><nav>${links(entry)}</nav></footer></section>`;
    if (entry.type === "amanda") { const avatar = entries(entry, "image").find((item) => item.role === "avatar"); const avatarHtml = avatar?.src ? `<img src="${avatar.src}" alt="">` : "A"; const conversation = entries(entry, "search")[0]; return `<div id="amanda-widget" class="amanda-widget" style="${style(entry)}"><button id="amanda-launcher" class="amanda-launcher" type="button" aria-expanded="false"><span class="amanda-symbol">${avatarHtml}</span><span><small>${escapeHtml(text(entry, "eyebrow"))}</small><strong>Amanda</strong></span><b>✦</b></button><aside id="amanda-panel" class="amanda-panel" hidden><header><div class="amanda-identity"><span class="amanda-symbol">${avatarHtml}</span><span><small>${escapeHtml(text(entry, "eyebrow"))}</small><strong>${escapeHtml(text(entry, "title"))}</strong></span></div><button id="amanda-close" type="button">×</button></header><div class="amanda-body"><p>${escapeHtml(text(entry, "description"))}</p><small class="amanda-status">${escapeHtml(text(entry, "status"))}</small><div id="amanda-prompts" class="amanda-prompts">${entry.items.filter((item) => item.role === "prompt").map((item) => `<button type="button" data-amanda-prompt="${escapeHtml(item.value)}">${escapeHtml(item.value)} <b>↗</b></button>`).join("")}</div><div id="amanda-transcript" class="amanda-transcript"></div></div><form id="amanda-form"><textarea id="amanda-input" rows="2" placeholder="${escapeHtml(conversation?.placeholder)}"></textarea><button type="submit">${escapeHtml(conversation?.buttonText || "Enviar")} ↗</button></form><small class="amanda-notice">${escapeHtml(text(entry, "notice"))}</small></aside></div>`; }
    return `${open}<div class="section generic">${heading(entry)}<div>${entry.items.filter((item) => !["eyebrow", "title", "description"].includes(item.role)).map((item) => item.type === "image" && item.src ? `<img src="${item.src}" alt="${escapeHtml(item.alt)}">` : item.type === "link" ? `<a href="${escapeHtml(item.url)}">${escapeHtml(item.text)}</a>` : `<p>${escapeHtml(item.value || item.label)}</p>`).join("")}</div></div></section>`;
  }

  root.innerHTML = page.segments.map(renderSegment).join("");
  document.documentElement.style.setProperty("--green", content.site.primaryColor);
  document.documentElement.style.setProperty("--red", content.site.accentColor);

  function renderServices() {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const filtered = services.filter((service) => (audience === "todos" || service.audienceId === audience) && (category === "todos" || service.category === category) && (!normalized || `${service.title} ${service.department} ${service.category} ${service.destination}`.toLocaleLowerCase("pt-BR").includes(normalized)));
    document.getElementById("service-grid").innerHTML = filtered.map((service, index) => serviceCard(service, index)).join("");
    document.getElementById("result-count").textContent = `${filtered.length} encontrado${filtered.length === 1 ? "" : "s"}`;
    document.getElementById("results-title").textContent = audience !== "todos" ? `Serviços para ${audienceItems.find((item) => item.id === audience)?.label}` : category !== "todos" ? category : query ? "Resultado da busca" : text(segment("catalog"), "title", "Todos os serviços");
    document.getElementById("empty").hidden = filtered.length !== 0;
    document.getElementById("clear").hidden = audience === "todos" && category === "todos" && !query;
  }
  const scrollResults = () => document.getElementById("todos-os-servicos")?.scrollIntoView({ behavior: "smooth" });
  document.getElementById("search")?.addEventListener("input", (event) => { query = event.target.value; renderServices(); });
  document.querySelectorAll("[data-shortcut]").forEach((button) => button.addEventListener("click", () => { query = button.dataset.shortcut; document.getElementById("search").value = query; audience = "todos"; category = "todos"; renderServices(); scrollResults(); }));
  document.querySelectorAll("[data-audience]").forEach((button) => button.addEventListener("click", () => { audience = button.dataset.audience; category = "todos"; renderServices(); scrollResults(); }));
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => { category = button.dataset.category; audience = "todos"; renderServices(); scrollResults(); }));
  document.getElementById("clear")?.addEventListener("click", () => { audience = "todos"; category = "todos"; query = ""; document.getElementById("search").value = ""; renderServices(); });
  const amandaLauncher = document.getElementById("amanda-launcher"); const amandaPanel = document.getElementById("amanda-panel");
  const toggleAmanda = (open) => { if (!amandaPanel) return; amandaPanel.hidden = !open; amandaLauncher?.setAttribute("aria-expanded", String(open)); };
  const askAmanda = (question) => { const value = question.trim(); if (!value) return; document.getElementById("amanda-prompts").hidden = true; const transcript = document.getElementById("amanda-transcript"); transcript.insertAdjacentHTML("beforeend", `<article class="user"><small>Você</small><p>${escapeHtml(value)}</p></article><article><small>Amanda</small><p>Minha inteligência ainda está sendo preparada. Em breve vou responder e indicar o canal oficial mais adequado para você.</p></article>`); document.getElementById("amanda-input").value = ""; };
  amandaLauncher?.addEventListener("click", () => toggleAmanda(amandaPanel.hidden)); document.getElementById("amanda-close")?.addEventListener("click", () => toggleAmanda(false));
  document.querySelectorAll("[data-amanda-prompt]").forEach((button) => button.addEventListener("click", () => askAmanda(button.dataset.amandaPrompt)));
  document.getElementById("amanda-form")?.addEventListener("submit", (event) => { event.preventDefault(); askAmanda(document.getElementById("amanda-input").value); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") toggleAmanda(false); });
  renderServices();
})();
