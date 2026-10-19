export const adminRoles = {
  admin: "Administrador geral",
  catalog_admin: "Administrador do catálogo",
} as const;

export type AdminRole = keyof typeof adminRoles;

export function isAdminRole(role: unknown): role is AdminRole {
  return role === "admin" || role === "catalog_admin";
}

export function canManageUsers(role: unknown) {
  return role === "admin";
}

export function userAccessChangeError(actorId: string, target: { id: string; role: string | null; banned: boolean | null }, nextRole: AdminRole, nextBanned: boolean, activeManagers: number) {
  if (actorId === target.id && (nextRole !== target.role || nextBanned)) return "Você não pode retirar ou desativar seu próprio acesso.";
  if (target.role === "admin" && !target.banned && (nextRole !== "admin" || nextBanned) && activeManagers <= 1) return "Mantenha pelo menos um administrador geral ativo.";
  return null;
}
