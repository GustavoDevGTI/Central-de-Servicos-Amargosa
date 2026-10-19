import { randomUUID } from "node:crypto";
import { activeCatalog, catalogPool } from "./catalog-db";
import { analyzeWorkbook } from "./catalog-import";
import { snapshotServices } from "./catalog-preview";

export function draftServiceList(snapshot: import("./catalog-db").CatalogSnapshot) {
  return snapshotServices(snapshot).map(({ id, slug, title, sourceRow, inactive }) => ({ id, slug: slug || id, title, sourceRow, inactive: Boolean(inactive) }));
}

export async function draftCatalog(bytes: Buffer, filename: string, userId: string) {
  const current = await activeCatalog();
  const { sha256, snapshot, report } = await analyzeWorkbook(bytes, current?.snapshot);
  if (current && report.blockers.length === 0 && (report.changes.length === 0 || sha256 === (await catalogPool().query<{ source_sha256: string }>(
    "SELECT source_sha256 FROM catalog_publications WHERE id = $1", [current.id],
  )).rows[0]?.source_sha256)) {
    return { identical: true, sha256, report: { ...report, changes: [] } };
  }
  const draftId = randomUUID();
  await catalogPool().query(
    `INSERT INTO catalog_drafts (id, base_publication_id, source_sha256, source_file,
      source_filename, snapshot, report, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [draftId, current?.id || null, sha256, bytes, filename,
      JSON.stringify(snapshot), JSON.stringify(report), userId],
  );
  return { draftId, sha256, report, services: draftServiceList(snapshot) };
}
