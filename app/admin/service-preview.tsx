"use client";

import { useEffect, useState } from "react";
import { CatalogPreviewProvider } from "../catalog-provider";
import { ServiceDetail } from "../internal-portal";
import type { Service } from "../service-catalog";
import "./admin.css";

export function DraftServicePreview({ draftId, slug, before = false }: { draftId: string; slug: string; before?: boolean }) {
  return <ServiceSnapshotPreview apiUrl={`/api/admin/drafts/${encodeURIComponent(draftId)}${before ? "?view=before" : ""}`} slug={slug} banner={before ? "Antes da edição" : "Prévia privada · conteúdo ainda não publicado"} />;
}

export function VersionServicePreview({ versionId, slug }: { versionId: string; slug: string }) {
  return <ServiceSnapshotPreview apiUrl={`/api/admin/history/${encodeURIComponent(versionId)}/preview`} slug={slug} banner={`Histórico privado · versão ${versionId}`} />;
}

function ServiceSnapshotPreview({ apiUrl, slug, banner }: { apiUrl: string; slug: string; banner: string }) {
  const [services, setServices] = useState<Service[] | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch(apiUrl, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { services?: Service[]; active?: boolean; error?: string };
        if (!response.ok || !Array.isArray(body.services)) throw new Error(body.error || "Prévia indisponível.");
        if (!controller.signal.aborted) {
          setServices(body.services.filter((service) => !service.inactive));
          setActive(body.active === true);
        }
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Prévia indisponível."); });
    return () => controller.abort();
  }, [apiUrl]);
  const service = services?.find((entry) => (entry.slug || entry.id) === slug);
  return <>
    <div className={`admin-preview-banner${active ? " admin-preview-banner-current" : ""}`} role="status">{active ? "Edição atual em uso" : banner}</div>
    {error ? <p className="admin-error" role="alert">{error} <a href="/admin" target="_top">Voltar ao admin</a></p>
      : !services ? <p role="status">Carregando página…</p>
      : !service ? <p role="alert">Este serviço não está ativo nesta prévia.</p>
      : <CatalogPreviewProvider services={services}><ServiceDetail slug={slug} initialService={service} /></CatalogPreviewProvider>}
  </>;
}
