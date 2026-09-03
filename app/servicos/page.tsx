import { redirect } from "next/navigation";
import { ServiceDirectory } from "../internal-portal";
import { searchPath } from "../search-url";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ busca?: string | string[]; categoria?: string | string[] }> }) {
  const { busca, categoria } = await searchParams;
  const initialQuery = Array.isArray(busca) ? busca[0] : busca;
  const categorySlug = Array.isArray(categoria) ? categoria[0] : categoria;
  if (initialQuery?.trim()) redirect(searchPath(initialQuery));
  return <ServiceDirectory mode="audience" value="todos" initialCategory={categorySlug} />;
}
