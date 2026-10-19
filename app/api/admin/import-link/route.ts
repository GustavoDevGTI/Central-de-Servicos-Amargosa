import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { draftCatalog } from "../../../../lib/catalog-draft";
import { downloadOfficialCatalog } from "../../../../lib/catalog-link-download";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida" }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado" }, 401);
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > 4096) return adminResponse({ error: "Link inválido" }, 413);
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 2048) return adminResponse({ error: "Informe o link da planilha oficial." }, 400);
    const bytes = await downloadOfficialCatalog(body.url);
    return adminResponse(await draftCatalog(bytes, "Catalogo_Servicos_Amargosa-SharePoint.xlsx", session.user.id));
  } catch (error) {
    return adminResponse({ error: error instanceof Error ? error.message : "Falha ao importar o link" }, 400);
  }
}
