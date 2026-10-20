import { adminResponse, adminSession } from "../../../../lib/admin-session";
import { catalogPool, initializeCatalogDatabase } from "../../../../lib/catalog-db";
import { CATALOG_HISTORY_LIMIT } from "../../../../lib/catalog-history";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado" }, 401);
    await initializeCatalogDatabase();
    const result = await catalogPool().query(
      `SELECT p.id, p.source_filename, p.source_sha256, p.published_at, p.published_by,
        u.name AS author_name, u.username AS author_username, p.report, p.reverted_from, p.id = a.publication_id AS active
       FROM catalog_publications p LEFT JOIN "user" u ON u.id = p.published_by
       CROSS JOIN catalog_active a ORDER BY p.id DESC LIMIT $1`, [CATALOG_HISTORY_LIMIT],
    );
    return adminResponse({ versions: result.rows });
  } catch {
    return adminResponse({ error: "Histórico indisponível" }, 503);
  }
}
