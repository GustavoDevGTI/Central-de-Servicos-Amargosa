import { admin, username } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

/** @param {import("pg").Pool} database */
export function createAuthOptions(database) {
  const baseURL = process.env.BETTER_AUTH_URL || "http://127.0.0.1:3100";
  const usernamePlugin = username();
  const adminPlugin = admin({
    defaultRole: "catalog_admin",
    roles: { admin: adminAc, catalog_admin: userAc },
    bannedUserMessage: "Seu acesso foi desativado. Procure um administrador geral.",
  });
  return {
    appName: "Central de Serviços de Amargosa",
    baseURL,
    secret: process.env.BETTER_AUTH_SECRET,
    database,
    emailAndPassword: { enabled: true, disableSignUp: true },
    plugins: /** @type {[typeof usernamePlugin, typeof adminPlugin]} */ ([usernamePlugin, adminPlugin]),
    trustedOrigins: [baseURL],
    advanced: { useSecureCookies: baseURL.startsWith("https://") },
    rateLimit: { enabled: true, window: 60, max: 20 },
  };
}
