export function runtimeEnv(name: string) {
  const processValue = process.env[name];
  return typeof processValue === "string" && processValue.trim()
    ? processValue.trim()
    : undefined;
}

export function runtimeNumber(name: string, fallback: number) {
  const parsed = Number(runtimeEnv(name));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

