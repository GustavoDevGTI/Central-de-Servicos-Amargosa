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
  const serviceCard = (service, index, featured = false) => `<a class="${featured ? "featured-card" : "service-card"}" href="${escapeHtml(service.url)}" target="_blank" rel="noreferrer">${featured ? `<span class="rank">${String(index + 1).padStart(2, "0")}</span>` : ""}<i>${escapeHtml(service.initials)}</i><span><small>${escapeHtml(service.category)}</small><strong>${escapeHtml(service.title)}</strong><em>${escapeHtml(service.department)}</em></span><b>${featured ? "↗" : `${escapeHtml(service.destination)} ↗`}</b></a>`;

  function renderSegment(entry) {
    if (!entry.enabled) return "";
    const open = `<section id="${entry.type === "catalog" ? "todos-os-servicos" : escapeHtml(entry.id)}" class="editable segment-${escapeHtml(entry.type)} width-${escapeHtml(entry.style.width)} spacing-${escapeHtml(entry.style.spacing)} radius-${escapeHtml(entry.style.radius)}" style="${style(entry)}">`;
    if (entry.type === "utility") return `${open}<div class="utility"><span>${escapeHtml(text(entry, "label"))}</span><nav>${links(entry)}</nav></div></section>`;
    if (entry.type === "header") return `${open}<div class="header"><a class="brand" href="#">${logo(entry)}<span><small>${escapeHtml(text(entry, "brandLine"))}</small><strong>${escapeHtml(text(entry, "municipality"))}</strong><em>${escapeHtml(text(entry, "subtitle"))}</em></span></a><nav>${links(entry)}</nav><span class="menu">☰ Menu</span></div></section>`;
    if (entry.type === "hero") { const search = entries(entry, "search")[0]; const refs = entries(segment("featured"), "serviceRef").slice(0, 4).map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean); return `${open}<div class="hero"><span class="eyebrow">${escapeHtml(text(entry, "eyebrow"))}</span><h1>${escapeHtml(text(entry, "title"))}</h1><p>${escapeHtml(text(entry, "description"))}</p><label class="search"><span>⌕</span><input id="search" placeholder="${escapeHtml(search?.placeholder)}" aria-label="Buscar serviços"><a href="#todos-os-servicos">${escapeHtml(search?.buttonText || "Buscar")}</a></label><div class="popular"><span>Mais buscados:</span>${refs.map((service) => `<button type="button" data-shortcut="${escapeHtml(service.title)}">${escapeHtml(service.title)}</button>`).join("")}</div><small>${escapeHtml(text(entry, "notice"))}</small></div></section>`; }
    if (entry.type === "audiences") return `${open}<div class="audience-panel">${heading(entry)}<div class="audiences">${entries(entry, "audience").map((item) => `<button type="button" data-audience="${escapeHtml(item.id)}"><i>${escapeHtml(item.initials)}</i><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small><b>Ver serviços →</b></button>`).join("")}</div></div></section>`;
    if (entry.type === "featured") { const featured = entries(entry, "serviceRef").map((ref) => services.find((service) => service.id === ref.serviceId)).filter(Boolean); return `${open}<div class="section">${heading(entry)}<div class="featured">${featured.map((service, index) => serviceCard(service, index, true)).join("")}</div></div></section>`; }
    if (entry.type === "categories") return `${open}<div class="categories-section"><div class="boundary">${heading(entry)}<div class="categories">${entries(entry, "category").map((item) => `<button type="button" data-category="${escapeHtml(item.label)}"><i>${escapeHtml(item.initials)}</i><span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span><b>→</b></button>`).join("")}</div></div></div></section>`;
    if (entry.type === "catalog") return `${open}<div class="results section"><header><div><span>${escapeHtml(text(entry, "eyebrow"))}</span><h2 id="results-title">${escapeHtml(text(entry, "title"))}</h2></div><div><button id="clear" hidden>Limpar filtros ×</button><b id="result-count"></b></div></header><div id="service-grid" class="service-grid"></div><div id="empty" class="empty" hidden>Nenhum serviço encontrado.</div></div></section>`;
    if (entry.type === "help") return `${open}<div class="help"><div><span>${escapeHtml(text(entry, "eyebrow"))}</span><h2>${escapeHtml(text(entry, "title"))}</h2><p>${escapeHtml(text(entry, "description"))}</p></div>${links(entry)}</div></section>`;
    if (entry.type === "footer") return `${open}<footer><div class="brand">${logo(entry)}<span><strong>${escapeHtml(text(entry, "title"))}</strong><em>${escapeHtml(text(entry, "description"))}</em></span></div><nav>${links(entry)}</nav></footer></section>`;
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
  renderServices();
})();
