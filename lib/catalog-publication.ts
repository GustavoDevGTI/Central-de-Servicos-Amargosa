import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { CatalogReport, CatalogSnapshot } from "./catalog-db";
import { pruneCatalogHistory } from "./catalog-history";

/** The caller holds the catalog publication lock inside a transaction. */
export async function publishCatalogSnapshot(db: PoolClient, snapshot: CatalogSnapshot, report: CatalogReport, userId: string, filename: string) {
  const bytes = Buffer.from(JSON.stringify(snapshot));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const result = await db.query<{ id: string }>(
    `INSERT INTO catalog_publications
      (source_sha256, source_file, source_filename, snapshot, report, published_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [hash, bytes, filename, bytes.toString("utf8"), JSON.stringify(report), userId],
  );
  const id = Number(result.rows[0].id);
  for (const change of report.changes) {
    await db.query(
      `INSERT INTO catalog_changes (publication_id, service_id, service_title, kind,
        column_name, before_value, after_value, source_row)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, change.serviceId, change.serviceTitle, change.kind, change.column || null,
        change.before === undefined ? null : JSON.stringify(change.before),
        change.after === undefined ? null : JSON.stringify(change.after), change.sourceRow || null],
    );
  }
  await db.query(`INSERT INTO catalog_active (singleton, publication_id) VALUES (true,$1)
    ON CONFLICT (singleton) DO UPDATE SET publication_id = EXCLUDED.publication_id`, [id]);
  await pruneCatalogHistory(db);
  return id;
}
