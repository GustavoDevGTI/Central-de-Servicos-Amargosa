import { DraftServicePreview } from "../../../service-preview";

export const metadata = { title: "Prévia privada do serviço", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ draftId: string; service: string }> }) {
  const { draftId, service } = await params;
  return <DraftServicePreview key={draftId} draftId={draftId} slug={service} />;
}
