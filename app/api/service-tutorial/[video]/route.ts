import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { originalTutorialVideo } from "../../../service-tutorial";
import { tutorialVideoResponse } from "../../../../lib/tutorial-video-db";
import { serveTutorialMedia } from "../../../../lib/tutorial-video-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ video: string }> }) {
  try {
    const { video } = await params;
    if (video === originalTutorialVideo) {
      const path = resolve(process.cwd(), "public", "tutoriais", "ferias.mp4");
      const { size } = await stat(path);
      return await serveTutorialMedia(request, "video/mp4", size, (start, length) =>
        Readable.toWeb(createReadStream(path, { start, end: start + length - 1 })) as ReadableStream<Uint8Array<ArrayBuffer>>);
    }
    return await tutorialVideoResponse(request, video, async () => {
      if (!request.headers.has("cookie")) return undefined;
      const { adminSession } = await import("../../../../lib/admin-session");
      return (await adminSession(request))?.user.id;
    });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const HEAD = GET;
