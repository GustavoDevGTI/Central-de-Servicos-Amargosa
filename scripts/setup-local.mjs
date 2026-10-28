import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const target = new URL("../.env.docker-local", import.meta.url);
const configuration = [
  "# Configuração exclusiva desta máquina. Não versionar nem compartilhar.",
  "LOCAL_PORT=3100",
  `BETTER_AUTH_SECRET=${randomBytes(32).toString("hex")}`,
  `POSTGRES_PASSWORD=${randomBytes(32).toString("hex")}`,
  "BOOTSTRAP_ADMIN_NAME=GTI",
  "BOOTSTRAP_ADMIN_EMAIL=gti@localhost.invalid",
  "BOOTSTRAP_ADMIN_USERNAME=GTI",
  "# Senha inicial de 12 caracteres; pode ser alterada antes do primeiro início.",
  `BOOTSTRAP_ADMIN_PASSWORD=${randomBytes(6).toString("hex")}`,
  "# Opcional: configure o provedor para respostas da Amanda por IA.",
  "AI_PROVIDER=deepseek",
  "AI_MODEL=deepseek-flash",
  "DEEPSEEK_API_KEY=",
  "OPENAI_API_KEY=",
  "",
].join("\n");

try {
  await writeFile(target, configuration, { flag: "wx", mode: 0o600 });
  console.log("Criado .env.docker-local. O usuário e a senha inicial estão nesse arquivo.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log(".env.docker-local já existe e foi preservado.");
}
console.log("Inicie com: docker compose --env-file .env.docker-local -f compose.local.yml up -d --build");
console.log("Admin: http://127.0.0.1:3100/admin/login (ou a LOCAL_PORT configurada).");
