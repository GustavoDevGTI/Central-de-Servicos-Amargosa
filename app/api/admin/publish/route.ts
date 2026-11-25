import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { initializeCatalogDatabase, withCatalogTransaction, type CatalogReport, type CatalogSnapshot } from "../../../../lib/catalog-db";
import { publishCatalogSnapshot } from "../../../../lib/catalog-publication";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida" }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado" }, 401);
    const body = await request.json() as { draftId?: string };
    if (!body.draftId || !/^[0-9a-f-]{36}$/i.test(body.draftId)) return adminResponse({ error: "Prévia inválida" }, 400);
    await initializeCatalogDatabase();
    const published = await withCatalogTransaction(async (db) => {
      await db.query("SELECT pg_advisory_xact_lock(41730521)");
      const current = await db.query<{ publication_id: string }>("SELECT publication_id FROM catalog_active WHERE singleton = true FOR UPDATE");
      const draft = await db.query<{
        base_publication_id: string | null; source_sha256: string; source_file: Buffer;
        source_filename: string; snapshot: CatalogSnapshot; report: CatalogReport; created_by: string;
      }>("SELECT * FROM catalog_drafts WHERE id = $1 FOR UPDATE", [body.draftId]);
      const item = draft.rows[0];
      if (!item || item.created_by !== session.user.id) throw new Error("Prévia não encontrada");
      if (item.snapshot.mode !== "direct") throw new Error("Esta prévia antiga não pode ser salva. Abra o serviço no editor e compare novamente.");
      if (Number(item.base_publication_id || 0) !== Number(current.rows[0]?.publication_id || 0)) {
        throw new Error("O catálogo mudou depois da comparação. Recarregue o serviço e compare novamente.");
      }
      if (item.report.blockers.length) throw new Error("Resolva as pendências indicadas antes de publicar.");
      if (!item.report.changes.length) throw new Error("Nenhuma alteração para publicar.");
      const id = await publishCatalogSnapshot(db, item.snapshot, item.report, session.user.id, item.source_filename);
      await db.query("DELETE FROM catalog_drafts WHERE id = $1", [body.draftId]);
      return id;
    });
    return adminResponse({ published: true, version: published });
  } catch (error) {
    return adminResponse({ error: error instanceof Error ? error.message : "Falha ao publicar" }, 400);
  }
}
