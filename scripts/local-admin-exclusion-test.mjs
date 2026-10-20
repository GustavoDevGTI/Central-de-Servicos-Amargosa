import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { Pool } from "pg";

const base = process.env.BETTER_AUTH_URL;
const database = process.env.DATABASE_URL;
const source = process.argv[2];
const local = (url) => ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
if (!base || !database || !local(base) || !local(database) || !source || process.env.LOCAL_ADMIN_SEED !== "true" || process.env.QA_DISPOSABLE_DATABASE !== "true") {
  throw new Error("Use somente uma stack local descartável e informe o XLSX oficial.");
}
const login = await fetch(`${base}/api/auth/sign-in/username`, {
  method: "POST", headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ username: process.env.LOCAL_ADMIN_USERNAME, password: process.env.LOCAL_ADMIN_PASSWORD }),
});
assert.equal(login.status, 200);
const headers = { Origin: base, Cookie: login.headers.getSetCookie().map((part) => part.split(";", 1)[0]).join("; ") };
async function request(path, body) {
  const r = await fetch(base + path, { headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { method: "POST", body: JSON.stringify(body) } : {}) });
  const result = await r.json();
  assert.equal(r.status, 200, `${path}: ${JSON.stringify(result)}`);
  return result;
}
async function upload(bytes) {
  const form = new FormData();
  form.append("file", new Blob([bytes]), "catalogo-qa.xlsx");
  const r = await fetch(`${base}/api/admin/upload`, { method: "POST", headers, body: form });
  const result = await r.json();
  assert.equal(r.status, 200, JSON.stringify(result));
  assert.deepEqual(result.report.blockers, []);
  return result;
}
async function routeStatuses(slugs, status) {
  const actual = await Promise.all(slugs.map((slug) => fetch(`${base}/servicos/${slug}`).then((r) => r.status)));
  assert.deepEqual(actual, slugs.map(() => status));
}
const pool = new Pool({ connectionString: database });
try {
  assert.equal((await request("/api/admin/history")).versions.length, 0, "Use um banco descartável vazio.");
  const original = await readFile(source);
  const initial = await request("/api/admin/publish", { draftId: (await upload(original)).draftId });
  const catalog = await request("/api/catalog");
  const mirrors = catalog.services.filter((s) => s.sourceRow === 22);
  assert.equal(mirrors.length, 3);
  const slugs = mirrors.map((s) => s.slug);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(original);
  const sheet = workbook.getWorksheet("Catálogo consolidado");
  const target = sheet.getRows(2, sheet.rowCount - 1).find((r) => r.getCell(1).value === 22);
  assert.ok(target);
  target.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
  const redBytes = Buffer.from(await workbook.xlsx.writeBuffer());
  // Model an older importer that stored this exact red file as still active.
  await pool.query("UPDATE catalog_publications SET source_file = $1, source_sha256 = $2 WHERE id = $3", [redBytes, createHash("sha256").update(redBytes).digest("hex"), initial.version]);
  const red = await upload(redBytes);
  assert.ok(red.draftId, "The same SHA must not suppress an exclusion revealed by the new rule.");
  assert.equal(red.report.deactivated, 1);
  assert.ok(red.services.filter((s) => s.sourceRow === 22).every((s) => s.inactive));
  const hidden = await request("/api/admin/publish", { draftId: red.draftId });
  await routeStatuses(slugs, 404);
  assert.equal((await request("/api/catalog")).services.some((s) => s.sourceRow === 22), false);
  const archive = await request(`/api/admin/history/${hidden.version}/preview`);
  const archivedMirrors = archive.services.filter((s) => s.sourceRow === 22);
  assert.equal(archivedMirrors.length, 3);
  for (const service of archivedMirrors) {
    assert.equal(service.inactive, true);
    assert.deepEqual(service.workbookCells, mirrors.find((m) => m.id === service.id).workbookCells);
  }
  const duplicate = await upload(redBytes);
  assert.equal(duplicate.identical, true);
  assert.equal(duplicate.draftId, undefined);
  assert.equal((await request("/api/admin/history")).versions.length, 2);
  const cleared = await upload(original);
  assert.equal(cleared.report.reactivated, 1);
  assert.equal(cleared.report.created, 0);
  await request("/api/admin/publish", { draftId: cleared.draftId });
  await routeStatuses(slugs, 200);
  sheet.spliceRows(target.number, 1);
  const removed = await upload(Buffer.from(await workbook.xlsx.writeBuffer()));
  assert.equal(removed.report.deactivated, 1);
  await request("/api/admin/publish", { draftId: removed.draftId });
  await routeStatuses(slugs, 404);
  const returned = await upload(original);
  assert.equal(returned.report.reactivated, 1);
  await request("/api/admin/publish", { draftId: returned.draftId });
  await routeStatuses(slugs, 200);
  const restored = await request("/api/admin/restore", { versionId: initial.version });
  assert.equal(restored.identical, true);
  assert.equal((await request("/api/admin/history")).versions.length, 5);
  console.log(JSON.stringify({ redExclusion: true, sameShaReanalysed: true, archivedMirrors: 3, hiddenRoutes: 3, colorRemovalReactivates: true, missingIdStillExcludes: true, sameUrlsPreserved: true, repeatedImportIgnored: true }));
} finally {
  await fetch(`${base}/api/auth/sign-out`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: "{}" });
  await pool.end();
}
