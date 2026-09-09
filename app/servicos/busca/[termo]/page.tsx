import type { Metadata } from "next";
import { ServiceDirectory } from "../../../internal-portal";
import { searchTermFromSlug } from "../../../search-url";

export const metadata: Metadata = {
  title: "Busca de serviços | Central de Serviços de Amargosa",
  description: "Resultados da busca na Central de Serviços de Amargosa.",
};

export default async function ServiceSearchPage({
  params,
}: {
  params: Promise<{ termo: string }>;
}) {
  const { termo } = await params;
  return (
    <ServiceDirectory
      mode="audience"
      value="todos"
      initialQuery={searchTermFromSlug(termo)}
    />
  );
}
