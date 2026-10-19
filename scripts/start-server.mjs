import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { Pool } from "pg";
import { createAuthOptions } from "../lib/auth-options.mjs";
import { ADMIN_PASSWORD_HINT, isValidAdminPassword } from "../lib/admin-password-policy.mjs";

async function prepareDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) throw new Error("Configure BETTER_AUTH_SECRET com pelo menos 32 caracteres.");
  const url = new URL(process.env.BETTER_AUTH_URL || "");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("BETTER_AUTH_URL deve usar o domínio HTTPS do portal.");
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) throw new Error("BETTER_AUTH_URL deve conter apenas a origem do portal.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000 });
  const lock = await pool.connect();
  try {
    await lock.query("SELECT pg_advisory_lock(41730523)");
    const options = createAuthOptions(pool);
    const migration = await getMigrations(options);
    if (migration.schemaProblems.length || migration.unsafeChanges.length) throw new Error("O esquema de autenticação exige revisão antes da migração.");
    await migration.runMigrations();
    const { rows } = await lock.query('SELECT count(*)::int AS total FROM "user"');
    if (!rows[0].total) {
      const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
      const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
      const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim().toLowerCase();
      const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !username || !/^[a-z0-9_.]{3,30}$/.test(username)) throw new Error("No primeiro início, configure BOOTSTRAP_ADMIN_NAME, EMAIL e USERNAME.");
      if (!isValidAdminPassword(password)) throw new Error(`Configure BOOTSTRAP_ADMIN_PASSWORD. ${ADMIN_PASSWORD_HINT}`);
      await betterAuth(options).api.createUser({ body: { name, email, password, role: "admin", data: { username } } });
      console.log("Administrador inicial criado. Remova as variáveis BOOTSTRAP_ADMIN_* da stack.");
    }
    console.log("Banco de autenticação preparado.");
  } finally {
    await lock.query("SELECT pg_advisory_unlock(41730523)");
    lock.release();
    await pool.end();
  }
}

try {
  await prepareDatabase();
  for (const key of Object.keys(process.env)) if (key.startsWith("BOOTSTRAP_ADMIN_")) delete process.env[key];
  await import("../server.js");
} catch (error) {
  console.error("Não foi possível iniciar a Central:", error instanceof Error ? error.message : "Erro de inicialização.");
  process.exitCode = 1;
}
