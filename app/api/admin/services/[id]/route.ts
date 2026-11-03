import { adminResponse, adminSession } from "../../../../../lib/admin-session";
import { readServiceForEditing, readServicePreview } from "../../../../../lib/service-editor-db";
import { ServiceEditorError } from "../../../../../lib/service-editor";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado." }, 401);
    const { id } = await params;
    const query = new URL(request.url).searchParams;
    return adminResponse(query.get("preview") === "1" ? await readServicePreview(id, query.get("version")) : await readServiceForEditing(id));
  } catch (error) { return adminResponse({ error: error instanceof ServiceEditorError ? error.message : "Não foi possível carregar o serviço." }, error instanceof ServiceEditorError ? error.status : 503); }
}
