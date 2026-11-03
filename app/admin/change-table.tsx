"use client";
import { useState } from "react";
import type { CatalogChange } from "../../lib/catalog-db";
import { PaginationControls, CATALOG_PAGE_SIZE } from "./pagination-controls";
const kinds: Record<string, string> = { created: "Criado", updated: "Alterado", deactivated: "Excluído (página oculta)", reactivated: "Reativado", column: "Campo novo" };
export function ChangesTable({ changes }: { changes: CatalogChange[] }) {
  const [page, setPage] = useState(1);
  if (!changes.length) return <p>Nenhuma alteração identificada.</p>;
  const currentPage = Math.min(page, Math.ceil(changes.length / CATALOG_PAGE_SIZE));
  const visibleChanges = changes.slice((currentPage - 1) * CATALOG_PAGE_SIZE, currentPage * CATALOG_PAGE_SIZE);
  return <><div className="admin-table-scroll"><table className="admin-changes-table">
    <thead><tr><th>Serviço</th><th>Tipo</th><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
    <tbody>{visibleChanges.map((change, index) => <tr key={`${change.serviceId}-${change.column}-${index}`}>
      <td><strong>{change.serviceTitle}</strong></td><td>{kinds[change.kind] || change.kind}</td><td>{change.column || "—"}</td>
      <td className="admin-value">{change.before ?? "—"}</td><td className="admin-value">{change.after ?? "—"}</td>
    </tr>)}</tbody>
  </table></div><PaginationControls page={currentPage} totalItems={changes.length} itemName="alterações" onPageChange={setPage} /></>;
}
