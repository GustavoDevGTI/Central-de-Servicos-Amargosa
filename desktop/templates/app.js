(() => {
  const content = window.CENTRAL_CONTENT;
  let audience = "todos";
  let category = "todos";
  let query = "";
  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { byId(id).textContent = value || ""; };
  const scrollResults = () => byId("todos-os-servicos").scrollIntoView({ behavior: "smooth" });

  document.documentElement.style.setProperty("--green", content.identity.primaryColor);
  document.documentElement.style.setProperty("--red", content.identity.accentColor);
  setText("utility-name", `Portal oficial do Município de ${content.identity.municipality}`);
  setText("brand-line", content.identity.brandLine);
  setText("municipality", content.identity.municipality);
  setText("footer-municipality", content.identity.municipality);
  setText("tagline", content.identity.tagline);
  setText("eyebrow", content.hero.eyebrow);
  setText("hero-title", content.hero.title);
  setText("hero-description", content.hero.description);
  setText("help-title", content.help.title);
  setText("help-description", content.help.description);
  byId("search").placeholder = content.hero.searchPlaceholder;
  for (const id of ["portal-top", "help-link"]) byId(id).href = content.identity.portalUrl;
  setText("help-link", `${content.help.label} ↗`);

  const featured = content.services.filter((service) => service.featured);
  featured.slice(0, 4).forEach((service) => {
    const button = document.createElement("button"); button.type = "button"; button.textContent = service.title;
    button.addEventListener("click", () => { query = service.title; byId("search").value = query; audience = "todos"; category = "todos"; renderServices(); scrollResults(); });
    byId("popular").append(button);
  });

  function serviceCard(service, index, compact = false) {
    const card = document.createElement("a"); card.className = compact ? "featured-card" : "service-card"; card.href = service.url; card.target = "_blank"; card.rel = "noreferrer";
    if (compact) { const rank = document.createElement("span"); rank.className = "rank"; rank.textContent = String(index + 1).padStart(2, "0"); card.append(rank); }
    const icon = document.createElement("i"); icon.textContent = service.initials;
    const copy = document.createElement("span"); const area = document.createElement("small"); area.textContent = service.category; const title = document.createElement("strong"); title.textContent = service.title; const department = document.createElement("em"); department.textContent = service.department; copy.append(area, title, department);
    const destination = document.createElement("b"); destination.textContent = compact ? "↗" : `${service.destination} ↗`;
    card.append(icon, copy, destination); return card;
  }

  byId("featured").replaceChildren(...featured.map((service, index) => serviceCard(service, index, true)));
  byId("audiences").replaceChildren(...content.audiences.map((item) => {
    const button = document.createElement("button"); button.type = "button";
    const icon = document.createElement("i"); icon.textContent = item.initials; const title = document.createElement("strong"); title.textContent = item.label; const description = document.createElement("small"); description.textContent = item.description; const link = document.createElement("b"); link.textContent = "Ver serviços →";
    button.append(icon, title, description, link); button.addEventListener("click", () => { audience = item.id; category = "todos"; renderServices(); scrollResults(); }); return button;
  }));

  const categoryNames = [...new Set(content.services.map((service) => service.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  byId("categories").replaceChildren(...categoryNames.map((item) => {
    const button = document.createElement("button"); button.type = "button"; const mark = document.createElement("i"); mark.textContent = item.split(" ").slice(0, 2).map((word) => word[0]).join(""); const title = document.createElement("strong"); title.textContent = item; const arrow = document.createElement("b"); arrow.textContent = "→"; button.append(mark, title, arrow);
    button.addEventListener("click", () => { category = item; audience = "todos"; renderServices(); scrollResults(); }); return button;
  }));

  function renderServices() {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const services = content.services.filter((service) => (audience === "todos" || service.audience === audience) && (category === "todos" || service.category === category) && (!normalized || `${service.title} ${service.department} ${service.category} ${service.destination}`.toLocaleLowerCase("pt-BR").includes(normalized)));
    byId("service-grid").replaceChildren(...services.map((service, index) => serviceCard(service, index)));
    setText("result-count", `${services.length} encontrado${services.length === 1 ? "" : "s"}`);
    setText("results-title", audience !== "todos" ? `Serviços para ${content.audiences.find((item) => item.id === audience)?.label}` : category !== "todos" ? category : query ? "Resultado da busca" : "Todos os serviços");
    byId("empty").hidden = services.length !== 0;
    byId("clear").hidden = audience === "todos" && category === "todos" && !query;
  }
  byId("search").addEventListener("input", (event) => { query = event.target.value; renderServices(); });
  byId("clear").addEventListener("click", () => { audience = "todos"; category = "todos"; query = ""; byId("search").value = ""; renderServices(); });
  renderServices();
})();
