const publicOrigins = new Set([
  "https://maisdigital.amargosa.ba.gov.br",
  "https://servicos.amargosa.ba.gov.br",
]);

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase() || "";
}

export function isAllowedRequestOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  if (parsedOrigin.origin !== origin || !["http:", "https:"].includes(parsedOrigin.protocol)) {
    return false;
  }

  const normalizedOrigin = parsedOrigin.origin.toLowerCase();
  if (publicOrigins.has(normalizedOrigin)) return true;

  const requestUrl = new URL(request.url);
  if (normalizedOrigin === requestUrl.origin.toLowerCase()) return true;

  const forwardedProtocol = firstHeaderValue(request.headers.get("X-Forwarded-Proto"));
  const protocol = forwardedProtocol || requestUrl.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") return false;

  const hosts = [
    firstHeaderValue(request.headers.get("Host")),
    firstHeaderValue(request.headers.get("X-Forwarded-Host")),
  ];
  return hosts.some((host) => host && normalizedOrigin === `${protocol}://${host}`);
}
