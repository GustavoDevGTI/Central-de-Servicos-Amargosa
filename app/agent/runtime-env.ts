import { env } from "cloudflare:workers";

export function runtimeEnv(name: string) {
  try {
    const workerValue = (env as unknown as Record<string, unknown>)[name];
    if (typeof workerValue === "string" && workerValue.trim()) {
      return workerValue.trim();
    }
  } catch {
    // O runtime Docker não disponibiliza bindings do Cloudflare.
  }

  const processValue = process.env[name];
  return typeof processValue === "string" && processValue.trim()
    ? processValue.trim()
    : undefined;
}

export function runtimeNumber(name: string, fallback: number) {
  const parsed = Number(runtimeEnv(name));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

