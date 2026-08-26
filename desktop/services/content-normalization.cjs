function withoutDeprecatedContent(content) {
  const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const isAdministration = (value) => normalize(value) === "administracao e governo";
  const removedItemIds = new Set(["hero-description", "hero-privacy", "audiences-eyebrow", "audiences-description", "featured-description"]);
  for (const page of content?.pages || []) {
    page.segments = (page.segments || []).filter((segment) => !isAdministration(segment.name));
    const removedServices = new Set();
    for (const segment of page.segments) {
      segment.items = (segment.items || []).filter((item) => {
        if (removedItemIds.has(item.id)) return false;
        if (item.type === "category" && isAdministration(item.label)) return false;
        if (item.type === "service" && isAdministration(item.category)) { removedServices.add(item.id); return false; }
        return true;
      });
    }
    for (const segment of page.segments) segment.items = (segment.items || []).filter((item) => item.type !== "serviceRef" || !removedServices.has(item.serviceId));
  }
  return content;
}

function migrateLegacyContent(content, template) {
  const migrated = structuredClone(template);
  const segments = migrated.pages[0].segments;
  const findSegment = (type) => segments.find((segment) => segment.type === type);
  const setText = (segmentType, role, value) => {
    const item = findSegment(segmentType)?.items.find((entry) => entry.role === role);
    if (item && typeof value === "string") item.value = value;
  };
  const identity = content?.identity || {};
  migrated.site.primaryColor = identity.primaryColor || migrated.site.primaryColor;
  migrated.site.accentColor = identity.accentColor || migrated.site.accentColor;
  for (const segment of segments) if (segment.style.accent === template.site.primaryColor) segment.style.accent = migrated.site.primaryColor;
  setText("header", "brandLine", identity.brandLine);
  setText("header", "municipality", identity.municipality);
  setText("header", "subtitle", "Central de Serviços");
  setText("hero", "eyebrow", content?.hero?.eyebrow);
  setText("hero", "title", content?.hero?.title);
  setText("hero", "description", content?.hero?.description);
  const search = findSegment("hero")?.items.find((entry) => entry.type === "search");
  if (search && content?.hero?.searchPlaceholder) search.placeholder = content.hero.searchPlaceholder;
  for (const type of ["utility", "header", "help"]) {
    for (const link of findSegment(type)?.items.filter((entry) => entry.type === "link") || []) if (link.role === "external" || link.role === "action") link.url = identity.portalUrl || link.url;
  }
  if (Array.isArray(content?.audiences) && content.audiences.length) {
    const segment = findSegment("audiences");
    segment.items = [...segment.items.filter((entry) => entry.type !== "audience"), ...content.audiences.map((entry) => ({ id: entry.id, type: "audience", role: "entry", label: entry.label, description: entry.description || "", initials: entry.initials || entry.label?.slice(0, 2).toUpperCase() || "PU" }))];
  }
  if (Array.isArray(content?.services) && content.services.length) {
    const catalog = findSegment("catalog");
    catalog.items = [...catalog.items.filter((entry) => entry.type !== "service"), ...content.services.map((entry) => ({ id: entry.id, type: "service", role: "entry", title: entry.title, department: entry.department, category: entry.category, audienceId: entry.audience || "cidadao", destination: entry.destination, url: entry.url, initials: entry.initials || "SV" }))];
    const featured = findSegment("featured");
    featured.items = [...featured.items.filter((entry) => entry.type !== "serviceRef"), ...content.services.filter((entry) => entry.featured).map((entry) => ({ id: `featured-${entry.id}`, type: "serviceRef", role: "entry", label: entry.title, serviceId: entry.id }))];
  }
  setText("help", "title", content?.help?.title);
  setText("help", "description", content?.help?.description);
  const helpLink = findSegment("help")?.items.find((entry) => entry.role === "action");
  if (helpLink && content?.help?.label) helpLink.text = `${content.help.label} ↗`;
  setText("footer", "description", identity.tagline);
  migrated.schemaVersion = 3;
  return withoutDeprecatedContent(migrated);
}

function normalizeContent(content, template) {
  if ((content?.schemaVersion || 1) >= 3 && Array.isArray(content.pages)) return withoutDeprecatedContent(content);
  return migrateLegacyContent(content, template);
}

module.exports = { migrateLegacyContent, normalizeContent, withoutDeprecatedContent };
