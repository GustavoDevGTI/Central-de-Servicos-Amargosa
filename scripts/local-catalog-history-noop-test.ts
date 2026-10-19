import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { catalogPool } from "../lib/catalog-db";

const base = process.env.BETTER_AUTH_URL;
if (!base || !["localhost", "127.0.0.1"].includes(new URL(base).hostname) || process.env.LOCAL_ADMIN_SEED !== "true") throw new Error("Use somente o admin local de testes.");
const pool = catalogPool();
const draftId = randomUUID();
try {
  const login = await fetch(`${base}/api/auth/sign-in/username`, {
    method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ username: process.env.LOCAL_ADMIN_USERNAME, password: process.env.LOCAL_ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  const headers = { Origin: base, "Content-Type": "application/json", Cookie: login.headers.getSetCookie().map((part) => part.split(";", 1)[0]).join("; ") };
  const session = await (await fetch(`${base}/api/admin/session`, { headers })).json() as { user: { id: string } };
  const history = async () => (await (await fetch(`${base}/api/admin/history`, { headers })).json() as { versions: unknown[] }).versions;
  const before = await history();
  const currentBefore = await (await fetch(`${base}/api/catalog`)).json() as { version: number; services: unknown[] };
  // An empty report is deliberately inserted as a disposable draft to exercise
  // the server guard, independently of the UI's disabled publication button.
  const draft = await pool.query(`INSERT INTO catalog_drafts
    (id, base_publication_id, source_sha256, source_file, source_filename, snapshot, report, created_by)
    SELECT $1, p.id, p.source_sha256, p.source_file, p.source_filename, p.snapshot,
      '{"created":0,"updated":0,"deactivated":0,"reactivated":0,"columnsAdded":[],"blockers":[],"changes":[]}'::jsonb, $2
    FROM catalog_publications p JOIN catalog_active a ON a.publication_id = p.id
    WHERE a.singleton = true`, [draftId, session.user.id]);
  assert.equal(draft.rowCount, 1);
  const publish = await fetch(`${base}/api/admin/publish`, { method: "POST", headers, body: JSON.stringify({ draftId }) });
  assert.equal(publish.status, 400);
  assert.equal((await publish.json() as { error: string }).error, "Nenhuma alteração para publicar.");

  // Restore only a byte-for-byte identical snapshot. No differing catalog is
  // ever published by this test, even if the local data has changed since setup.
  const same = await pool.query<{ id: string }>(`SELECT p.id FROM catalog_publications p
    JOIN catalog_publications active ON p.snapshot = active.snapshot
    JOIN catalog_active a ON a.publication_id = active.id AND a.singleton = true
    WHERE p.id <> active.id ORDER BY p.id DESC LIMIT 1`);
  if (same.rows[0]) {
    const restore = await fetch(`${base}/api/admin/restore`, { method: "POST", headers, body: JSON.stringify({ versionId: Number(same.rows[0].id) }) });
    assert.equal(restore.status, 200);
    assert.deepEqual(await restore.json(), { restored: false, version: currentBefore.version, identical: true });
  }
  assert.deepEqual(await history(), before);
  assert.deepEqual(await (await fetch(`${base}/api/catalog`)).json(), currentBefore);
  console.log(JSON.stringify({ emptyPublicationRejected: true, identicalRestorationChecked: !!same.rows[0], historyUnchanged: true, activeCatalogUnchanged: true }));
} finally {
  await pool.query("DELETE FROM catalog_drafts WHERE id = $1", [draftId]);
  await pool.end();
}
