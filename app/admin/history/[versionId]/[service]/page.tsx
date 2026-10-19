import { VersionServicePreview } from "../../../service-preview";

export const metadata = { title: "Página do serviço no histórico", robots: { index: false, follow: false } };

export default async function HistoryPreviewPage({ params }: { params: Promise<{ versionId: string; service: string }> }) {
  const { versionId, service } = await params;
  return <VersionServicePreview key={versionId} versionId={versionId} slug={service} />;
}
