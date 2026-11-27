import { tutorialVideoLimit, vacationServiceId } from "../app/service-tutorial";

export function tutorialVideoReference(id: string) {
  return JSON.stringify([{ id: vacationServiceId, directEdit: { fields: { tutorialVideo: id } } }]);
}

export async function readTutorialVideo(request: Request) {
  const tooLarge = () => new TutorialVideoError("O vídeo deve ter até 25 MB.", 413);
  if (Number(request.headers.get("content-length")) > tutorialVideoLimit) {
    await request.body?.cancel();
    throw tooLarge();
  }
  if (!request.body) throw new TutorialVideoError("Selecione um vídeo em MP4 ou WebM.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > tutorialVideoLimit) {
        await reader.cancel();
        throw tooLarge();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks, size);
  const mime = tutorialContentType(bytes);
  if (!mime) throw new TutorialVideoError("Arquivo inválido. Selecione um vídeo em MP4 ou WebM.", 415);
  return { bytes, mime };
}

export class TutorialVideoError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function tutorialContentType(bytes: Buffer) {
  if (bytes.length < 24) return undefined;
  if (bytes.toString("ascii", 4, 8) === "ftyp" && bytes.readUInt32BE(0) >= 16 && bytes.readUInt32BE(0) <= bytes.length && bytes.toString("ascii", 8, 12) !== "qt  ") return "video/mp4";
  if (bytes.readUInt32BE(0) === 0x1a45dfa3 && bytes.subarray(4, 256).includes(Buffer.from([0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]))) return "video/webm";
  return undefined;
}

export function tutorialByteRange(header: string | null, size: number) {
  if (!header) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const first = Number(match[1]), last = Number(match[2]);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) return null;
  const start = match[1] ? first : Math.max(0, size - last);
  const end = !match[1] || !match[2] ? size - 1 : Math.min(last, size - 1);
  return start <= end ? { start, end, partial: true } : null;
}

export const tutorialMediaHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function serveTutorialMedia(request: Request, mime: string, size: number, read: (start: number, length: number) => BodyInit | null | Promise<BodyInit | null>) {
  const headers = new Headers(tutorialMediaHeaders);
  headers.set("Accept-Ranges", "bytes");
  const range = tutorialByteRange(request.headers.get("range"), size);
  if (!range) {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  const length = range.end - range.start + 1;
  const status = range.partial ? 206 : 200;
  headers.set("Content-Type", mime);
  headers.set("Content-Length", String(length));
  if (range.partial) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  if (request.method === "HEAD") return new Response(null, { status, headers });
  const body = await read(range.start, length);
  return body ? new Response(body, { status, headers }) : new Response(null, { status: 404, headers: tutorialMediaHeaders });
}
