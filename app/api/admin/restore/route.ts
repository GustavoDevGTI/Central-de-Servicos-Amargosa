import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { initializeCatalogDatabase, withCatalogTransaction, type CatalogSnapshot } from "../../../../lib/catalog-db";
import { compareCatalogSnapshots } from "../../../../lib/catalog-import";
import { pruneCatalogHistory } from "../../../../lib/catalog-history";
import { restoreServiceContent } from "../../../../lib/service-editor";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida" }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado" }, 401);
    const { versionId } = await request.json() as { versionId?: number };
    if (!Number.isSafeInteger(versionId) || Number(versionId) <= 0) return adminResponse({ error: "Versão inválida" }, 400);
    await initializeCatalogDatabase();
    const newId = await withCatalogTransaction(async (db) => {
      await db.query("SELECT pg_advisory_xact_lock(41730521)");
      const active = await db.query<{ id: string; snapshot: CatalogSnapshot }>(
        `SELECT p.id, p.snapshot FROM catalog_active a JOIN catalog_publications p
         ON p.id = a.publication_id WHERE a.singleton = true FOR UPDATE`,
      );
      const target = await db.query<{
        id: string; source_sha256: string; source_file: Buffer; source_filename: string; snapshot: CatalogSnapshot;
      }>("SELECT id, source_sha256, source_file, source_filename, snapshot FROM catalog_publications WHERE id = $1", [versionId]);
      if (!active.rows[0] || !target.rows[0]) throw new Error("Versão não encontrada");
      if (Number(active.rows[0].id) === versionId) throw new Error("Esta versão já está ativa");
      const restoredSnapshot = restoreServiceContent(active.rows[0].snapshot, target.rows[0].snapshot);
      const report = compareCatalogSnapshots(active.rows[0].snapshot, restoredSnapshot);
      if (!report.changes.length) return { version: Number(active.rows[0].id), identical: true };
      const result = await db.query<{ id: string }>(
        `INSERT INTO catalog_publications
         (source_sha256, source_file, source_filename, snapshot, report, published_by, reverted_from)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [createHash("sha256").update(JSON.stringify(restoredSnapshot)).digest("hex"), Buffer.from(JSON.stringify(restoredSnapshot)), `Restauração de conteúdo · versão ${versionId}`,
          JSON.stringify(restoredSnapshot), JSON.stringify(report), session.user.id, versionId],
      );
      const id = Number(result.rows[0].id);
      for (const change of report.changes) {
        await db.query(
          `INSERT INTO catalog_changes (publication_id, service_id, service_title, kind,
           column_name, before_value, after_value, source_row) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [id, change.serviceId, change.serviceTitle, change.kind, change.column || null,
            change.before === undefined ? null : JSON.stringify(change.before),
            change.after === undefined ? null : JSON.stringify(change.after), change.sourceRow || null],
        );
      }
      await db.query("UPDATE catalog_active SET publication_id = $1 WHERE singleton = true", [id]);
      await pruneCatalogHistory(db);
      return { version: id, identical: false };
    });
    return adminResponse({ restored: !newId.identical, ...newId });
  } catch (error) {
    return adminResponse({ error: error instanceof Error ? error.message : "Falha ao restaurar" }, 400);
  }
}
