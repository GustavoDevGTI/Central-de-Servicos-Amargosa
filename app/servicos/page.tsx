import { ServiceDirectory } from "../internal-portal";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ busca?: string | string[]; categoria?: string | string[] }> }) {
  const { busca, categoria } = await searchParams;
  const initialQuery = Array.isArray(busca) ? busca[0] : busca;
  const categorySlug = Array.isArray(categoria) ? categoria[0] : categoria;
  return <ServiceDirectory mode="audience" value="todos" initialQuery={initialQuery?.trim()} initialCategory={categorySlug} />;
}
