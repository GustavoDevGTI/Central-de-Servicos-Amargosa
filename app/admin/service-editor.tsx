"use client";
import { useEffect, useRef, useState } from "react";
import { ServicePicker, useServiceSelection } from "./service-picker";
import type { PreviewService } from "./draft-browser";
import { serviceEditFields, serviceEditGroups, type ServiceEditValues, type ServiceEditField } from "../service-edit-fields";
import type { CatalogReport } from "../../lib/catalog-db";
import { ChangesTable } from "./change-table";
import { TopicEditor } from "./topic-editor";

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
  const [editorRevision, setEditorRevision] = useState(0);
  const [sideBySide, setSideBySide] = useState(() => {
    try { return typeof window === "undefined" || window.localStorage.getItem("admin-service-editor-layout") !== "stacked"; }
    catch { return true; }
  });
  const [previewView, setPreviewView] = useState<"before" | "after" | "both">("after");
  const workspaceRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLElement>(null);
  const dirtyKeys = fields && loaded ? serviceEditFields.filter((f) => fields[f.key] !== loaded.service.fields[f.key]).map((f) => f.key) : [];
  const dirty = dirtyKeys.length > 0;
  function chooseLayout(parallel: boolean) {
    setSideBySide(parallel);
    try { window.localStorage.setItem("admin-service-editor-layout", parallel ? "parallel" : "stacked"); } catch { /* The layout can still be switched for this session. */ }
  }
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
      setLoaded(data); setFields(data.service.fields); setEditorRevision((revision) => revision + 1); setComparison(null);
      if (sideBySide) requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ block: "start" }));
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
      requestAnimationFrame(() => {
        if (sideBySide && window.matchMedia("(min-width: 1200px)").matches) compareRef.current?.scrollTo({ top: 0 });
        else compareRef.current?.scrollIntoView({ block: "start" });
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha na comparação."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!loaded || !comparison?.draftId || !dirty) return;
    setBusy(true); setError("");
    try {
      await json(await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId: comparison.draftId }) }));
      const data = await json<Loaded>(await fetch(`/api/admin/services/${encodeURIComponent(loaded.service.id)}`, { cache: "no-store" }));
      setLoaded(data); setFields(data.service.fields); setEditorRevision((revision) => revision + 1); setComparison(null); setMessage("Alterações salvas na Central.");
      const affected = new Set(comparison.affectedIds || [data.service.id]);
      setServices((old) => old.map((s) => affected.has(s.id) ? { ...s, title: data.service.title, inactive: data.service.fields.status === "Inativo" } : s));
      await onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }
  function fieldControl(field: typeof serviceEditFields[number]) {
    if (!fields) return null;
    const id = `edit-${field.key}`;
    const name = "stage" in field ? `${field.stage} · ${field.label}` : field.label;
    if ("list" in field) return <TopicEditor key={`${editorRevision}:${field.key}`} id={id} label={field.label} name={name} value={fields[field.key]} mode={field.list} onChange={(value) => change(field.key, value)} />;
    if ("multiple" in field) return <fieldset className="admin-editor-modalities" key={field.key}><legend>{field.label}</legend>{field.multiple.map((option) => <label key={option}><input type="checkbox" checked={fields[field.key].split("\n").includes(option)} onChange={(event) => { const selected = new Set(fields[field.key].split("\n").filter(Boolean)); if (event.target.checked) selected.add(option); else selected.delete(option); change(field.key, field.multiple.filter((value) => selected.has(value)).join("\n")); }} />{option}</label>)}</fieldset>;
    return <label key={field.key} htmlFor={id}><span>{field.label}</span>{"options" in field
      ? <select id={id} aria-label={name} value={fields[field.key]} onChange={(event) => change(field.key, event.target.value)}>{field.options.map((option) => <option key={option} value={option}>{option || "Não informado."}</option>)}</select>
      : "url" in field ? <input id={id} aria-label={name} type="url" value={fields[field.key]} maxLength={2048} onChange={(event) => change(field.key, event.target.value)} />
        : <textarea id={id} aria-label={name} value={fields[field.key]} rows={field.rows} maxLength={field.key === "title" ? 300 : 20000} required={field.key === "title"} onChange={(event) => change(field.key, event.target.value)} />}</label>;
  }
  const actions = <div className="admin-preview-actions admin-editor-save-actions">
    <button type="button" disabled={busy || !dirty} onClick={() => void compare()}>{busy ? "Aguarde…" : "Comparar antes e depois"}</button>
    <button type="button" disabled={busy || !dirty || !comparison?.draftId} onClick={() => void save()}>Salvar alterações</button>
    <button type="button" disabled={busy || !dirty} onClick={() => { if (!loaded) return; setFields(loaded.service.fields); setEditorRevision((revision) => revision + 1); setComparison(null); setError(""); }}>Descartar edição</button>
  </div>;
  return <>
    <div className="admin-preview-actions admin-editor-layout-switch" role="group" aria-label="Organização do editor">
      <button type="button" aria-pressed={sideBySide} onClick={() => chooseLayout(true)}>Lado a lado</button>
      <button type="button" aria-pressed={!sideBySide} onClick={() => chooseLayout(false)}>Formato anterior</button>
    </div>
    <div ref={workspaceRef} className={`admin-editor-workspace${sideBySide && loaded ? " admin-editor-workspace-parallel" : ""}`}>
    <section className="admin-section" aria-labelledby="edit-service-title">
      <h2 id="edit-service-title">Editar serviço</h2>
      <ServicePicker id="admin-edit-service" selection={selection} totalCount={services.length} />
      <div className="admin-preview-actions"><button type="button" disabled={busy || !selection.selected} onClick={() => void openService()}>Editar serviço selecionado</button></div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
      {loaded && fields && <div className="admin-service-editor">
        <h3>{loaded.service.title}</h3>
        <p className="admin-editor-fixed">Os textos e o formato dos botões são fixos.</p>
        {sideBySide && <div className="admin-editor-parallel-actions">{actions}</div>}
        <fieldset disabled={busy} className="admin-editor-fields">
          <legend className="sr-only">Campos do serviço</legend>
          {serviceEditGroups.map((group, index) => <details className="admin-editor-group" key={group} open>
            <summary>{group}</summary>
            {serviceEditFields.filter((field) => field.group === index && !("stage" in field) && field.key !== "additional").map(fieldControl)}
            {["Etapa 1 - solicitação", "Etapa 2 - análise e conclusão"].map((stage) => {
              const items = serviceEditFields.filter((field) => field.group === index && "stage" in field && field.stage === stage);
              return items.length ? <fieldset className="admin-editor-stage" key={stage}><legend>{stage}</legend>{items.map(fieldControl)}</fieldset> : null;
            })}
            {serviceEditFields.filter((field) => field.group === index && field.key === "additional").map(fieldControl)}
          </details>)}
        </fieldset>
        <div className="admin-editor-bottom-actions">{actions}</div>
      </div>}
    </section>
    {loaded && (sideBySide || comparison?.draftId) && <section ref={compareRef} className="admin-section" aria-labelledby="editor-compare-title">
      <h2 id="editor-compare-title">Comparação antes de salvar</h2>
      {comparison?.draftId ? <>
      {(comparison.affectedIds?.length || 0) > 1 && <p>Esta edição atualiza {comparison.affectedIds!.length} páginas vinculadas ao mesmo serviço.</p>}
      <div className="admin-preview-actions"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button></div>
      {sideBySide && <div className="admin-preview-actions" role="group" aria-label="Visualização da comparação">
        <button type="button" aria-pressed={previewView === "before"} onClick={() => setPreviewView("before")}>Antes</button>
        <button type="button" aria-pressed={previewView === "after"} onClick={() => setPreviewView("after")}>Depois</button>
        <button type="button" aria-pressed={previewView === "both"} onClick={() => setPreviewView("both")}>Antes e depois</button>
      </div>}
      <div className={`admin-preview-pages admin-preview-compare${sideBySide && previewView !== "both" ? " admin-preview-pages-single" : ""}`}>
        {(!sideBySide || previewView !== "after") && <div><h3>Antes</h3><iframe className={`admin-service-frame${mobile ? " admin-frame-mobile" : ""}`} src={`/admin/preview/${comparison.draftId}/${encodeURIComponent(loaded.service.slug)}/before`} title={`Antes: ${loaded.service.title}`} /></div>}
        {(!sideBySide || previewView !== "before") && <div><h3>Depois</h3><iframe className={`admin-service-frame${mobile ? " admin-frame-mobile" : ""}`} src={`/admin/preview/${comparison.draftId}/${encodeURIComponent(loaded.service.slug)}`} title={`Depois: ${loaded.service.title}`} /></div>}
      </div>
      <details className="admin-change-details" open><summary>Ver diferenças por campo ({comparison.report.changes.length})</summary><ChangesTable changes={comparison.report.changes} /></details>
      <div className="admin-preview-actions"><button type="button" disabled={busy || !dirty} onClick={() => void save()}>Salvar alterações</button></div>
      </> : <p className="admin-editor-comparison-empty">Compare as alterações para ver a prévia.</p>}
    </section>}
    </div>
  </>;
}
