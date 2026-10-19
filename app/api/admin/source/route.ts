import { adminResponse, adminSession } from "../../../../lib/admin-session";
import { OFFICIAL_CATALOG_LINK } from "../../../../lib/catalog-source-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado" }, 401);
    const source = new URL(process.env.CATALOG_SHAREPOINT_URL || OFFICIAL_CATALOG_LINK);
    if (source.protocol !== "https:" || !source.hostname.endsWith(".sharepoint.com") || source.username || source.password) {
      return adminResponse({ error: "Link oficial do SharePoint inválido." }, 503);
    }
    const embed = new URL(source);
    embed.searchParams.delete("download");
    embed.searchParams.set("action", "embedview");
    embed.searchParams.set("wdAllowInteractivity", "True");
    return adminResponse({ url: source.href, embedUrl: embed.href });
  } catch {
    return adminResponse({ error: "Consulta da planilha indisponível." }, 503);
  }
}
