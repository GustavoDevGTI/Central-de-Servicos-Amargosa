import assert from "node:assert/strict";
import { catalogPool } from "../lib/catalog-db";
import { CATALOG_HISTORY_LIMIT, pruneCatalogHistory } from "../lib/catalog-history";

if (process.env.LOCAL_ADMIN_SEED !== "true" || !["localhost", "127.0.0.1"].includes(new URL(process.env.BETTER_AUTH_URL || "http://invalid").hostname)) throw new Error("Use somente o banco local de testes.");
const client = await catalogPool().connect();
try {
  await client.query("BEGIN");
  // Temporary tables shadow the real catalog on this connection only. No real
  // publication, active pointer, sequence or uploaded workbook is changed.
  await client.query(`
    CREATE TEMP TABLE catalog_publications (id bigint PRIMARY KEY, report jsonb NOT NULL, source_file bytea, reverted_from bigint) ON COMMIT DROP;
    CREATE TEMP TABLE catalog_active (singleton boolean PRIMARY KEY, publication_id bigint REFERENCES catalog_publications(id)) ON COMMIT DROP;
    CREATE TEMP TABLE catalog_changes (id bigint PRIMARY KEY, publication_id bigint REFERENCES catalog_publications(id)) ON COMMIT DROP;
  `);
  for (const activeId of [27, 1, 26]) {
    await client.query("TRUNCATE catalog_changes, catalog_active, catalog_publications");
    for (let id = 1; id <= 27; id++) {
      await client.query("INSERT INTO catalog_publications VALUES ($1,$2,$3,$4)", [id, JSON.stringify({ changes: id === 26 ? [] : [{ kind: "updated" }] }), Buffer.from(`arquivo-${id}`), id === 27 ? 1 : null]);
      await client.query("INSERT INTO catalog_changes VALUES ($1,$1)", [id]);
    }
    await client.query("INSERT INTO catalog_active VALUES (true,$1)", [activeId]);
    await pruneCatalogHistory(client);
    const retained = await client.query<{ id: string; source_file: Buffer; reverted_from: string | null }>("SELECT id, source_file, reverted_from FROM catalog_publications ORDER BY id DESC");
    assert.equal(retained.rows.length, CATALOG_HISTORY_LIMIT);
    assert.ok(retained.rows.some((row) => Number(row.id) === activeId));
    if (activeId !== 26) assert.ok(!retained.rows.some((row) => Number(row.id) === 26));
    const changes = await client.query<{ publication_id: string }>("SELECT publication_id FROM catalog_changes");
    assert.equal(changes.rows.length, CATALOG_HISTORY_LIMIT);
    assert.deepEqual(changes.rows.map((row) => row.publication_id).sort(), retained.rows.map((row) => row.id).sort());
    assert.equal((await client.query("SELECT publication_id FROM catalog_active")).rows[0].publication_id, String(activeId));
    assert.ok(retained.rows.every((row) => row.source_file.toString() === `arquivo-${row.id}`));
    if (activeId === 27) {
      assert.equal(retained.rows.at(-1)!.id, "7");
      assert.equal(retained.rows[0].reverted_from, "1");
      assert.ok(!retained.rows.some((row) => row.id === "1"));
    }
    await pruneCatalogHistory(client);
    assert.equal((await client.query("SELECT count(*)::int AS total FROM catalog_publications")).rows[0].total, CATALOG_HISTORY_LIMIT);
  }
  await client.query("TRUNCATE catalog_changes, catalog_active, catalog_publications");
  await client.query(`INSERT INTO catalog_publications VALUES (1,'{"changes":[]}',NULL,NULL), (2,'{"changes":null}',NULL,NULL), (3,'{}',NULL,NULL)`);
  await client.query("INSERT INTO catalog_active VALUES (true,1)");
  await pruneCatalogHistory(client);
  assert.deepEqual((await client.query("SELECT id FROM catalog_publications")).rows.map((row) => row.id), ["1"]);
  console.log(JSON.stringify({ limit: CATALOG_HISTORY_LIMIT, oldestDeleted: true, emptyEditionsDiscarded: true, restorationOriginPreserved: true, activeProtected: true, changeRowsCleaned: true, realCatalogUnchanged: true }));
} finally {
  await client.query("ROLLBACK");
  client.release();
  await catalogPool().end();
}
