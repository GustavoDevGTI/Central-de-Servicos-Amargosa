export function searchSlug(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function searchPath(value = "") {
  const slug = searchSlug(value);
  return slug ? `/servicos/busca/${slug}` : "/servicos";
}

export function searchTermFromSlug(value = "") {
  return decodeURIComponent(value).replace(/-+/g, " ").trim();
}
