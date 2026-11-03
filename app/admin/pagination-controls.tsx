"use client";

export const CATALOG_PAGE_SIZE = 10;

function visiblePages(current: number, total: number) {
  const count = Math.min(5, total);
  const start = Math.max(1, Math.min(current - 2, total - count + 1));
  return Array.from({ length: count }, (_, index) => start + index);
}

export function PaginationControls({ page, totalItems, itemName, onPageChange }: {
  page: number;
  totalItems: number;
  itemName: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  if (!totalItems) return null;
  return <nav className="admin-pagination" aria-label={`Paginação de ${itemName}`}>
    <p>Exibindo {(currentPage - 1) * CATALOG_PAGE_SIZE + 1}–{Math.min(currentPage * CATALOG_PAGE_SIZE, totalItems)} de {totalItems} {itemName}</p>
    <div>
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Anterior</button>
      {visiblePages(currentPage, totalPages).map((value) => <button type="button" key={value}
        aria-label={`Página ${value}`} aria-current={value === currentPage ? "page" : undefined}
        onClick={() => onPageChange(value)}>{value}</button>)}
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Próxima</button>
    </div>
  </nav>;
}
