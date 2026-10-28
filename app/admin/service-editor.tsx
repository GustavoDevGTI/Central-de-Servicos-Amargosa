"use client";
import { useEffect, useRef, useState } from "react";
import { ServicePicker, useServiceSelection } from "./service-picker";
import type { PreviewService } from "./draft-browser";
import { serviceEditFields, type ServiceEditValues, type ServiceEditField } from "../service-edit-fields";
import type { CatalogReport } from "../../lib/catalog-db";
import { ChangesTable } from "./change-table";

type Loaded = { version: number | null; service: { id: string; slug: string; title: string; fields: ServiceEditValues } };
type Comparison = { draftId?: string; identical?: boolean; report: CatalogReport; affectedIds?: string[] };
async function json<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body as T;
}

export function ServiceEditor({ onSaved, onDirtyChange }: { onSaved: () => Promise<void>; onDirtyChange: (dirty: boolean) => void }) {
  const [services, setServices] = useState<PreviewService[]>([]);
  const selection = useServiceSelection(services);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [fields, setFields] = useState<ServiceEditValues | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mobile, setMobile] = useState(false);
  const compareRef = useRef<HTMLDivElement>(null);
  const dirtyKeys = fields && loaded ? serviceEditFields.filter((f) => fields[f.key] !== loaded.service.fields[f.key]).map((f) => f.key) : [];
  const dirty = dirtyKeys.length > 0;
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/services", { cache: "no-store", signal: controller.signal }).then(json<{ services: PreviewService[] }>).then((data) => setServices(data.services)).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Serviços indisponíveis."); });
    return () => controller.abort();
  }, []);
  async function openService() {
    if (!selection.selected || (dirty && !window.confirm("Descartar as alterações não salvas deste serviço?"))) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await json<Loaded>(await fetch(`/api/admin/services/${encodeURIComponent(selection.selected.id)}`, { cache: "no-store" }));
      setLoaded(data); setFields(data.service.fields); setComparison(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Serviço indisponível."); }
    finally { setBusy(false); }
  }
  function change(key: ServiceEditField, value: string) { setFields((old) => old && ({ ...old, [key]: value })); setComparison(null); setMessage(""); }
  async function compare() {
    if (!loaded || !fields || !dirty) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await json<Comparison>(await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: loaded.service.id, baseVersion: loaded.version, fields: Object.fromEntries(dirtyKeys.map((key) => [key, fields[key]])) }) }));
      setComparison(result);
      if (result.identical) setMessage("Nenhuma alteração para salvar.");
      requestAnimationFrame(() => compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha na comparação."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!loaded || !comparison?.draftId || !dirty) return;
    setBusy(true); setError("");
    try {
      await json(await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId: comparison.draftId }) }));
      const data = await json<Loaded>(await fetch(`/api/admin/services/${encodeURIComponent(loaded.service.id)}`, { cache: "no-store" }));
      setLoaded(data); setFields(data.service.fields); setComparison(null); setMessage("Alterações salvas na Central.");
      const affected = new Set(comparison.affectedIds || [data.service.id]);
      setServices((old) => old.map((s) => affected.has(s.id) ? { ...s, title: data.service.title } : s));
      await onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }
  return <>
    <section className="admin-section" aria-labelledby="edit-service-title">
      <h2 id="edit-service-title">Editar serviço</h2>
      <ServicePicker id="admin-edit-service" selection={selection} totalCount={services.length} />
      <div className="admin-preview-actions"><button type="button" disabled={busy || !selection.selected} onClick={() => void openService()}>Editar serviço selecionado</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
      {loaded && fields && <div className="admin-service-editor">
        <h3>{loaded.service.title}</h3>
        <p className="admin-editor-fixed">Os botões de início e ajuda são fixos.</p>
        <fieldset disabled={busy} className="admin-editor-fields">
          <legend className="sr-only">Campos do serviço</legend>
          {["Informações do serviço", "Atendimento", "Quer saber mais?"].map((group) => <details className="admin-editor-group" key={group} open>
            <summary>{group}</summary>
            {serviceEditFields.filter((f) => f.group === group).map((field) => <label key={field.key} htmlFor={`edit-${field.key}`}>
              <span>{field.label}</span>
              <textarea id={`edit-${field.key}`} value={fields[field.key]} rows={field.rows} maxLength={field.key === "title" ? 300 : 20000} required={field.key === "title"} onChange={(e) => change(field.key, e.target.value)} />
            </label>)}
          </details>)}
        </fieldset>
        <div className="admin-preview-actions">
          <button type="button" disabled={busy || !dirty} onClick={() => void compare()}>{busy ? "Aguarde…" : "Comparar antes e depois"}</button>
          <button type="button" disabled={busy || !dirty || !comparison?.draftId} onClick={() => void save()}>Salvar alterações</button>
          <button type="button" disabled={busy || !dirty} onClick={() => { setFields(loaded.service.fields); setComparison(null); setError(""); }}>Descartar edição</button>
        </div>
      </div>}
    </section>
    {comparison?.draftId && loaded && <section ref={compareRef} className="admin-section" aria-labelledby="editor-compare-title">
      <h2 id="editor-compare-title">Comparação antes de salvar</h2>
      {(comparison.affectedIds?.length || 0) > 1 && <p>Esta edição atualiza {comparison.affectedIds!.length} páginas vinculadas ao mesmo serviço.</p>}
      <div className="admin-preview-actions"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button></div>
      <div className="admin-preview-pages admin-preview-compare">
        <div><h3>Antes</h3><iframe className={`admin-service-frame${mobile ? " admin-frame-mobile" : ""}`} src={`/admin/preview/${comparison.draftId}/${encodeURIComponent(loaded.service.slug)}/before`} title={`Antes: ${loaded.service.title}`} /></div>
        <div><h3>Depois</h3><iframe className={`admin-service-frame${mobile ? " admin-frame-mobile" : ""}`} src={`/admin/preview/${comparison.draftId}/${encodeURIComponent(loaded.service.slug)}`} title={`Depois: ${loaded.service.title}`} /></div>
      </div>
      <details className="admin-change-details" open><summary>Ver diferenças por campo ({comparison.report.changes.length})</summary><ChangesTable changes={comparison.report.changes} /></details>
      <div className="admin-preview-actions"><button type="button" disabled={busy || !dirty} onClick={() => void save()}>Salvar alterações</button></div>
    </section>}
  </>;
}
