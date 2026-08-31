import { env } from "cloudflare:workers";

let schemaReady: Promise<void> | undefined;

export function popularityDatabase() {
  const database = (env as Cloudflare.Env & { DB?: D1Database }).DB;
  if (!database) throw new Error("D1 binding DB is not available");
  return database;
}

export function ensurePopularitySchema(database: D1Database) {
  schemaReady ??= database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS service_popularity_daily (
      day TEXT NOT NULL,
      service_id TEXT NOT NULL,
      search_clicks INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (day, service_id)
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_service_popularity_day ON service_popularity_daily(day)"),
  ]).then(() => undefined).catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}
