import siteContent from "../../../content/site.json";
import { ensurePopularitySchema, popularityDatabase } from "../../search-popularity-db";

export const dynamic = "force-dynamic";

const catalog = siteContent.pages[0]?.segments.find((segment) => segment.type === "catalog");
const knownServiceIds = new Set(catalog?.items.filter((item) => item.type === "service").map((item) => item.id) || []);
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

async function transientClientKey(request: Request) {
  const address = request.headers.get("CF-Connecting-IP") || "local";
  const bytes = new TextEncoder().encode(address);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isRateLimited(request: Request) {
  const key = await transientClientKey(request);
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function GET() {
  try {
    const database = popularityDatabase();
    await ensurePopularitySchema(database);
    const result = await database.prepare(`SELECT service_id AS serviceId, SUM(search_clicks) AS clicks
      FROM service_popularity_daily
      WHERE day >= date('now', '-30 days')
      GROUP BY service_id
      ORDER BY clicks DESC, service_id ASC
      LIMIT 8`).all<{ serviceId: string; clicks: number }>();
    return json({ serviceIds: result.results.filter((entry) => knownServiceIds.has(entry.serviceId)).map((entry) => entry.serviceId) }, 200, {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    });
  } catch {
    return json({ serviceIds: [] });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Origem não permitida." }, 403);
  if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") return json({ error: "Formato inválido." }, 415);
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 512) return json({ error: "Requisição muito grande." }, 413);
  if (await isRateLimited(request)) return json({ error: "Muitas requisições." }, 429, { "Retry-After": "60" });

  let serviceId = "";
  try {
    const body = await request.json() as { serviceId?: unknown };
    if (typeof body.serviceId === "string") serviceId = body.serviceId.trim();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }
  if (!serviceId || serviceId.length > 100 || !knownServiceIds.has(serviceId)) return json({ error: "Serviço inválido." }, 400);

  try {
    const database = popularityDatabase();
    await ensurePopularitySchema(database);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    await database.prepare(`INSERT INTO service_popularity_daily (day, service_id, search_clicks, updated_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(day, service_id) DO UPDATE SET
        search_clicks = search_clicks + 1,
        updated_at = excluded.updated_at`).bind(day, serviceId, now.toISOString()).run();
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return json({ error: "Não foi possível registrar a seleção." }, 503);
  }
}
