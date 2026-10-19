import { adminResponse, adminSession } from "../../../../../lib/admin-session";
import { catalogPool, initializeCatalogDatabase } from "../../../../../lib/catalog-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado" }, 401);
    const { id } = await params;
    if (!/^\d+$/.test(id)) return adminResponse({ error: "Versão inválida" }, 400);
    await initializeCatalogDatabase();
    const version = await catalogPool().query(
      `SELECT id, source_filename, source_sha256, published_at, published_by, report, reverted_from
       FROM catalog_publications WHERE id = $1`, [id],
    );
    if (!version.rows[0]) return adminResponse({ error: "Versão não encontrada" }, 404);
    const changes = await catalogPool().query(
      `SELECT service_id, service_title, kind, column_name, before_value, after_value, source_row
       FROM catalog_changes WHERE publication_id = $1 ORDER BY id`, [id],
    );
    return adminResponse({ version: version.rows[0], changes: changes.rows });
  } catch {
    return adminResponse({ error: "Histórico indisponível" }, 503);
  }
}
