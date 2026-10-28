import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida." }, 403);
    if (!await adminSession(request)) return adminResponse({ error: "Acesso negado." }, 401);
    return adminResponse({ error: "A edição agora é feita diretamente por serviço no admin." }, 410);
  } catch { return adminResponse({ error: "Admin indisponível." }, 503); }
}
