import type { PoolClient } from "pg";

export const CATALOG_HISTORY_LIMIT = 20;

/** Run inside the same transaction/advisory lock used for publication. */
export async function pruneCatalogHistory(db: PoolClient) {
  const retained = await db.query<{ id: string }>(
    `SELECT p.id FROM catalog_publications p
     WHERE p.id IN (SELECT publication_id FROM catalog_active WHERE singleton = true)
       OR jsonb_array_length(CASE WHEN jsonb_typeof(p.report->'changes') = 'array'
          THEN p.report->'changes' ELSE '[]'::jsonb END) > 0
     ORDER BY p.id IN (SELECT publication_id FROM catalog_active WHERE singleton = true) DESC, p.id DESC
     LIMIT $1`, [CATALOG_HISTORY_LIMIT],
  );
  const ids = retained.rows.map((row) => row.id);
  await db.query(`DELETE FROM catalog_changes WHERE publication_id IN
    (SELECT id FROM catalog_publications WHERE NOT (id = ANY($1::bigint[])))`, [ids]);
  await db.query("DELETE FROM catalog_publications WHERE NOT (id = ANY($1::bigint[]))", [ids]);
}
