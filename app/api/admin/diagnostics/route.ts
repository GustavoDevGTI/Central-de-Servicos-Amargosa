import { adminResponse, adminSession } from "../../../../lib/admin-session";
import { analyticsReportUrl, analyticsEmbedUrl } from "../../../../lib/admin-diagnostics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado." }, 401);
    return adminResponse({ url: analyticsReportUrl, embedUrl: analyticsEmbedUrl });
  } catch {
    return adminResponse({ error: "Diagnóstico indisponível." }, 503);
  }
}
