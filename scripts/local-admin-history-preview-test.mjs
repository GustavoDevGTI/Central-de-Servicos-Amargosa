import assert from "node:assert/strict";

const base = process.env.BETTER_AUTH_URL;
if (!base || !["127.0.0.1", "localhost"].includes(new URL(base).hostname) || process.env.LOCAL_ADMIN_SEED !== "true") {
  throw new Error("Use somente o admin local de testes.");
}
const login = await fetch(`${base}/api/auth/sign-in/username`, {
  method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ username: process.env.LOCAL_ADMIN_USERNAME, password: process.env.LOCAL_ADMIN_PASSWORD }),
});
assert.equal(login.status, 200);
const headers = { Cookie: login.headers.getSetCookie().map((part) => part.split(";", 1)[0]).join("; ") };
const history = async () => (await (await fetch(`${base}/api/admin/history`, { headers })).json()).versions;
const versions = await history();
assert.ok(versions.length);
const currentBefore = await (await fetch(`${base}/api/catalog`)).json();
const preview = async (id) => {
  const response = await fetch(`${base}/api/admin/history/${id}/preview`, { headers });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(body.active, versions.find((version) => String(version.id) === String(id)).active);
  return body;
};
const newest = await preview(versions[0].id);
assert.equal(newest.versionId, String(versions[0].id));
assert.equal(newest.previousVersionId, versions[1] ? String(versions[1].id) : null);
const oldest = await preview(versions.at(-1).id);
assert.equal(oldest.previousVersionId, null);
assert.deepEqual(oldest.previousServices, []);
for (const [index, version] of versions.entries()) {
  if (!version.reverted_from) continue;
  const restored = await preview(version.id);
  assert.equal(restored.previousVersionId, versions[index + 1] ? String(versions[index + 1].id) : null);
}
const previous = versions[1] && await preview(versions[1].id);
if (previous) assert.deepEqual(newest.previousServices, previous.services);
for (const service of newest.services.filter((entry) => !entry.inactive).slice(0, 1)) {
  const response = await fetch(`${base}/admin/history/${newest.versionId}/${service.slug || service.id}`, { headers });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes(`Histórico privado · versão ${newest.versionId}`));
}
assert.equal((await fetch(`${base}/api/admin/history/${newest.versionId}/preview`)).status, 401);
for (const id of ["0", "invalid", "999999999999999999999999"]) {
  assert.equal((await fetch(`${base}/api/admin/history/${id}/preview`, { headers })).status, 400);
}
assert.equal((await fetch(`${base}/api/admin/history/9007199254740991/preview`, { headers })).status, 404);
assert.deepEqual(await history(), versions);
assert.deepEqual(await (await fetch(`${base}/api/catalog`)).json(), currentBefore);
console.log(JSON.stringify({ versionsChecked: versions.length, previousSnapshotMatches: !!previous, privateAccess: true, activeCatalogUnchanged: true }));
