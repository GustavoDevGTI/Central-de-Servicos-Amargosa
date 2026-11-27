import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { isUploadedTutorialVideo, vacationServiceId } from "../app/service-tutorial";
import { catalogPool, initializeCatalogDatabase, withCatalogTransaction } from "./catalog-db";
import { pruneTutorialVideos } from "./catalog-history";
import { readTutorialVideo, serveTutorialMedia, TutorialVideoError, tutorialMediaHeaders, tutorialVideoReference } from "./tutorial-video-data";

export async function saveTutorialUpload(request: Request, userId: string) {
  const { bytes, mime } = await readTutorialVideo(request);
  await initializeCatalogDatabase();
  const id = randomUUID();
  await withCatalogTransaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(41730521)");
    await pruneTutorialVideos(db);
    await db.query("INSERT INTO catalog_tutorial_videos (id, mime, content, created_by) VALUES ($1, $2, $3, $4)", [id, mime, bytes, userId]);
  });
  return { id };
}

export async function checkTutorialUpload(db: Pick<PoolClient, "query">, id: string, userId: string) {
  const result = await db.query(`SELECT 1 FROM catalog_tutorial_videos v WHERE v.id = $1 AND
    (v.created_by = $2 OR EXISTS (SELECT 1 FROM catalog_publications p WHERE p.snapshot->'services' @> $3::jsonb))`,
  [id, userId, tutorialVideoReference(id)]);
  if (!result.rows.length) throw new TutorialVideoError("Vídeo indisponível. Selecione o arquivo novamente.");
}

export async function tutorialVideoResponse(request: Request, id: string, adminId: () => Promise<string | undefined>) {
  const missing = () => new Response(null, { status: 404, headers: tutorialMediaHeaders });
  if (!isUploadedTutorialVideo(id)) return missing();
  await initializeCatalogDatabase();
  const db = catalogPool();
  const { rows: [video] } = await db.query<{ mime: string; size: number; active: boolean }>(
    `SELECT v.mime, octet_length(v.content) AS size, EXISTS (
      SELECT 1 FROM catalog_active a JOIN catalog_publications p ON p.id = a.publication_id
      CROSS JOIN LATERAL jsonb_array_elements(p.snapshot->'services') AS service(entry)
      WHERE a.singleton = true AND entry->>'id' = $2 AND entry #>> '{directEdit,fields,tutorialVideo}' = $1::uuid::text
        AND COALESCE(entry #>> '{directEdit,fields,status}', CASE WHEN entry->>'inactive' = 'true' THEN 'Inativo' ELSE 'Ativo' END) <> 'Inativo'
    ) AS active FROM catalog_tutorial_videos v WHERE v.id = $1`, [id, vacationServiceId],
  );
  if (!video) return missing();
  if (!video.active) {
    const userId = await adminId();
    if (!userId) return missing();
    try { await checkTutorialUpload(db, id, userId); }
    catch (error) { if (error instanceof TutorialVideoError) return missing(); throw error; }
  }

  return serveTutorialMedia(request, video.mime, video.size, async (start, length) => {
    const { rows: [data] } = await db.query<{ content: Buffer }>(
      `SELECT substring(content FROM $2::int FOR $3::int) AS content FROM catalog_tutorial_videos WHERE id = $1`, [id, start + 1, length],
    );
    return data ? new Uint8Array(data.content) : null;
  });
}
