import { createHash, randomUUID } from "node:crypto";
import { activeCatalog, catalogPool } from "./catalog-db";
import { snapshotServices } from "./catalog-preview";
import { editService, initialEditorSnapshot, ServiceEditorError } from "./service-editor";
import { serviceEditValues } from "../app/direct-service-content";

export async function serviceEditorCatalog() {
  const active = await activeCatalog();
  return { version: active?.id ?? null, snapshot: active?.snapshot ?? initialEditorSnapshot() };
}

export async function readServiceForEditing(serviceId: string) {
  const catalog = await serviceEditorCatalog();
  const service = snapshotServices(catalog.snapshot).find((s) => s.id === serviceId && !s.inactive);
  if (!service) throw new ServiceEditorError("Serviço não encontrado.", 404);
  return { version: catalog.version, service: { id: service.id, title: service.title, slug: service.slug || service.id, sourceRow: service.sourceRow, fields: serviceEditValues(service) } };
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
  const max = 128 * 1024;
  if (Number(request.headers.get("content-length")) > max) throw new ServiceEditorError("Edição acima do limite permitido.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ServiceEditorError("Edição inválida.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new ServiceEditorError("Edição acima do limite permitido.", 413); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; } catch { throw new ServiceEditorError("Edição inválida."); }
}
