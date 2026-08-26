function validateContent(content) {
  const errors = [];
  const siteDesign = content?.site?.design;
  const allowed = { theme: ["institutional", "editorial", "compact", "soft", "contrast"], palette: ["amargosa", "harvest", "civic", "earth", "graphite"], headingFont: ["lora", "source", "segoe", "georgia", "cambria", "arial"], bodyFont: ["lora", "source", "segoe", "georgia", "cambria", "arial"], fontSize: ["small", "normal", "large", "xlarge"], hoverEffect: ["none", "lift", "shadow", "outline"], clickEffect: ["none", "press", "shrink", "accent"] };
  if (siteDesign != null) for (const [field, values] of Object.entries(allowed)) if (siteDesign[field] != null && !values.includes(siteDesign[field])) errors.push(`Site completo: a opção de ${field} é inválida.`);
  const validateSize = (size, label, minimumWidth) => {
    if (size == null) return;
    const width = Number(size.width); const height = Number(size.height);
    if (!Number.isFinite(width) || width < minimumWidth || width > 4096 || !Number.isFinite(height) || height < 32 || height > 4096) errors.push(`${label}: o tamanho personalizado é inválido.`);
  };
  const validatePosition = (position, label) => {
    if (position == null) return;
    const x = Number(position.x); const y = Number(position.y);
    if (!Number.isFinite(x) || Math.abs(x) > 4096 || !Number.isFinite(y) || Math.abs(y) > 4096) errors.push(`${label}: a posição personalizada é inválida.`);
  };
  if (content?.schemaVersion !== 3) errors.push("O projeto precisa usar a estrutura atual (versão 3).");
  if (!Array.isArray(content?.pages) || content.pages.length === 0) return [...errors, "Cadastre ao menos uma página."];
  const slugs = new Set();
  const allSegments = content.pages.flatMap((page) => page.segments || []);
  const audiences = new Set(allSegments.flatMap((segment) => segment.items || []).filter((item) => item.type === "audience").map((item) => item.id));
  const services = new Set(allSegments.flatMap((segment) => segment.items || []).filter((item) => item.type === "service").map((item) => item.id));
  const serviceSlugs = new Set();
  const validUrl = (value, allowAnchor = false) => {
    if (allowAnchor && typeof value === "string" && (/^#/.test(value) || /^\/(?!\/)/.test(value) || /^\.\.?(?:\/|$)/.test(value) || /^\?/.test(value))) return true;
    try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
  };
  for (const [pageIndex, page] of content.pages.entries()) {
    const pageLabel = page.name || `Página ${pageIndex + 1}`;
    if (!page.name?.trim()) errors.push(`Página ${pageIndex + 1}: informe o nome.`);
    if (!page.slug?.startsWith("/")) errors.push(`${pageLabel}: o endereço deve começar com /.`);
    if (slugs.has(page.slug)) errors.push(`${pageLabel}: o endereço está repetido.`); else slugs.add(page.slug);
    if (!Array.isArray(page.segments) || page.segments.length === 0) errors.push(`${pageLabel}: adicione ao menos um segmento.`);
    const segmentIds = new Set();
    for (const [segmentIndex, segment] of (page.segments || []).entries()) {
      const segmentLabel = segment.name || `Segmento ${segmentIndex + 1}`;
      if (!segment.name?.trim()) errors.push(`${pageLabel}, segmento ${segmentIndex + 1}: informe o nome.`);
      if (!segment.type?.trim()) errors.push(`${segmentLabel}: informe o tipo.`);
      validateSize(segment.size, segmentLabel, 160);
      validatePosition(segment.position, segmentLabel);
      const backgroundImages = segment.style?.backgroundImages;
      if (backgroundImages != null && !Array.isArray(backgroundImages)) errors.push(`${segmentLabel}: a galeria de fundo é inválida.`);
      if (Array.isArray(backgroundImages) && backgroundImages.length > 6) errors.push(`${segmentLabel}: o carrossel aceita no máximo 6 imagens.`);
      for (const [imageIndex, source] of (Array.isArray(backgroundImages) ? backgroundImages : []).entries()) {
        if (typeof source !== "string" || !/^data:image\//.test(source)) errors.push(`${segmentLabel}, imagem ${imageIndex + 1} do carrossel: o arquivo é inválido.`);
        else if (source.length > 2_900_000) errors.push(`${segmentLabel}, imagem ${imageIndex + 1} do carrossel: a imagem ultrapassa o limite de 2 MB.`);
      }
      if (segment.mergeWithPrevious != null && typeof segment.mergeWithPrevious !== "boolean") errors.push(`${segmentLabel}: a opção de mesclagem é inválida.`);
      if (segmentIds.has(segment.id)) errors.push(`${segmentLabel}: identificador de segmento repetido.`); else segmentIds.add(segment.id);
      if (!Array.isArray(segment.items)) errors.push(`${segmentLabel}: a lista de itens é inválida.`);
      const itemIds = new Set();
      for (const [itemIndex, item] of (segment.items || []).entries()) {
        const itemLabel = item.label || item.title || `Item ${itemIndex + 1}`;
        if (!item.id || itemIds.has(item.id)) errors.push(`${segmentLabel}: o identificador de “${itemLabel}” é inválido ou repetido.`); else itemIds.add(item.id);
        validateSize(item.size, `${segmentLabel}, ${itemLabel}`, 40);
        validatePosition(item.position, `${segmentLabel}, ${itemLabel}`);
        if (item.type === "link" && !validUrl(item.url, true)) errors.push(`${segmentLabel}, ${itemLabel}: informe uma URL completa ou uma âncora iniciada por #.`);
        if (item.type === "image" && item.src && !/^data:image\//.test(item.src) && !validUrl(item.src)) errors.push(`${segmentLabel}, ${itemLabel}: a imagem é inválida.`);
        if (item.type === "image" && item.src?.length > 2_900_000) errors.push(`${segmentLabel}, ${itemLabel}: a imagem ultrapassa o limite de 2 MB.`);
        if (item.type === "service") {
          if (!item.title?.trim() || !item.department?.trim()) errors.push(`${segmentLabel}, serviço ${itemIndex + 1}: informe nome e órgão responsável.`);
          const serviceAudiences = Array.isArray(item.audienceIds) && item.audienceIds.length ? item.audienceIds : item.audienceId ? [item.audienceId] : [];
          if (!serviceAudiences.length || serviceAudiences.some((audienceId) => !audiences.has(audienceId))) errors.push(`${segmentLabel}, ${item.title || itemLabel}: selecione ao menos um público válido.`);
          const serviceSlug = item.slug || item.id;
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(serviceSlug || "")) errors.push(`${segmentLabel}, ${item.title || itemLabel}: informe um endereço interno válido.`);
          else if (serviceSlugs.has(serviceSlug)) errors.push(`${segmentLabel}, ${item.title || itemLabel}: o endereço interno está repetido.`); else serviceSlugs.add(serviceSlug);
          if (!validUrl(item.url)) errors.push(`${segmentLabel}, ${item.title || itemLabel}: informe uma URL completa.`);
        }
        if (item.type === "serviceRef" && !services.has(item.serviceId)) errors.push(`${segmentLabel}, ${itemLabel}: selecione um serviço existente no catálogo.`);
      }
    }
  }
  return errors;
}

module.exports = { validateContent };
