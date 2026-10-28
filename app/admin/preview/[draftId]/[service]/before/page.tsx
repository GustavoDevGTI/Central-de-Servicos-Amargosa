import { DraftServicePreview } from "../../../../service-preview";
export const metadata = { title: "Comparação privada do serviço", robots: { index: false, follow: false } };
export default async function BeforePage({ params }: { params: Promise<{ draftId: string; service: string }> }) {
  const { draftId, service } = await params;
  return <DraftServicePreview draftId={draftId} slug={service} before />;
}
