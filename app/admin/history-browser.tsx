"use client";

import { useEffect, useId, useState } from "react";
import type { PreviewService } from "./draft-browser";
import { ServicePicker, useServiceSelection } from "./service-picker";

type HistoryPreview = { versionId: string; previousVersionId: string | null; services: PreviewService[]; previousServices: PreviewService[] };

export function HistoryBrowser({ versionId, changedRows }: { versionId: string; changedRows: number[] }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<HistoryPreview | null>(null);
  const [error, setError] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(true);
  const [compare, setCompare] = useState(true);
  const [mobile, setMobile] = useState(false);
  const controlId = useId();
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetch(`/api/admin/history/${encodeURIComponent(versionId)}/preview`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as HistoryPreview & { error?: string };
        if (!response.ok) throw new Error(body.error || "Prévia indisponível.");
        if (!controller.signal.aborted) setData(body);
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Prévia indisponível."); });
    return () => controller.abort();
  }, [open, versionId]);
  // Retain services removed by a restoration, and match pages by their explicit catalog ID.
  const available = [...new Map([...(data?.previousServices || []), ...(data?.services || [])].map((service) => [service.id, service])).values()]
    .filter((service) => !onlyChanged || changedRows.includes(service.sourceRow || 0));
  const selection = useServiceSelection(available);
  const { selected, query } = selection;
  const before = data?.previousServices.find((service) => service.id === selected?.id && !service.inactive);
  const after = data?.services.find((service) => service.id === selected?.id && !service.inactive);
  const url = (id: string, service: PreviewService) => `/admin/history/${encodeURIComponent(id)}/${encodeURIComponent(service.slug || service.id)}`;
  const frameClass = `admin-service-frame${mobile ? " admin-frame-mobile" : ""}`;
  return <div className="admin-history-browser">
    <div className="admin-preview-actions"><button type="button" aria-expanded={open} aria-controls={controlId} onClick={() => { setError(""); setOpen(!open); }}>{open ? "Ocultar comparação visual" : "Visualizar páginas e comparar"}</button></div>
    {open && <section id={controlId} className="admin-draft-browser" aria-label={`Comparação visual da versão ${versionId}`}>
      <h3>Páginas da versão {versionId}</h3>
      {error ? <p className="admin-error" role="alert">{error}</p> : !data ? <p role="status">Carregando páginas…</p> : <>
        <div className="admin-preview-controls">
          <label className="admin-preview-filter"><input type="checkbox" checked={onlyChanged} onChange={(event) => setOnlyChanged(event.target.checked)} /> Somente serviços com alterações</label>
          <ServicePicker id={`${controlId}-service`} selection={selection} totalCount={available.length} />
          <div className="admin-preview-actions">
            <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button>
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button>
            <label><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} /> Comparar com a versão anterior</label>
            {after && <a href={url(versionId, after)} target="_blank" rel="noreferrer">Abrir página desta versão em outra aba</a>}
          </div>
        </div>
        {!selected ? <p>{query.trim() ? "Nenhum serviço encontrado. Tente outro nome, URL ou ID, ou desmarque o filtro de alterações." : "Nenhuma página neste filtro. Desmarque o filtro para conferir todos os serviços."}</p> : <div className={`admin-preview-pages${compare ? " admin-preview-compare" : ""}`}>
          {compare && <div><h4>Antes{data.previousVersionId ? ` · versão ${data.previousVersionId}` : ""}</h4>
            {!data.previousVersionId ? <p>Sem versão anterior.</p> : !before ? <p>Serviço não publicado na versão anterior.</p> : <><p className="admin-preview-path">/servicos/{before.slug}</p><iframe key={url(data.previousVersionId, before)} className={frameClass} src={url(data.previousVersionId, before)} title={`Antes · versão ${data.previousVersionId}: ${before.title}`} /></>}
          </div>}
          <div><h4>Depois · versão {versionId}</h4>{!after ? <p>Serviço não publicado nesta versão.</p> : <><p className="admin-preview-path">/servicos/{after.slug}</p><iframe key={url(versionId, after)} className={frameClass} src={url(versionId, after)} title={`Depois · versão ${versionId}: ${after.title}`} /></>}</div>
        </div>}
      </>}
    </section>}
  </div>;
}
