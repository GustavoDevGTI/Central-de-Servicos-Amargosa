import { services as builtInServices } from "../app/service-catalog";
import { applyWorkbookCells } from "../app/workbook-service";
import type { CatalogSnapshot } from "./catalog-db";

/** Use the same final cell application for public pages and private previews. */
export function snapshotServices(snapshot: CatalogSnapshot) {
  const rowById = new Map(builtInServices.filter((service) => service.workbookCells).map((service) => [service.id, service.sourceRow]));
  return snapshot.services.map((service) => {
    const sourceRow = rowById.get(service.id) || (service.publishedFromWorkbook ? service.sourceRow : undefined);
    const row = sourceRow && snapshot.rows[String(sourceRow)];
    return row ? { ...applyWorkbookCells(service, row.cells, sourceRow), inactive: row.excluded } : service;
  });
}
