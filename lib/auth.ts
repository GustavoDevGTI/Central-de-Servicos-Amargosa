import { betterAuth } from "better-auth";
import { catalogPool } from "./catalog-db";
import { createAuthOptions } from "./auth-options.mjs";

export const auth = betterAuth(createAuthOptions(catalogPool()));

export function assertAuthConfigured() {
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET inválido");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
}
