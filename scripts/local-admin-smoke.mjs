import { readFile } from "node:fs/promises";

const base = process.env.BETTER_AUTH_URL;
const username = process.env.LOCAL_ADMIN_USERNAME;
const password = process.env.LOCAL_ADMIN_PASSWORD;
const filename = process.argv[2];
const publish = process.argv.includes("--publish");
if (!base || !username || !password || !filename || process.env.LOCAL_ADMIN_SEED !== "true") {
  throw new Error("Configure .env.local e informe o caminho de um XLSX de teste.");
}

const login = await fetch(`${base}/api/auth/sign-in/username`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base },
  body: JSON.stringify({ username, password }),
});
if (!login.ok) throw new Error(`Login falhou: ${login.status}`);
const cookie = login.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
if (!cookie) throw new Error("Login sem cookie de sessão.");

const form = new FormData();
form.append("file", new Blob([await readFile(filename)]), "catalogo.xlsx");
const uploaded = await fetch(`${base}/api/admin/upload`, {
  method: "POST", headers: { Cookie: cookie, Origin: base }, body: form,
});
const preview = await uploaded.json();
if (!uploaded.ok) throw new Error(`Upload falhou: ${uploaded.status}: ${preview.error}`);
console.log(JSON.stringify({
  uploadStatus: uploaded.status,
  identical: preview.identical || false,
  draft: Boolean(preview.draftId),
  created: preview.report.created,
  updated: preview.report.updated,
  deactivated: preview.report.deactivated,
  blockers: preview.report.blockers,
}));

if (publish && preview.draftId && !preview.report.blockers.length) {
  const result = await fetch(`${base}/api/admin/publish`, {
    method: "POST",
    headers: { Cookie: cookie, Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ draftId: preview.draftId }),
  });
  const body = await result.json();
  if (!result.ok) throw new Error(`Publicação falhou: ${result.status}: ${body.error}`);
  console.log(JSON.stringify({ published: body.published, version: body.version }));
}
