import { ServiceDetail, services } from "../../internal-portal";

export function generateStaticParams() { return services.map((entry) => ({ service: entry.slug || entry.id })); }

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  return <ServiceDetail slug={service} />;
}
