import { ServiceDirectory, audiences } from "../../internal-portal";

export function generateStaticParams() { return audiences.map((entry) => ({ audience: entry.id })); }

export default async function AudiencePage({ params }: { params: Promise<{ audience: string }> }) {
  const { audience } = await params;
  return <ServiceDirectory mode="audience" value={audience} />;
}
