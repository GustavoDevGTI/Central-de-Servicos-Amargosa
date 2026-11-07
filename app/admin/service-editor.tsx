"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ServicePicker, useServiceSelection } from "./service-picker";
import type { PreviewService } from "./draft-browser";
import { serviceEditFields, type ServiceEditValues, type ServiceEditField } from "../service-edit-fields";
import type { CatalogReport } from "../../lib/catalog-db";
import { ChangesTable } from "./change-table";
import { TopicEditor } from "./topic-editor";
import { AudienceSelector } from "./audience-selector";
import { ServicePreviewFrame } from "./service-preview-frame";
import { editorFieldGroups, type ServiceFieldOrder } from "./service-field-order";
import type { TopicList } from "../service-topics";
import { ServicePreviewSession } from "./service-preview-session";
import { CollectionScheduleEditor } from "./collection-schedule-editor";

type Loaded = { version: number | null; service: { id: string; slug: string; title: string; sourceRow?: number; specialEditor?: "collection"; fields: ServiceEditValues } };
type Comparison = { draftId?: string; identical?: boolean; report: CatalogReport; affectedIds?: string[] };
type PreviewInput = { key: string; body: string };
async function json<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body as T;
}
async function preparePreview(input: PreviewInput) {
  return json<Comparison>(await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: input.body }));
}

export function ServiceEditor({ onSaved, onDirtyChange }: { onSaved: () => Promise<void>; onDirtyChange: (dirty: boolean) => void }) {
  const [services, setServices] = useState<PreviewService[]>([]);
  const selection = useServiceSelection(services);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [fields, setFields] = useState<ServiceEditValues | null>(null);
  const [preparedComparison, setComparison] = useState<(Comparison & { key: string }) | null>(null);
  const [previewSession] = useState(() => new ServicePreviewSession<Comparison>(async (id) => {
    const response = await fetch(`/api/admin/drafts/${encodeURIComponent(id)}`, { method: "DELETE", keepalive: true });
    if (!response.ok) throw new Error("Prévia não descartada.");
  }));
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mobile, setMobile] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const [topicModels, setTopicModels] = useState<Partial<Record<ServiceEditField, TopicList>>>({});
  const [fieldOrder, setFieldOrder] = useState<ServiceFieldOrder>(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem("admin-service-editor-field-order") === "bagov" ? "bagov" : "central"; }
    catch { return "central"; }
  });
  const [sideBySide, setSideBySide] = useState(() => {
    try { return typeof window === "undefined" || window.localStorage.getItem("admin-service-editor-layout") !== "stacked"; }
    catch { return true; }
  });
  const [previewView, setPreviewView] = useState<"before" | "after" | "both">("both");
  const workspaceRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLElement>(null);
  const previewInput = useMemo(() => {
    if (!fields || !loaded) return null;
    const changed = serviceEditFields.filter((field) => fields[field.key] !== loaded.service.fields[field.key]);
    if (!changed.length) return null;
    const body = JSON.stringify({ serviceId: loaded.service.id, baseVersion: loaded.version, fields: Object.fromEntries(changed.map(({ key }) => [key, fields[key]])) });
    return { key: body, body };
  }, [fields, loaded]);
  const dirty = Boolean(previewInput);
  const comparison = preparedComparison?.key === previewInput?.key ? preparedComparison : null;
  function chooseFieldOrder(order: ServiceFieldOrder) {
    setFieldOrder(order);
    try { window.localStorage.setItem("admin-service-editor-field-order", order); } catch { /* Keep the selection for this session. */ }
  }
  function chooseLayout(parallel: boolean) {
    setSideBySide(parallel);
    try { window.localStorage.setItem("admin-service-editor-layout", parallel ? "parallel" : "stacked"); } catch { /* The layout can still be switched for this session. */ }
  }
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);
  useEffect(() => () => previewSession.clear(), [previewSession]);
  useEffect(() => {
    if (!previewInput) { previewSession.clear(); return; }
    if (busy) return;
    let active = true;
    // Wait for a short typing pause, without disabling fields or moving the page.
    const timer = window.setTimeout(() => {
      void previewSession.read(previewInput.key, () => preparePreview(previewInput)).then((result) => {
        if (active) setComparison({ ...result, key: previewInput.key });
      }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível atualizar a prévia."); });
    }, 650);
    return () => { active = false; window.clearTimeout(timer); };
  }, [previewInput, busy, previewSession]);
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
    previewSession.clear();
    setBusy(true); setError(""); setMessage("");
    try {
      const data = await json<Loaded>(await fetch(`/api/admin/services/${encodeURIComponent(selection.selected.id)}`, { cache: "no-store" }));
      setLoaded(data); setFields(data.service.fields); setEditorRevision((revision) => revision + 1); setComparison(null);
      setTopicModels({});
      setPreviewView("both");
      if (sideBySide) requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ block: "start" }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Serviço indisponível."); }
    finally { setBusy(false); }
  }
  function change(key: ServiceEditField, value: string) { if (saveInFlight.current) return; setFields((old) => old && ({ ...old, [key]: value })); setError(""); setMessage(""); }
  async function save() {
    if (saveInFlight.current || !loaded || !previewInput) return;
    saveInFlight.current = true;
    setBusy(true); setSaving(true); setError(""); setMessage("");
    try {
      const latest = await previewSession.read(previewInput.key, () => preparePreview(previewInput));
      if (!latest.draftId) { setMessage("Nenhuma alteração para salvar."); return; }
      await json(await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId: latest.draftId }) }));
      previewSession.clear();
      const data = await json<Loaded>(await fetch(`/api/admin/services/${encodeURIComponent(loaded.service.id)}`, { cache: "no-store" }));
      setLoaded(data); setFields(data.service.fields); setEditorRevision((revision) => revision + 1); setComparison(null); setMessage("Alterações salvas na Central.");
      setTopicModels({});
      const affected = new Set(latest.affectedIds || [data.service.id]);
      setServices((old) => old.map((s) => affected.has(s.id) ? { ...s, title: data.service.title, inactive: data.service.fields.status === "Inativo" } : s));
      await onSaved();
    } catch (reason) { previewSession.clear(); setComparison(null); setError(reason instanceof Error ? reason.message : "Falha ao salvar."); }
    finally {
      saveInFlight.current = false; setBusy(false); setSaving(false);
      requestAnimationFrame(() => { compareRef.current?.scrollTo({ top: 0 }); compareRef.current?.scrollIntoView({ block: "start" }); });
    }
  }
  function undo() {
    if (busy || saveInFlight.current || !loaded) return;
    previewSession.clear();
    setFields(loaded.service.fields); setTopicModels({});
    setEditorRevision((revision) => revision + 1); setComparison(null);
    setError(""); setMessage("Alterações desfeitas.");
  }
  function fieldControl(field: typeof serviceEditFields[number]) {
    if (!fields) return null;
    const id = `edit-${field.key}`;
    const name = "stage" in field ? `${field.stage} · ${field.label}` : field.label;
    if (field.key === "collectionSchedule") return <CollectionScheduleEditor key={`${editorRevision}:${field.key}`} value={fields.collectionSchedule} onChange={(value) => change("collectionSchedule", value)} />;
    if (field.key === "audience") return <AudienceSelector key={field.key} value={fields.audience} onChange={(value) => change("audience", value)} />;
    if ("list" in field) return <TopicEditor key={`${editorRevision}:${field.key}`} id={id} label={field.label} name={name} value={fields[field.key]} mode={field.list} model={topicModels[field.key]} onModelChange={(model) => setTopicModels((old) => ({ ...old, [field.key]: model }))} onChange={(value) => change(field.key, value)} />;
    if ("multiple" in field) return <fieldset className="admin-editor-modalities" key={field.key}><legend>{field.label}</legend>{field.multiple.map((option) => <label key={option}><input type="checkbox" checked={fields[field.key].split("\n").includes(option)} onChange={(event) => { const selected = new Set(fields[field.key].split("\n").filter(Boolean)); if (event.target.checked) selected.add(option); else selected.delete(option); change(field.key, field.multiple.filter((value) => selected.has(value)).join("\n")); }} />{option}</label>)}</fieldset>;
    return <label key={field.key} htmlFor={id}><span>{field.label}</span>{"options" in field
      ? <select id={id} aria-label={name} value={fields[field.key]} onChange={(event) => change(field.key, event.target.value)}>{field.options.map((option) => <option key={option} value={option}>{option || "Não informado."}</option>)}</select>
      : "url" in field ? <input id={id} aria-label={name} type="url" value={fields[field.key]} maxLength={2048} onChange={(event) => change(field.key, event.target.value)} />
        : <textarea id={id} aria-label={name} value={fields[field.key]} rows={field.rows} maxLength={field.key === "title" ? 300 : 20000} required={field.key === "title"} onChange={(event) => change(field.key, event.target.value)} />}</label>;
  }
  const currentPreviewUrl = loaded ? `/admin/preview/current/${encodeURIComponent(loaded.service.id)}?version=${loaded.version ?? "initial"}` : "";
  const beforeUrl = currentPreviewUrl;
  const afterUrl = dirty && preparedComparison?.draftId && loaded ? `/admin/preview/${preparedComparison.draftId}/${encodeURIComponent(loaded.service.slug)}` : currentPreviewUrl;
  const saveStatus = message || (!dirty ? "Nenhuma alteração pendente." : saving ? "Salvando alterações…" : error ? "Alterações não salvas. Verifique o aviso e tente salvar novamente." : comparison?.identical ? "Nenhuma alteração para salvar." : comparison?.draftId ? "Prévia atualizada. Alterações ainda não salvas." : "Atualizando prévia…");
  const undoAction = <button type="button" disabled={busy || !dirty} onClick={undo}>Desfazer alterações</button>;
  const actions = <div className="admin-editor-actions">
    <p id="editor-save-status" role="status">{saveStatus}</p>
    <div className="admin-preview-actions">
    <button className="admin-primary-action" type="button" aria-describedby="editor-save-status" disabled={busy || !dirty} onClick={() => void save()}>{saving ? "Salvando…" : "Salvar alterações"}</button>
    {undoAction}
    </div>
  </div>;
  return <>
    <div className="admin-preview-actions admin-editor-layout-switch" role="group" aria-label="Organização do editor">
      <button type="button" aria-pressed={sideBySide} onClick={() => chooseLayout(true)}>Lado a lado</button>
      <button type="button" aria-pressed={!sideBySide} onClick={() => chooseLayout(false)}>Vertical</button>
    </div>
    <div ref={workspaceRef} className={`admin-editor-workspace${sideBySide && loaded ? " admin-editor-workspace-parallel" : ""}`}>
    <section className="admin-section" aria-labelledby="edit-service-title">
      <h2 id="edit-service-title">Editar serviço</h2>
      <ServicePicker id="admin-edit-service" selection={selection} totalCount={services.length} />
      <div className="admin-preview-actions"><button type="button" disabled={busy || !selection.selected} onClick={() => void openService()}>Editar serviço selecionado</button></div>
      {!loaded && error && <p className="admin-error" role="alert">{error}</p>}
      {loaded && fields && <div className="admin-service-editor">
        <h3>{loaded.service.title}</h3>
        <div className="admin-preview-actions admin-editor-field-order" role="group" aria-label="Ordem dos campos">
          <span>Ordem dos campos</span>
          <button type="button" aria-pressed={fieldOrder === "central"} onClick={() => chooseFieldOrder("central")}>Central</button>
          <button type="button" aria-pressed={fieldOrder === "bagov"} onClick={() => chooseFieldOrder("bagov")}>BA.GOV</button>
        </div>
        <p className="admin-editor-fixed">Os textos e o formato dos botões são fixos.</p>
        <fieldset disabled={busy} className="admin-editor-fields">
          <legend className="sr-only">Campos do serviço</legend>
          {editorFieldGroups(fieldOrder, { workbookSource: loaded.service.sourceRow !== undefined, mainLegislation: Boolean(loaded.service.fields.legislation), attendanceMode: fields.attendanceUnitMode, collectionSchedule: loaded.service.specialEditor === "collection" }).map((group) => <details className="admin-editor-group" key={group.key} open>
            <summary>{group.label}</summary>
            {group.blocks.filter((block) => !block.hidden).map((block) => {
              const controls = block.fields.map((key) => fieldControl(serviceEditFields.find((field) => field.key === key)!));
              return block.legend ? <fieldset className="admin-editor-stage" key={block.key}><legend>{block.legend}</legend>{controls}</fieldset> : <Fragment key={block.key}>{controls}</Fragment>;
            })}
          </details>)}
        </fieldset>
        {actions}
      </div>}
    </section>
    {loaded && <section ref={compareRef} className="admin-section" aria-labelledby="editor-compare-title">
      <h2 id="editor-compare-title">Comparação antes de salvar</h2>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p id="editor-comparison-status" className={message ? "admin-success" : undefined} role="status">{saveStatus}</p>
      <div className="admin-preview-actions admin-editor-publish-actions"><button className="admin-primary-action" type="button" aria-describedby="editor-comparison-status" disabled={busy || !dirty} onClick={() => void save()}>{saving ? "Salvando…" : "Salvar alterações"}</button>{undoAction}</div>
      {(comparison?.affectedIds?.length || 0) > 1 && <p>Esta edição atualiza {comparison!.affectedIds!.length} páginas vinculadas ao mesmo serviço.</p>}
      <div className="admin-preview-actions"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>Computador</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>Celular</button></div>
      {sideBySide && <div className="admin-preview-actions" role="group" aria-label="Visualização da comparação">
        <button type="button" aria-pressed={previewView === "before"} onClick={() => setPreviewView("before")}>Antes</button>
        <button type="button" aria-pressed={previewView === "after"} onClick={() => setPreviewView("after")}>Depois</button>
        <button type="button" aria-pressed={previewView === "both"} onClick={() => setPreviewView("both")}>Antes e depois</button>
      </div>}
      <div aria-busy={dirty && !comparison && !error} className={`admin-preview-pages admin-preview-compare${sideBySide && previewView !== "both" ? " admin-preview-pages-single" : ""}`}>
        {(!sideBySide || previewView !== "after") && <div><h3>Antes</h3><ServicePreviewFrame mobile={mobile} src={beforeUrl} title={`Antes: ${loaded.service.title}`} /></div>}
        {(!sideBySide || previewView !== "before") && <div><h3>Depois</h3><ServicePreviewFrame mobile={mobile} src={afterUrl} title={`Depois: ${loaded.service.title}`} /></div>}
      </div>
      {comparison?.draftId && <details className="admin-change-details" open><summary>Ver diferenças por campo ({comparison.report.changes.length})</summary><ChangesTable changes={comparison.report.changes} /></details>}
    </section>}
    </div>
  </>;
}
