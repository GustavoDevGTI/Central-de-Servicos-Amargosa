import { ServiceDetail } from "../../internal-portal";
import { services } from "../../service-catalog";

const siteOrigin = "https://maisdigital.amargosa.ba.gov.br";

export function generateStaticParams() { return services.filter((entry) => entry.slug).map((entry) => ({ service: entry.slug! })); }

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const { service: slug } = await params;
  const entry = services.find((item) => (item.slug || item.id) === slug);
  if (!entry) return { title: "Serviço não encontrado" };

  const title = `${entry.title} | Central de Serviços de Amargosa`;
  const description = entry.summary || `Orientações para acessar o serviço ${entry.title} em Amargosa.`;
  const url = `${siteOrigin}/servicos/${entry.slug || entry.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [] },
    twitter: { title, description, images: [] },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  return <ServiceDetail slug={service} />;
}
