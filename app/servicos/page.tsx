import { ServiceDirectory } from "../internal-portal";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ busca?: string | string[] }> }) {
  const { busca } = await searchParams;
  const initialQuery = Array.isArray(busca) ? busca[0] : busca;
  return <ServiceDirectory mode="category" value="todos" initialQuery={initialQuery?.trim()} />;
}
