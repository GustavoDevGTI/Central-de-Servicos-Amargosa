import { adminResponse, adminSession, sameOrigin } from "../../../../lib/admin-session";
import { canManageUsers } from "../../../../lib/admin-permissions";
import { catalogPool } from "../../../../lib/catalog-db";
import { manageUser, UserManagementError } from "../../../../lib/admin-users";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado." }, 401);
    if (!canManageUsers(session.user.role)) return adminResponse({ error: "Apenas administradores gerais podem gerenciar usuários." }, 403);
    const url = new URL(request.url);
    const search = (url.searchParams.get("q") || "").trim().slice(0, 150);
    const page = Number(url.searchParams.get("page") || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return adminResponse({ error: "Página inválida." }, 400);
    const where = `position(lower($1) in lower(concat_ws(' ', name, email, username))) > 0 OR $1 = ''`;
    const users = await catalogPool().query(`SELECT id, name, email, username, role, banned, "createdAt" FROM "user" WHERE ${where} ORDER BY "createdAt", id LIMIT 20 OFFSET $2`, [search, (page - 1) * 20]);
    const total = await catalogPool().query(`SELECT count(*)::int AS total FROM "user" WHERE ${where}`, [search]);
    return adminResponse({ users: users.rows, total: total.rows[0].total });
  } catch {
    return adminResponse({ error: "Não foi possível carregar os usuários." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return adminResponse({ error: "Origem inválida." }, 403);
    const session = await adminSession(request);
    if (!session) return adminResponse({ error: "Acesso negado." }, 401);
    if (!canManageUsers(session.user.role)) return adminResponse({ error: "Apenas administradores gerais podem gerenciar usuários." }, 403);
    const body = await request.json() as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return adminResponse({ error: "Dados inválidos." }, 400);
    return adminResponse(await manageUser(body as Record<string, unknown>, session.user.id, request.headers));
  } catch (reason) {
    if (reason instanceof UserManagementError) return adminResponse({ error: reason.message }, reason.status);
    if (reason instanceof SyntaxError) return adminResponse({ error: "Dados inválidos." }, 400);
    return adminResponse({ error: "Não foi possível salvar o usuário. Confira os dados e tente novamente." }, 503);
  }
}
