import { CurrentServicePreview } from "../../../service-preview";

export const metadata = { title: "Versão atual do serviço", robots: { index: false, follow: false } };

export default async function CurrentPreviewPage({ params, searchParams }: { params: Promise<{ service: string }>; searchParams: Promise<{ version?: string }> }) {
  const { service: id } = await params;
  const { version } = await searchParams;
  return <CurrentServicePreview key={`${id}:${version}`} serviceId={id} version={version || "initial"} />;
}
