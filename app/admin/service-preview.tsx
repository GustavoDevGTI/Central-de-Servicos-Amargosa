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

export function CurrentServicePreview({ serviceId, version }: { serviceId: string; version: string }) {
  return <ServiceSnapshotPreview apiUrl={`/api/admin/services/${encodeURIComponent(serviceId)}?preview=1&version=${encodeURIComponent(version)}`} serviceId={serviceId} banner="Edição atual em uso" />;
}

function ServiceSnapshotPreview({ apiUrl, slug, serviceId, banner }: { apiUrl: string; slug?: string; serviceId?: string; banner: string }) {
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
          setServices(body.services);
          setActive(body.active === true);
        }
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Prévia indisponível."); });
    return () => controller.abort();
  }, [apiUrl]);
  const service = services?.find((entry) => serviceId ? entry.id === serviceId : (entry.slug || entry.id) === slug);
  return <>
    <div className={`admin-preview-banner${active ? " admin-preview-banner-current" : ""}`} role="status">{active ? "Edição atual em uso" : banner}</div>
    {service?.inactive && <p className="admin-preview-banner" role="status">Serviço inativo · página oculta na Central</p>}
    {error ? <p className="admin-error" role="alert">{error} <a href="/admin" target="_top">Voltar ao admin</a></p>
      : !services ? <p role="status">Carregando página…</p>
      : !service ? <p role="alert">Serviço não encontrado nesta prévia.</p>
      : <CatalogPreviewProvider services={services}><ServiceDetail slug={service.slug || service.id} initialService={service} /></CatalogPreviewProvider>}
  </>;
}
