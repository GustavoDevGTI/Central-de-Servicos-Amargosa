const endpoint = "/api/popular";

export function recordServiceSearch(serviceId: string) {
  void fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceId }),
  }).catch(() => undefined);
}

export async function loadServicePopularity() {
  try {
    const response = await fetch(endpoint, { credentials: "same-origin" });
    if (!response.ok) return {};
    const body = (await response.json()) as { services?: unknown };
    if (!Array.isArray(body.services)) return {};
    return Object.fromEntries(
      body.services.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const { serviceId, searches } = entry as {
          serviceId?: unknown;
          searches?: unknown;
        };
        return typeof serviceId === "string" && typeof searches === "number"
          ? [[serviceId, searches]]
          : [];
      }),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}
