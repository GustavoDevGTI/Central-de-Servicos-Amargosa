import { ServiceDetail, services } from "../../internal-portal";

export function generateStaticParams() { return services.filter((entry) => entry.slug).map((entry) => ({ service: entry.slug! })); }

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  return <ServiceDetail slug={service} />;
}
