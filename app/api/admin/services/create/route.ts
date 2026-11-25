import { adminResponse, adminSession, sameOrigin } from "../../../../../lib/admin-session";
import { createServiceForEditing, readEditorBody } from "../../../../../lib/service-editor-db";
import { ServiceEditorError } from "../../../../../lib/service-editor";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida." }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado." }, 401);
    const body = await readEditorBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) throw new ServiceEditorError("Cadastro inválido.");
    return adminResponse(await createServiceForEditing(session.user.id));
  } catch (error) {
    return adminResponse({ error: error instanceof ServiceEditorError ? error.message : "Não foi possível criar o serviço." }, error instanceof ServiceEditorError ? error.status : 503);
  }
}
