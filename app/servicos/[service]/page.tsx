import { ServiceDetail } from "../../internal-portal";
import { runtimeService } from "../../../lib/runtime-catalog";
import { notFound, redirect } from "next/navigation";

const siteOrigin = "https://maisdigital.amargosa.ba.gov.br";
const oldServiceSlugs: Record<string, string> = {
  "troca-de-lampadas": "iluminacao-publica",
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const { service: slug } = await params;
  const entry = await runtimeService(oldServiceSlugs[slug] || slug);
  if (!entry || entry.inactive) return { title: "Serviço não disponível" };

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
  if (oldServiceSlugs[service]) redirect(`/servicos/${oldServiceSlugs[service]}`);
  const entry = await runtimeService(service);
  if (!entry || entry.inactive) notFound();
  return <ServiceDetail slug={service} initialService={entry} />;
}
