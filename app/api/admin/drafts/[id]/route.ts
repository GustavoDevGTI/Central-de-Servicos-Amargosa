import { adminResponse, adminSession } from "../../../../../lib/admin-session";
import { catalogPool, initializeCatalogDatabase, type CatalogSnapshot } from "../../../../../lib/catalog-db";
import { snapshotServices } from "../../../../../lib/catalog-preview";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado" }, 401);
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return adminResponse({ error: "Prévia inválida" }, 400);
    await initializeCatalogDatabase();
    const result = await catalogPool().query<{ snapshot: CatalogSnapshot }>(
      "SELECT snapshot FROM catalog_drafts WHERE id = $1 AND created_by = $2", [id, session.user.id],
    );
    const item = result.rows[0];
    if (!item) return adminResponse({ error: "Prévia não encontrada. Analise a planilha novamente." }, 404);
    return adminResponse({ services: snapshotServices(item.snapshot).filter((service) => !service.inactive) });
  } catch {
    return adminResponse({ error: "Não foi possível carregar a prévia." }, 503);
  }
}
