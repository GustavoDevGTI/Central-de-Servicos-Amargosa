import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { MAX_WORKBOOK_BYTES } from "../../../../lib/catalog-import";
import { draftCatalog } from "../../../../lib/catalog-draft";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida" }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado" }, 401);
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > MAX_WORKBOOK_BYTES + 1024 * 1024) {
      return adminResponse({ error: "Arquivo acima de 10 MB" }, 413);
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !/\.xlsx$/i.test(file.name)) return adminResponse({ error: "Selecione um arquivo XLSX" }, 400);
    if (file.size > MAX_WORKBOOK_BYTES) return adminResponse({ error: "Arquivo acima de 10 MB" }, 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    return adminResponse(await draftCatalog(bytes, file.name, session.user.id));
  } catch (error) {
    return adminResponse({ error: error instanceof Error ? error.message : "Falha ao analisar planilha" }, 400);
  }
}
