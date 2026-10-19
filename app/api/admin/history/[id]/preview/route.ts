import { adminResponse, adminSession } from "../../../../../../lib/admin-session";
import { catalogPool, initializeCatalogDatabase, type CatalogSnapshot } from "../../../../../../lib/catalog-db";
import { snapshotServices } from "../../../../../../lib/catalog-preview";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado" }, 401);
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return adminResponse({ error: "Versão inválida" }, 400);
    await initializeCatalogDatabase();
    const result = await catalogPool().query<{ id: string; snapshot: CatalogSnapshot; active: boolean }>(
      `SELECT id, snapshot, EXISTS (SELECT 1 FROM catalog_active a WHERE a.singleton = true AND a.publication_id = p.id) AS active
       FROM catalog_publications p WHERE id <= $1 ORDER BY id DESC LIMIT 2`, [id],
    );
    const [version, previous] = result.rows;
    if (!version || version.id !== id) return adminResponse({ error: "Versão não encontrada" }, 404);
    return adminResponse({
      versionId: version.id,
      active: version.active,
      previousVersionId: previous?.id ?? null,
      services: snapshotServices(version.snapshot),
      previousServices: previous ? snapshotServices(previous.snapshot) : [],
    });
  } catch {
    return adminResponse({ error: "Não foi possível carregar as páginas desta versão." }, 503);
  }
}
