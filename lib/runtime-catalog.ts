import { services as builtInServices, type Service } from "../app/service-catalog";
import { activeCatalog } from "./catalog-db";
import { snapshotServices } from "./catalog-preview";

export async function runtimeCatalog(): Promise<{ version: number | null; services: Service[] }> {
  if (!process.env.DATABASE_URL) return { version: null, services: builtInServices };
  const active = await activeCatalog();
  return {
    version: active?.id || null,
    services: (active ? snapshotServices(active.snapshot) : builtInServices).filter((service) => !service.inactive),
  };
}

export async function runtimeService(slug: string): Promise<Service | undefined> {
  const catalog = await runtimeCatalog();
  return catalog.services.find((entry) => (entry.slug || entry.id) === slug);
}
