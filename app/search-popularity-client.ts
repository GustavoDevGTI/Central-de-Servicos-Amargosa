const endpoint = "/api/popular";

function storageKey(serviceId: string) {
  return `central-search-popularity:${new Date().toISOString().slice(0, 10)}:${serviceId}`;
}

export function recordSearchSelection(serviceId: string) {
  try {
    const key = storageKey(serviceId);
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // A medição é opcional; a navegação nunca depende do armazenamento do navegador.
  }
  void fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceId }),
  }).catch(() => undefined);
}

export async function loadPopularServiceIds() {
  try {
    const response = await fetch(endpoint, { credentials: "same-origin" });
    if (!response.ok) return [];
    const body = await response.json() as { serviceIds?: unknown };
    return Array.isArray(body.serviceIds) ? body.serviceIds.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
