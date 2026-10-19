import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const base = process.env.BETTER_AUTH_URL;
if (!base || !["localhost", "127.0.0.1"].includes(new URL(base).hostname) || process.env.LOCAL_ADMIN_SEED !== "true") throw new Error("Use somente o admin local de testes.");
const suffix = Date.now().toString(36);
const fixtures = [];
async function login(username, password, expected = 200) {
  let response;
  for (let attempt = 0; attempt < 4; attempt++) {
    response = await fetch(`${base}/api/auth/sign-in/username`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (response.status !== 429) break;
    const seconds = Math.min(10, Math.max(1, Number(response.headers.get("retry-after")) || 10));
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
  assert.equal(response.status, expected, `login HTTP ${response.status}`);
  return { Origin: base, Cookie: response.headers.getSetCookie().map((part) => part.split(";", 1)[0]).join("; ") };
}
async function request(path, headers, body, expected = 200) {
  const response = await fetch(`${base}${path}`, { headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { method: "POST", body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(result)}`);
  return result;
}
const rootHeaders = await login(process.env.LOCAL_ADMIN_USERNAME, process.env.LOCAL_ADMIN_PASSWORD);
const before = await request("/api/catalog");
const root = await request("/api/admin/session", rootHeaders);
assert.equal(root.user.role, "admin");
assert.equal(root.canManageUsers, true);
const rootUser = (await request("/api/admin/users", rootHeaders)).users.find((user) => user.id === root.user.id);
assert.ok(rootUser);
try {
  await request("/api/admin/users", undefined, undefined, 401);
  await request("/api/admin/diagnostics", undefined, undefined, 401);
  const account = { name: "Teste de permissões", username: `qa_roles_${suffix}`, email: `qa_roles_${suffix}@local.test`, role: "catalog_admin", password: randomUUID().slice(0, 6) };
  for (const password of ["a".repeat(5), "a".repeat(13)]) await request("/api/admin/users", rootHeaders, { action: "create", ...account, password }, 400);
  const created = await request("/api/admin/users", rootHeaders, { action: "create", ...account });
  fixtures.push({ id: created.userId, email: account.email });
  await request("/api/admin/users", rootHeaders, { action: "create", ...account }, 409);
  await request("/api/admin/users", rootHeaders, { action: "create", ...account, role: "superadmin" }, 400);
  const catalogHeaders = await login(account.username, account.password);
  const catalogSession = await request("/api/admin/session", catalogHeaders);
  assert.equal(catalogSession.user.role, "catalog_admin");
  assert.equal(catalogSession.canManageUsers, false);
  await request("/api/admin/history", catalogHeaders);
  await request("/api/admin/publish", catalogHeaders, { draftId: "invalid" }, 400);
  await request("/api/admin/restore", catalogHeaders, { versionId: 0 }, 400);
  const diagnostics = await request("/api/admin/diagnostics", catalogHeaders);
  assert.ok(diagnostics.embedUrl.includes("/embed/reporting/cb3e0220-2d9e-414f-abca-f233214379d9/page/n257F"));
  await request("/api/admin/users", catalogHeaders, undefined, 403);
  for (const action of ["create", "update", "status", "password"]) await request("/api/admin/users", catalogHeaders, { action, userId: root.user.id, role: "admin", active: false }, 403);
  for (const path of ["/api/auth/admin/set-role", "/api/auth/%61dmin/set-role", "/api/auth/update-user"]) await request(path, catalogHeaders, { userId: created.userId, role: "admin" }, 403);
  await request("/api/auth/admin/set-role", rootHeaders, { userId: root.user.id, role: "catalog_admin" }, 403);
  await request("/api/admin/users", rootHeaders, { action: "status", userId: root.user.id, active: false }, 400);
  await request("/api/admin/users", rootHeaders, { action: "update", userId: root.user.id, ...rootUser, role: "catalog_admin" }, 400);
  await request("/api/admin/users", { Cookie: rootHeaders.Cookie }, { action: "status", userId: created.userId, active: false }, 403);
  const { password: initialPassword, ...profile } = account;
  const revised = { ...profile, name: "Teste de permissões revisado" };
  await request("/api/admin/users", rootHeaders, { action: "update", userId: created.userId, ...revised });
  const found = await request(`/api/admin/users?q=${account.username}`, rootHeaders);
  assert.equal(found.total, 1);
  assert.equal(found.users[0].name, revised.name);
  await Promise.all(Array.from({ length: 12 }, (_, index) => request("/api/admin/users", rootHeaders, { action: "update", userId: created.userId, ...revised, name: `${revised.name} ${index}` })));
  for (const password of ["a".repeat(5), "a".repeat(13)]) await request("/api/admin/users", rootHeaders, { action: "password", userId: created.userId, password }, 400);
  await request("/api/admin/session", catalogHeaders);
  const newPassword = randomUUID().slice(0, 12);
  await request("/api/admin/users", rootHeaders, { action: "password", userId: created.userId, password: newPassword });
  await request("/api/admin/diagnostics", catalogHeaders, undefined, 401);
  await login(account.username, initialPassword, 401);
  const renewed = await login(account.username, newPassword);
  await request("/api/admin/users", rootHeaders, { action: "status", userId: created.userId, active: false });
  await request("/api/admin/session", renewed, undefined, 401);
  await login(account.username, newPassword, 403);
  await request("/api/admin/users", rootHeaders, { action: "status", userId: created.userId, active: true });
  const activeAgain = await login(account.username, newPassword);
  await request("/api/admin/diagnostics", activeAgain);
  await request("/api/admin/users", rootHeaders, { action: "update", userId: created.userId, ...revised, role: "admin" });
  await request("/api/admin/session", activeAgain, undefined, 401);
  const managerHeaders = await login(account.username, newPassword);
  await request("/api/admin/users", managerHeaders);
  const another = { name: "Segundo teste de permissões", username: `qa_second_${suffix}`, email: `qa_second_${suffix}@local.test`, role: "catalog_admin", password: randomUUID().slice(0, 12) };
  const second = await request("/api/admin/users", managerHeaders, { action: "create", ...another });
  fixtures.push({ id: second.userId, email: another.email });
  const signOut = await fetch(`${base}/api/auth/sign-out`, { method: "POST", headers: { ...managerHeaders, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(signOut.status, 200);
  await request("/api/admin/users", managerHeaders, undefined, 401);
  assert.equal((await request("/api/catalog")).version, before.version);
  console.log(JSON.stringify({ profiles: 2, passwordBoundariesChecked: [5, 6, 12, 13], diagnosticsForBoth: true, catalogCannotManageUsers: true, directEscalationBlocked: true, selfLockoutBlocked: true, concurrentUpdates: 12, passwordResetRevokesSessions: true, deactivationRevokesSessions: true, promotionVerified: true, catalogVersionUnchanged: before.version }));
} finally {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const fixture of fixtures) {
      const target = await pool.query('SELECT id FROM "user" WHERE id = $1 AND email = $2', [fixture.id, fixture.email]);
      assert.equal(target.rowCount, 1);
      assert.equal((await pool.query("SELECT 1 FROM catalog_publications WHERE published_by = $1", [fixture.id])).rowCount, 0);
      await pool.query('DELETE FROM "session" WHERE "userId" = $1', [fixture.id]);
      await pool.query('DELETE FROM "account" WHERE "userId" = $1', [fixture.id]);
      await pool.query('DELETE FROM "user" WHERE id = $1 AND email = $2', [fixture.id, fixture.email]);
    }
  } finally { await pool.end(); }
}
