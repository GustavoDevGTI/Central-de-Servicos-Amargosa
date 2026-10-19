import { runtimeCatalog } from "../../../lib/runtime-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runtimeCatalog();
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Catálogo indisponível" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
