import { adminResponse, adminSession } from "../../../../lib/admin-session";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado." }, 401);
    return adminResponse({ error: "A edição agora é feita diretamente por serviço no admin." }, 410);
  } catch { return adminResponse({ error: "Admin indisponível." }, 503); }
}
