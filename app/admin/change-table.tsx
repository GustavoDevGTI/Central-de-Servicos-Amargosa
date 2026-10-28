import type { CatalogChange } from "../../lib/catalog-db";
const kinds: Record<string, string> = { created: "Criado", updated: "Alterado", deactivated: "Excluído (página oculta)", reactivated: "Reativado", column: "Campo novo" };
export function ChangesTable({ changes }: { changes: CatalogChange[] }) {
  if (!changes.length) return <p>Nenhuma alteração identificada.</p>;
  return <div className="admin-table-scroll"><table className="admin-changes-table">
    <thead><tr><th>Serviço</th><th>Tipo</th><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>
    <tbody>{changes.map((change, index) => <tr key={`${change.serviceId}-${change.column}-${index}`}>
      <td><strong>{change.serviceTitle}</strong></td><td>{kinds[change.kind] || change.kind}</td><td>{change.column || "—"}</td>
      <td className="admin-value">{change.before ?? "—"}</td><td className="admin-value">{change.after ?? "—"}</td>
    </tr>)}</tbody>
  </table></div>;
}
