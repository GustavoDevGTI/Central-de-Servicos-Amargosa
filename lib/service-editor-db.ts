import { createHash, randomUUID } from "node:crypto";
import { activeCatalog, catalogPool, initializeCatalogDatabase, withCatalogTransaction, type CatalogSnapshot } from "./catalog-db";
import { snapshotServices } from "./catalog-preview";
import { cancelServiceCreation, createEmptyService, editService, initialEditorSnapshot, ServiceEditorError } from "./service-editor";
import { publishCatalogSnapshot } from "./catalog-publication";
import { publicServiceContent, serviceEditValues, serviceRecordSourceRow } from "../app/direct-service-content";
import { hasCollectionSchedule } from "../app/collection-schedule-data";
import type { PoolClient } from "pg";
import type { Service } from "../app/service-catalog";
import { sameAttendanceUnit, serviceEditFields } from "../app/service-edit-fields";

async function creationKeyForService(service: Service, userId: string, db: Pick<PoolClient, "query"> = catalogPool()): Promise<string | undefined> {
  if (service.pendingCreationBy) return service.pendingCreationBy === userId ? service.registrationId : undefined;
  // Earlier versions created an empty inactive publication immediately. Only a
  // registration whose complete retained history proves it was never saved is eligible.
  if (service.registrationId || service.workbookCells || !service.inactive || !/^\d+$/.test(service.id) || service.slug !== `servico-${service.id}`) return;
  const values = serviceEditValues(service);
  const defaults: Record<string, string> = { status: "Inativo", seiLink: "Não", attendanceUnitMode: sameAttendanceUnit };
  if (serviceEditFields.some((field) => values[field.key] !== (defaults[field.key] ?? ""))) return;
  const publications = await db.query<{ id: string; published_by: string; report: import("./catalog-db").CatalogReport }>(
    `SELECT id, published_by, report FROM catalog_publications
     WHERE report->'changes' @> $1::jsonb ORDER BY id`,
    [JSON.stringify([{ serviceId: service.id }])],
  );
  const creation = publications.rows.findLast((entry) => entry.report.changes.some((change) => change.serviceId === service.id && change.kind === "created"));
  if (!creation || creation.published_by !== userId) return;
  if (publications.rows.some((entry) => Number(entry.id) >= Number(creation.id) && entry.report.changes.some((change) => change.serviceId === service.id && change.kind !== "created"))) return;
  return `legacy-${creation.id}`;
}

export async function serviceEditorCatalog() {
  const active = await activeCatalog();
  return { version: active?.id ?? null, snapshot: active?.snapshot ?? initialEditorSnapshot() };
}

export async function createServiceForEditing(userId: string) {
  await initializeCatalogDatabase();
  return withCatalogTransaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(41730521)");
    const active = await db.query<{ snapshot: CatalogSnapshot }>(
      `SELECT p.snapshot FROM catalog_active a
       JOIN catalog_publications p ON p.id = a.publication_id WHERE a.singleton = true FOR UPDATE`,
    );
    const created = createEmptyService(active.rows[0]?.snapshot ?? initialEditorSnapshot(), userId);
    const version = await publishCatalogSnapshot(db, created.snapshot, created.report, userId, `Criação de serviço · ID ${created.serviceId}`);
    const service = snapshotServices(created.snapshot).find((entry) => entry.id === created.serviceId)!;
    return { version, service: { id: service.id, slug: service.slug!, title: service.title, creationKey: service.registrationId, fields: serviceEditValues(service) } };
  });
}

export async function readServiceForEditing(serviceId: string, userId: string) {
  const catalog = await serviceEditorCatalog();
  const service = snapshotServices(catalog.snapshot).find((s) => s.id === serviceId);
  if (!service) throw new ServiceEditorError("Serviço não encontrado.", 404);
  return { version: catalog.version, service: { id: service.id, title: service.title, slug: service.slug || service.id, sourceRow: serviceRecordSourceRow(service), specialEditor: hasCollectionSchedule(service) ? "collection" : undefined, creationKey: await creationKeyForService(service, userId), fields: serviceEditValues(service) } };
}

export async function cancelCreationForEditing(body: unknown, userId: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ServiceEditorError("Cancelamento inválido.");
  const data = body as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["serviceId", "creationKey"].includes(key)) || typeof data.serviceId !== "string" || !/^\d{1,16}$/.test(data.serviceId) || typeof data.creationKey !== "string" || data.creationKey.length > 80) throw new ServiceEditorError("Cancelamento inválido.");
  await initializeCatalogDatabase();
  return withCatalogTransaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(41730521)");
    const active = await db.query<{ snapshot: CatalogSnapshot }>(
      `SELECT p.snapshot FROM catalog_active a JOIN catalog_publications p
       ON p.id = a.publication_id WHERE a.singleton = true FOR UPDATE`,
    );
    const snapshot = active.rows[0]?.snapshot;
    const service = snapshot?.services.find((entry) => entry.id === data.serviceId);
    if (!snapshot || !service) return { cancelled: true };
    const key = await creationKeyForService(service, userId, db);
    if (!key || key !== data.creationKey) throw new ServiceEditorError("Esta criação já foi salva, cancelada ou pertence a outra conta. Recarregue o serviço.", 409);
    const cancelled = cancelServiceCreation(snapshot, service.id, userId, key.startsWith("legacy-"));
    const version = await publishCatalogSnapshot(db, cancelled.snapshot, cancelled.report, userId, `Cancelamento de criação · ID ${service.id}`);
    await db.query("DELETE FROM catalog_drafts WHERE created_by = $1 AND snapshot->>'mode' = 'direct' AND report->'changes' @> $2::jsonb", [userId, JSON.stringify([{ serviceId: service.id }])]);
    return { cancelled: true, version };
  });
}

/** Read-only preview of the exact version opened by the editor, including inactive records. */
export async function readServicePreview(serviceId: string, version: string | null) {
  if (version !== "initial" && (!version || !/^[1-9]\d*$/.test(version) || !Number.isSafeInteger(Number(version)))) throw new ServiceEditorError("Versão de prévia inválida.");
  const expected = version === "initial" ? null : Number(version);
  const catalog = await serviceEditorCatalog();
  if (catalog.version !== expected) throw new ServiceEditorError("O catálogo mudou. Recarregue o serviço e confira novamente.", 409);
  const services = snapshotServices(catalog.snapshot);
  const service = services.find((entry) => entry.id === serviceId);
  if (!service) throw new ServiceEditorError("Serviço não encontrado.", 404);
  // Keep the active catalog context so related services and internal links match the public page.
  return { version: catalog.version, services: services.filter((entry) => !entry.inactive || entry.id === serviceId).map(publicServiceContent), active: true };
}

export async function draftServiceEdit(body: unknown, userId: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ServiceEditorError("Edição inválida.");
  const data = body as Record<string, unknown>;
  if (Object.keys(data).some((key) => !["serviceId", "baseVersion", "fields"].includes(key)) || typeof data.serviceId !== "string" || data.serviceId.length > 180 || !(data.baseVersion === null || (Number.isSafeInteger(data.baseVersion) && Number(data.baseVersion) > 0))) throw new ServiceEditorError("Edição inválida.");
  const current = await serviceEditorCatalog();
  if (current.version !== data.baseVersion) throw new ServiceEditorError("O catálogo mudou. Recarregue o serviço e confira novamente.", 409);
  const result = editService(current.snapshot, data.serviceId, data.fields);
  if (!result.report.changes.length) return { identical: true, report: result.report };
  const draftId = randomUUID();
  const bytes = Buffer.from(JSON.stringify(result.snapshot));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const service = result.snapshot.services.find((s) => s.id === data.serviceId)!;
  await catalogPool().query(`INSERT INTO catalog_drafts (id, base_publication_id, source_sha256, source_file, source_filename, snapshot, report, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [draftId, current.version, hash, bytes, `Edição direta · ${service.directEdit?.fields.title ?? service.title}`, JSON.stringify(result.snapshot), JSON.stringify(result.report), userId]);
  return { draftId, report: result.report, affectedIds: result.affectedIds };
}

export async function readEditorBody(request: Request) {
  const max = 256 * 1024;
  if (Number(request.headers.get("content-length")) > max) throw new ServiceEditorError("Edição acima do limite permitido.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceEditorError("Edição inválida.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new ServiceEditorError("Edição acima do limite permitido.", 413); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; } catch { throw new ServiceEditorError("Edição inválida."); }
}
