import { Pool, type PoolClient } from "pg";
import { pruneCatalogHistory } from "./catalog-history";

let pool: Pool | undefined;
let initialization: Promise<void> | undefined;

export function catalogPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
    // PostgreSQL may restart while a connection is idle (including local WSL).
    // pg discards that client; handling the event lets later requests reconnect.
    pool.on("error", (error) => console.error("Conexão ociosa do catálogo interrompida:", error.message));
  }
  return pool;
}

async function createCatalogTables(): Promise<void> {
  const db = catalogPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS catalog_publications (
      id BIGSERIAL PRIMARY KEY,
      source_sha256 TEXT NOT NULL,
      source_file BYTEA NOT NULL,
      source_filename TEXT NOT NULL,
      snapshot JSONB NOT NULL,
      report JSONB NOT NULL,
      published_by TEXT NOT NULL,
      published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      reverted_from BIGINT
    );
    CREATE TABLE IF NOT EXISTS catalog_active (
      singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
      publication_id BIGINT NOT NULL REFERENCES catalog_publications(id)
    );
    CREATE TABLE IF NOT EXISTS catalog_drafts (
      id UUID PRIMARY KEY,
      base_publication_id BIGINT,
      source_sha256 TEXT NOT NULL,
      source_file BYTEA NOT NULL,
      source_filename TEXT NOT NULL,
      snapshot JSONB NOT NULL,
      report JSONB NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS catalog_changes (
      id BIGSERIAL PRIMARY KEY,
      publication_id BIGINT NOT NULL REFERENCES catalog_publications(id),
      service_id TEXT NOT NULL,
      service_title TEXT NOT NULL,
      kind TEXT NOT NULL,
      column_name TEXT,
      before_value JSONB,
      after_value JSONB,
      source_row INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_catalog_changes_service ON catalog_changes(service_id);
    CREATE INDEX IF NOT EXISTS idx_catalog_changes_publication ON catalog_changes(publication_id);
    ALTER TABLE catalog_publications DROP CONSTRAINT IF EXISTS catalog_publications_reverted_from_fkey;
  `);
  // The origin number of a restoration remains as historical metadata even
  // after its original snapshot expires. Only the active version has a live FK.
  await withCatalogTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(41730521)");
    await pruneCatalogHistory(client);
  });
}

export function initializeCatalogDatabase(): Promise<void> {
  initialization ??= createCatalogTables().catch((error) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export type CatalogSnapshot = {
  mode?: "direct";
  services: import("../app/service-catalog").Service[];
  rows: Record<string, { excelRow: number; cells: Record<string, string>; excluded: boolean; removed?: boolean; markedRed?: boolean }>;
  headers: string[];
};

export type CatalogChange = {
  serviceId: string;
  serviceTitle: string;
  kind: "created" | "updated" | "deactivated" | "reactivated" | "column";
  column?: string;
  before?: string | null;
  after?: string | null;
  sourceRow?: number;
};

export type CatalogReport = {
  created: number;
  updated: number;
  deactivated: number;
  reactivated: number;
  columnsAdded: string[];
  changes: CatalogChange[];
  blockers: string[];
};

export async function activeCatalog(): Promise<{ id: number; snapshot: CatalogSnapshot } | null> {
  await initializeCatalogDatabase();
  const result = await catalogPool().query<{ id: string; snapshot: CatalogSnapshot }>(
    `SELECT p.id, p.snapshot FROM catalog_active a
      JOIN catalog_publications p ON p.id = a.publication_id WHERE a.singleton = true`,
  );
  return result.rows[0] ? { id: Number(result.rows[0].id), snapshot: result.rows[0].snapshot } : null;
}

export async function withCatalogTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await catalogPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
