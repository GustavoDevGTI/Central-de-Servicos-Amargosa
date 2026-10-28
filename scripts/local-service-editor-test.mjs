import assert from "node:assert/strict";
import { Pool } from "pg";
import { randomBytes } from "node:crypto";

const base = process.env.BETTER_AUTH_URL;
const database = new URL(process.env.DATABASE_URL || "http://invalid");
if (!base || !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  !["localhost", "127.0.0.1", process.env.QA_DATABASE_HOST].includes(database.hostname) ||
  !/^\/central_direct_editor_qa_[a-z0-9_]+$/.test(database.pathname) ||
  process.env.LOCAL_ADMIN_SEED !== "true" || process.env.QA_DISPOSABLE_DATABASE !== "true") throw new Error("Use somente o banco local descartável dedicado ao editor.");

const pool = new Pool({ connectionString: database.href });
async function login(username, password) {
  const response = await fetch(base + "/api/auth/sign-in/username", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
  assert.equal(response.status, 200, "Login local");
  return { Origin: base, Cookie: response.headers.getSetCookie().map((p) => p.split(";", 1)[0]).join("; ") };
}
let owner;
async function request(path, body, headers = owner, expected = 200) {
  const response = await fetch(base + path, { headers: { ...headers, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) }, ...(body !== undefined ? { method: "POST", body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(result).slice(0, 240)}`);
  return result;
}
const fixed = (s) => ({ id: s.id, slug: s.slug, url: s.url, requestSystem: s.requestSystem, requestLabel: s.requestLabel, noticeAction: s.noticeAction, inactive: Boolean(s.inactive) });
try {
  owner = await login(process.env.LOCAL_ADMIN_USERNAME, process.env.LOCAL_ADMIN_PASSWORD);
  assert.equal((await request("/api/admin/history")).versions.length, 0, "O banco deve estar vazio.");
  await request("/api/admin/services", undefined, {}, 401);
  const initial = await request("/api/catalog", undefined, {});
  const list = await request("/api/admin/services");
  assert.equal(list.services.length, initial.services.length);
  const mirrors = initial.services.filter((s) => s.sourceRow === 22);
  assert.equal(mirrors.length, 3);
  const selected = await request(`/api/admin/services/${mirrors[0].id}`);
  const edit = (fields, baseVersion = selected.version) => ({ serviceId: mirrors[0].id, baseVersion, fields });
  await request("/api/admin/services", edit({ url: "https://invalid.example" }), owner, 400);
  await request("/api/admin/services", edit({ summary: "Mudança recusada" }), { ...owner, Origin: "https://invalid.example" }, 403);
  const oversized = await fetch(base + "/api/admin/services", { method: "POST", headers: { ...owner, "Content-Type": "application/json" }, body: JSON.stringify(edit({ summary: "x".repeat(140000) })) });
  assert.equal(oversized.status, 413);
  for (const path of ["upload", "import-link"]) await request(`/api/admin/${path}`, {}, owner, 410);
  await request("/api/admin/source", undefined, owner, 410);
  assert.equal((await request("/api/admin/services", edit({ summary: selected.service.fields.summary }))).identical, true);
  assert.equal((await request("/api/admin/history")).versions.length, 0);
  const draft = await request("/api/admin/services", edit({ summary: "Descrição revisada na conferência local.", cost: "Taxa conforme regulamento." }));
  assert.equal(draft.report.updated, 1);
  assert.equal(draft.report.changes.length, 2);
  assert.equal(draft.affectedIds.length, 3);
  assert.deepEqual((await request("/api/catalog", undefined, {})).services, initial.services, "Comparar não publica");
  const before = await request(`/api/admin/drafts/${draft.draftId}?view=before`);
  const after = await request(`/api/admin/drafts/${draft.draftId}`);
  for (const original of mirrors) {
    const preview = after.services.find((s) => s.id === original.id);
    assert.equal(preview.summary, "Descrição revisada na conferência local.");
    assert.deepEqual(fixed(preview), fixed(original));
    assert.equal(before.services.find((s) => s.id === original.id).summary, original.summary);
  }
  const catalogPassword = randomBytes(6).toString("hex");
  await request("/api/admin/users", { action: "create", name: "Editor de conferência", email: "editorqa@example.invalid", username: "editorqa", password: catalogPassword, role: "catalog_admin" });
  const catalogUser = await login("editorqa", catalogPassword);
  await request("/api/admin/services", undefined, catalogUser);
  await request(`/api/admin/drafts/${draft.draftId}`, undefined, catalogUser, 404);
  await request("/api/admin/publish", { draftId: draft.draftId }, catalogUser, 400);
  const stale = await request("/api/admin/services", edit({ cost: "Comparação concorrente" }), catalogUser);
  const first = await request("/api/admin/publish", { draftId: draft.draftId });
  const published = await request("/api/catalog", undefined, {});
  for (const original of mirrors) {
    const service = published.services.find((s) => s.id === original.id);
    assert.equal(service.summary, "Descrição revisada na conferência local.");
    assert.deepEqual(fixed(service), fixed(original));
    const page = await fetch(`${base}/servicos/${service.slug}`);
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes("Descrição revisada na conferência local."));
  }
  let history = await request("/api/admin/history");
  assert.equal(history.versions.length, 1);
  assert.ok(history.versions[0].author_name);
  assert.ok(history.versions[0].author_username);
  await request("/api/admin/publish", { draftId: stale.draftId }, catalogUser, 400);
  await request("/api/admin/services", edit({ summary: "Versão antiga" }), owner, 409);
  const loaded = await request(`/api/admin/services/${mirrors[0].id}`, undefined, catalogUser);
  const nextDraft = await request("/api/admin/services", edit({ summary: "Segunda descrição para conferir restauração." }, loaded.version), catalogUser);
  await request("/api/admin/publish", { draftId: nextDraft.draftId }, catalogUser);
  assert.equal((await request("/api/admin/restore", { versionId: first.version })).restored, true);
  assert.equal((await request(`/api/admin/services/${mirrors[0].id}`)).service.fields.summary, "Descrição revisada na conferência local.");
  assert.equal((await request("/api/admin/restore", { versionId: first.version })).identical, true);
  assert.equal((await request("/api/admin/history")).versions.length, 3);
  for (let i = 0; i < 20; i++) {
    const current = await request(`/api/admin/services/${mirrors[0].id}`);
    const draft = await request("/api/admin/services", edit({ summary: `Edição local de retenção ${i}.` }, current.version));
    await request("/api/admin/publish", { draftId: draft.draftId });
  }
  history = await request("/api/admin/history");
  assert.equal(history.versions.length, 20);
  assert.equal(history.versions.filter((v) => v.active).length, 1);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM catalog_publications")).rows[0].n, 20);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM catalog_changes c LEFT JOIN catalog_publications p ON p.id=c.publication_id WHERE p.id IS NULL")).rows[0].n, 0);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM catalog_publications WHERE id=$1", [first.version])).rows[0].n, 0);
  const active = (await pool.query("SELECT p.snapshot FROM catalog_publications p JOIN catalog_active a ON a.publication_id=p.id")).rows[0].snapshot;
  assert.deepEqual(active.rows["22"].cells, mirrors[0].workbookCells);
  console.log(JSON.stringify({ authenticatedDirectEditing: true, privateComparison: true, mirrors: 3, protectedActions: true, staleComparisonRejected: true, catalogAdminAllowed: true, draftOwnership: true, authorship: true, restored: true, meaningfulHistoryOnly: true, retained: 20, sourcePreserved: true }));
} finally { await pool.end(); }
