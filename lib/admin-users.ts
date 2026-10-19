import { auth } from "./auth";
import { canManageUsers, isAdminRole, userAccessChangeError, type AdminRole } from "./admin-permissions";
import { initializeCatalogDatabase, withCatalogTransaction } from "./catalog-db";

export class UserManagementError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// Only one local mutation may hold a pool connection while Better Auth uses a
// second connection. The advisory lock also coordinates other server processes.
let previousMutation: Promise<unknown> = Promise.resolve();

function requiredText(body: Record<string, unknown>, key: string, max: number) {
  const value = body[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new UserManagementError("Preencha corretamente os dados do usuário.");
  return value.trim();
}

function details(body: Record<string, unknown>) {
  const name = requiredText(body, "name", 150);
  const email = requiredText(body, "email", 254).toLowerCase();
  const username = requiredText(body, "username", 30).toLowerCase();
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) throw new UserManagementError("O usuário deve ter de 3 a 30 letras, números, pontos ou sublinhados.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserManagementError("Informe um e-mail válido.");
  if (!isAdminRole(body.role)) throw new UserManagementError("Perfil inválido.");
  return { name, email, username, role: body.role };
}

function passwordOf(body: Record<string, unknown>) {
  const password = body.password;
  if (typeof password !== "string" || password.length < 8 || password.length > 128) throw new UserManagementError("A senha deve ter de 8 a 128 caracteres.");
  return password;
}

export async function manageUser(body: Record<string, unknown>, actorId: string, headers: Headers) {
  await initializeCatalogDatabase();
  const operation = previousMutation.then(() => withCatalogTransaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(41730522)");
    const actor = (await db.query('SELECT role, banned FROM "user" WHERE id = $1', [actorId])).rows[0];
    if (!actor || actor.banned || !canManageUsers(actor.role)) throw new UserManagementError("Apenas administradores gerais podem gerenciar usuários.", 403);
    if (body.action === "create") {
      const data = details(body);
      const password = passwordOf(body);
      const duplicate = await db.query('SELECT id FROM "user" WHERE lower(email) = $1 OR lower(username) = $2', [data.email, data.username]);
      if (duplicate.rowCount) throw new UserManagementError("Este usuário ou e-mail já está cadastrado.", 409);
      const result = await auth.api.createUser({ headers, body: { name: data.name, email: data.email, password, role: data.role, data: { username: data.username } } });
      return { userId: result.user.id };
    }
    if (!["update", "status", "password"].includes(String(body.action))) throw new UserManagementError("Operação inválida.");
    const id = requiredText(body, "userId", 128);
    const target = (await db.query<{ id: string; username: string | null; role: string | null; banned: boolean | null }>('SELECT id, username, role, banned FROM "user" WHERE id = $1', [id])).rows[0];
    if (!target) throw new UserManagementError("Usuário não encontrado.", 404);
    const update = body.action === "update" ? details(body) : null;
    if (body.action === "status" && typeof body.active !== "boolean") throw new UserManagementError("Situação inválida.");
    const nextRole: AdminRole = update?.role || (isAdminRole(target.role) ? target.role : "catalog_admin");
    const nextBanned = body.action === "status" ? !body.active : Boolean(target.banned);
    const count = (await db.query('SELECT count(*)::int AS total FROM "user" WHERE role = $1 AND COALESCE(banned, false) = false', ["admin"])).rows[0].total;
    const protection = userAccessChangeError(actorId, target, nextRole, nextBanned, count);
    if (protection) throw new UserManagementError(protection);
    if (update) {
      const duplicate = await db.query('SELECT id FROM "user" WHERE id <> $1 AND (lower(email) = $2 OR lower(username) = $3)', [id, update.email, update.username]);
      if (duplicate.rowCount) throw new UserManagementError("Este usuário ou e-mail já está cadastrado.", 409);
      const { username, ...profile } = update;
      await auth.api.adminUpdateUser({ headers, body: { userId: id, data: { ...profile, ...(username !== target.username ? { username } : {}) } } });
      if (target.role !== update.role) await auth.api.revokeUserSessions({ headers, body: { userId: id } });
    } else if (body.action === "status") {
      if (body.active) await auth.api.unbanUser({ headers, body: { userId: id } });
      else await auth.api.banUser({ headers, body: { userId: id, banReason: "Acesso desativado no admin da Central." } });
    } else {
      if (id === actorId) throw new UserManagementError("Use outra conta de administrador geral para redefinir sua senha.");
      await auth.api.setUserPassword({ headers, body: { userId: id, newPassword: passwordOf(body) } });
      await auth.api.revokeUserSessions({ headers, body: { userId: id } });
    }
    return { userId: id };
  }));
  previousMutation = operation.catch(() => undefined);
  return operation;
}
