import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { TutorialVideoError } from "../../../../lib/tutorial-video-data";
import { saveTutorialUpload } from "../../../../lib/tutorial-video-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  async function reject(error: string, status: number) {
    await request.body?.cancel().catch(() => undefined);
    return adminResponse({ error }, status);
  }
  try {
    if (!sameOrigin(request)) return reject("Origem inválida.", 403);
    const session = await adminSession(request);
    if (!session) return reject("Acesso negado.", 401);
    return adminResponse(await saveTutorialUpload(request, session.user.id), 201);
  } catch (error) {
    return error instanceof TutorialVideoError
      ? adminResponse({ error: error.message }, error.status)
      : reject("Não foi possível enviar o vídeo.", 503);
  }
}
