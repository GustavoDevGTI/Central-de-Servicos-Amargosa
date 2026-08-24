(() => {
  const content = window.CENTRAL_CONTENT;
  let category = "Todos";
  let query = "";
  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { byId(id).textContent = value || ""; };
  document.documentElement.style.setProperty("--green", content.identity.primaryColor);
  document.documentElement.style.setProperty("--red", content.identity.accentColor);
  setText("brand-line", content.identity.brandLine);
  setText("municipality", content.identity.municipality.toLocaleUpperCase("pt-BR"));
  setText("tagline", content.identity.tagline);
  setText("eyebrow", content.hero.eyebrow);
  setText("hero-title", content.hero.title);
  setText("hero-description", content.hero.description);
  setText("help-title", content.help.title);
  setText("help-description", content.help.description);
  byId("search").placeholder = content.hero.searchPlaceholder;
  byId("portal-link").href = content.identity.portalUrl;
  byId("help-link").href = content.identity.portalUrl;
  setText("help-link", `${content.help.label} ↗`);

  const categories = ["Todos", ...new Set(content.services.map((service) => service.category).filter(Boolean))];
  function renderCategories() {
    byId("categories").replaceChildren(...categories.map((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item;
      button.className = item === category ? "active" : "";
      button.addEventListener("click", () => { category = item; renderCategories(); renderServices(); });
      return button;
    }));
  }
  function renderServices() {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const services = content.services.filter((service) => (category === "Todos" || service.category === category) && (!normalized || `${service.title} ${service.department} ${service.category}`.toLocaleLowerCase("pt-BR").includes(normalized)));
    byId("service-grid").replaceChildren(...services.map((service) => {
      const card = document.createElement("a"); card.className = "card"; card.href = service.url; card.target = "_blank"; card.rel = "noreferrer";
      const icon = document.createElement("i"); icon.textContent = service.initials;
      const copy = document.createElement("span"); const area = document.createElement("small"); area.textContent = service.category; const title = document.createElement("strong"); title.textContent = service.title; const department = document.createElement("em"); department.textContent = service.department; copy.append(area, title, department);
      const destination = document.createElement("b"); destination.textContent = `${service.destination} ↗`;
      card.append(icon, copy, destination); return card;
    }));
    byId("result-count").textContent = `${services.length} serviço${services.length === 1 ? "" : "s"} encontrado${services.length === 1 ? "" : "s"}`;
    byId("empty").hidden = services.length !== 0;
  }
  byId("search").addEventListener("input", (event) => { query = event.target.value; renderServices(); });
  renderCategories(); renderServices();
})();
