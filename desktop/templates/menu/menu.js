(() => {
  const content = window.CENTRAL_CONTENT;
  const page = content.pages[0];
  const segments = page.segments.filter((segment) => segment.enabled);
  const audiences = segments.find((segment) => segment.type === "audiences")?.items.filter((item) => item.type === "audience") || [];
  const services = segments.find((segment) => segment.type === "catalog")?.items.filter((item) => item.type === "service") || [];
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const safeId = (value = "grupo") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const categoriesFor = (audienceId, source = services) => {
    const audienceServices = source.filter((service) => service.audienceId === audienceId);
    return [...new Set(audienceServices.map((service) => service.category || "Outros serviços"))].map((category) => ({ category, services: audienceServices.filter((service) => (service.category || "Outros serviços") === category) }));
  };
  const groups = audiences.map((audience) => ({ audience, categories: categoriesFor(audience.id) })).filter((group) => group.categories.length);
  const knownAudienceIds = new Set(audiences.map((audience) => audience.id));
  const unassigned = services.filter((service) => !knownAudienceIds.has(service.audienceId || ""));
  if (unassigned.length) groups.push({ audience: { id: "outros", label: "Outros públicos" }, categories: [...new Set(unassigned.map((service) => service.category || "Outros serviços"))].map((category) => ({ category, services: unassigned.filter((service) => (service.category || "Outros serviços") === category) })) });
  const serviceLink = (service) => `<li><a href="${escapeHtml(service.url || "#")}"><span><strong>${escapeHtml(service.title)}</strong>${service.department ? `<small>${escapeHtml(service.department)}</small>` : ""}</span><b>${escapeHtml(service.destination || "Acessar serviço")} →</b></a></li>`;
  const groupHtml = ({ audience, categories }) => `<section id="publico-${safeId(audience.id)}" class="accessibility-public-group" aria-labelledby="titulo-${safeId(audience.id)}"><h2 id="titulo-${safeId(audience.id)}">${escapeHtml(audience.label)}</h2>${categories.map(({ category, services: categoryServices }) => `<section class="accessibility-category-group"><h3>${escapeHtml(category)}</h3><ul>${categoryServices.map(serviceLink).join("")}</ul></section>`).join("")}</section>`;
  document.getElementById("conteudo-menu").innerHTML = `<div class="skip-links"><a class="skip" href="#lista-servicos">Ir para a lista de serviços</a></div><header class="accessibility-menu-header"><a class="accessibility-menu-back" href="../">← Voltar à Central de Serviços</a><p>Prefeitura de Amargosa</p><h1>Menu Acessibilidade</h1><span>Todos os serviços organizados em uma estrutura simples.</span></header><nav class="accessibility-menu-index" aria-label="Públicos disponíveis"><strong>Ir para:</strong>${groups.map(({ audience }) => `<a href="#publico-${safeId(audience.id)}">${escapeHtml(audience.label)}</a>`).join("")}</nav><div id="lista-servicos" class="accessibility-menu-groups">${groups.map(groupHtml).join("")}</div><footer class="accessibility-menu-footer"><a href="../">← Voltar à Central de Serviços</a></footer>`;
})();
