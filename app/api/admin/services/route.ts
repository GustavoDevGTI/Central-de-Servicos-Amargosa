import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { draftServiceEdit, readEditorBody, serviceEditorCatalog } from "../../../../lib/service-editor-db";
import { ServiceEditorError } from "../../../../lib/service-editor";
import { snapshotServices } from "../../../../lib/catalog-preview";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado." }, 401);
    const current = await serviceEditorCatalog();
    return adminResponse({ version: current.version, services: snapshotServices(current.snapshot).filter((s) => !s.inactive).map((s) => ({ id: s.id, slug: s.slug || s.id, title: s.title, sourceRow: s.sourceRow, inactive: false })) });
  } catch { return adminResponse({ error: "Não foi possível carregar os serviços." }, 503); }
}
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida." }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado." }, 401);
    return adminResponse(await draftServiceEdit(await readEditorBody(request), session.user.id));
  } catch (error) { return adminResponse({ error: error instanceof ServiceEditorError ? error.message : "Não foi possível comparar a edição." }, error instanceof ServiceEditorError ? error.status : 503); }
}
