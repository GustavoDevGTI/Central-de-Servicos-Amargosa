"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminAuthClient } from "./auth-client";
import { OFFICIAL_CATALOG_LINK } from "../../lib/catalog-source-url";
import { DraftBrowser, type PreviewService } from "./draft-browser";
import { HistoryBrowser } from "./history-browser";
import { DiagnosticsPanel } from "./diagnostics-panel";
import { AiUsagePanel } from "./ai-usage-panel";
import { UsersPanel } from "./users-panel";
import { canManageUsers, type AdminRole } from "../../lib/admin-permissions";
import "./admin.css";

type Change = { serviceId: string; serviceTitle: string; kind: string; column?: string; before?: string | null; after?: string | null; sourceRow?: number };
type Report = { created: number; updated: number; deactivated: number; reactivated: number; columnsAdded: string[]; blockers: string[]; changes: Change[] };
type Preview = { draftId?: string; identical?: boolean; report: Report; services?: PreviewService[] };
type Version = { id: string; source_filename: string; published_at: string; author_name: string | null; author_username: string | null; active: boolean; reverted_from?: string | null; report: Report };

function responsibleAccount(version: Version) {
  const name = version.author_name;
  const username = version.author_username;
  if (!username) return name || "Conta não disponível";
  return name && name.toLocaleLowerCase("pt-BR") !== username.toLocaleLowerCase("pt-BR") ? `${name} (@${username})` : name || username;
}

const kindName: Record<string, string> = {
  created: "Criado", updated: "Alterado", deactivated: "Excluído (página oculta)",
  reactivated: "Reativado", column: "Coluna nova",
};

const CATALOG_PAGE_SIZE = 10;

function visiblePages(current: number, total: number) {
  const count = Math.min(5, total);
  const start = Math.max(1, Math.min(current - 2, total - count + 1));
  return Array.from({ length: count }, (_, index) => start + index);
}

function PaginationControls({ page, totalItems, itemName, onPageChange }: {
  page: number;
  totalItems: number;
  itemName: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  if (!totalItems) return null;
  return <nav className="admin-pagination" aria-label={`Paginação de ${itemName}`}>
    <p>Exibindo {(currentPage - 1) * CATALOG_PAGE_SIZE + 1}–{Math.min(currentPage * CATALOG_PAGE_SIZE, totalItems)} de {totalItems} {itemName}</p>
    <div>
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Anterior</button>
      {visiblePages(currentPage, totalPages).map((value) => <button type="button" key={value}
        aria-label={`Página ${value}`} aria-current={value === currentPage ? "page" : undefined}
        onClick={() => onPageChange(value)}>{value}</button>)}
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Próxima</button>
    </div>
  </nav>;
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "A operação falhou.");
  return body;
}

function ChangesTable({ changes }: { changes: Change[] }) {
  const [page, setPage] = useState(1);
  if (!changes.length) return <p>Nenhuma alteração identificada.</p>;
  const totalPages = Math.max(1, Math.ceil(changes.length / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleChanges = changes.slice((currentPage - 1) * CATALOG_PAGE_SIZE, currentPage * CATALOG_PAGE_SIZE);
  return <><div className="admin-table-scroll"><table className="admin-changes-table">
    <thead><tr><th>Serviço</th><th>Tipo</th><th>Coluna</th><th>Antes</th><th>Depois</th></tr></thead>
    <tbody>{visibleChanges.map((change, index) => <tr key={`${change.serviceId}-${change.column}-${(currentPage - 1) * CATALOG_PAGE_SIZE + index}`}>
      <td><strong>{change.serviceTitle}</strong><small>ID {change.sourceRow || change.serviceId}</small></td>
      <td>{kindName[change.kind] || change.kind}</td>
      <td>{change.column || "—"}</td>
      <td className="admin-value">{change.before ?? "—"}</td>
      <td className="admin-value">{change.after ?? "—"}</td>
    </tr>)}</tbody>
  </table></div><PaginationControls page={currentPage} totalItems={changes.length} itemName="alterações" onPageChange={setPage} /></>;
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: AdminRole } | null>(null);
  const [section, setSection] = useState<"catalog" | "diagnostics" | "ai-usage" | "users">("catalog");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState(OFFICIAL_CATALOG_LINK);
  const [officialSource, setOfficialSource] = useState<{ url: string; embedUrl: string } | null>(null);
  const [showWorkbook, setShowWorkbook] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [selected, setSelected] = useState<Version | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const historyDetailRef = useRef<HTMLDivElement>(null);
  const selectedVersion = versions.find((version) => version.id === selected?.id);
  const historyTotalPages = Math.max(1, Math.ceil(versions.length / CATALOG_PAGE_SIZE));
  const currentHistoryPage = Math.min(historyPage, historyTotalPages);
  const visibleVersions = versions.slice((currentHistoryPage - 1) * CATALOG_PAGE_SIZE, currentHistoryPage * CATALOG_PAGE_SIZE);

  useEffect(() => {
    if (selected?.id) historyDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected?.id]);

  async function loadHistory() {
    const body = await responseJson<{ versions: Version[] }>(await fetch("/api/admin/history", { cache: "no-store" }));
    setVersions(body.versions);
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => {
        if (response.status === 401) { window.location.assign("/admin/login"); return null; }
        return responseJson<{ user: { id: string; name: string; role: AdminRole } }>(response);
      })
      .then((session) => { if (session && active) {
        setCurrentUser(session.user);
        setReady(true);
        void loadHistory().catch(() => setError("Não foi possível carregar o histórico."));
        void fetch("/api/admin/source", { cache: "no-store" })
          .then(responseJson<{ url: string; embedUrl: string }>)
          .then((source) => { if (active) { setOfficialSource(source); setSourceUrl(source.url); } })
          .catch(() => { if (active) setError("Planilha oficial indisponível. Você pode enviar o arquivo XLSX."); });
      } })
      .catch(() => { if (active) setError("Admin indisponível."); });
    return () => { active = false; };
  }, []);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true); setError(""); setMessage(""); setPreview(null);
    try {
      const form = new FormData();
      form.append("file", file);
      setPreview(await responseJson<Preview>(await fetch("/api/admin/upload", { method: "POST", body: form })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao analisar.");
    } finally { setBusy(false); }
  }

  async function analyzeLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage(""); setPreview(null);
    try {
      setPreview(await responseJson<Preview>(await fetch("/api/admin/import-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao buscar planilha.");
    } finally { setBusy(false); }
  }

  async function publish() {
    if (!preview?.draftId) return;
    setBusy(true); setError("");
    try {
      const result = await responseJson<{ version: number }>(await fetch("/api/admin/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: preview.draftId }),
      }));
      setMessage(`Versão ${result.version} publicada.`);
      setPreview(null); setFile(null); setHistoryPage(1); await loadHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao publicar.");
    } finally { setBusy(false); }
  }

  async function restore(version: Version) {
    if (!window.confirm(`Restaurar a versão ${version.id}? A restauração será registrada como uma nova publicação.`)) return;
    setBusy(true); setError("");
    try {
      const result = await responseJson<{ version: number; identical?: boolean }>(await fetch("/api/admin/restore", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: Number(version.id) }),
      }));
      setMessage(result.identical ? "Esta versão já corresponde ao catálogo atual." : `Versão ${result.version} publicada com o conteúdo da versão ${version.id}.`);
      setPreview(null); setSelected(null); setHistoryPage(1); await loadHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao restaurar.");
    } finally { setBusy(false); }
  }

  if (!ready) return <main className="admin-shell admin-loading" aria-live="polite">{error || "Carregando admin…"}</main>;

  return <main className="admin-shell">
    <header className="admin-topbar">
      <Link
        href={section === "catalog" ? "/" : "/admin"}
        aria-label={section === "catalog" ? "Ir para a página inicial da Central" : "Voltar ao início do admin"}
        onClick={(event) => {
          if (section === "catalog" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          setSection("catalog");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      ><Image src="/prefeitura-amargosa-logo-preta.png" alt="Prefeitura de Amargosa" width={210} height={52} unoptimized /></Link>
      <nav aria-label="Administração"><a href="/" target="_blank" rel="noreferrer">Ver a Central</a><button type="button" onClick={() => void adminAuthClient.signOut().then(() => window.location.assign("/admin/login"))}>Sair</button></nav>
    </header>
    <div className="admin-content">
      <header className="admin-page-heading"><span className="admin-kicker">Administração</span><h1>{section === "catalog" ? "Catálogo de serviços" : section === "diagnostics" ? "Diagnóstico" : section === "ai-usage" ? "Uso da Amanda" : "Usuários"}</h1></header>
      <nav className="admin-section-nav admin-preview-actions" aria-label="Seções do admin">
        <button type="button" aria-pressed={section === "catalog"} onClick={() => setSection("catalog")}>Catálogo</button>
        <button type="button" aria-pressed={section === "diagnostics"} onClick={() => setSection("diagnostics")}>Diagnóstico</button>
        <button type="button" aria-pressed={section === "ai-usage"} onClick={() => setSection("ai-usage")}>Uso da Amanda</button>
        {canManageUsers(currentUser?.role) && <button type="button" aria-pressed={section === "users"} onClick={() => setSection("users")}>Usuários</button>}
      </nav>
      {section === "diagnostics" && <DiagnosticsPanel />}
      {section === "ai-usage" && <AiUsagePanel />}
      {section === "users" && currentUser && canManageUsers(currentUser.role) && <UsersPanel currentUserId={currentUser.id} />}
      {section === "catalog" && <>
      {message && <p className="admin-success" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <section className="admin-section" aria-labelledby="upload-title">
        <h2 id="upload-title">Importar planilha</h2>
        <p>A análise não publica alterações.</p>
        {officialSource && <div className="admin-workbook-viewer">
          <div className="admin-preview-actions"><button className="admin-primary-action" type="button" aria-expanded={showWorkbook} aria-controls="admin-workbook-panel" onClick={() => setShowWorkbook(!showWorkbook)}>{showWorkbook ? "Ocultar planilha" : "Visualizar planilha no admin"}</button><a href={officialSource.url} target="_blank" rel="noreferrer">Abrir planilha no SharePoint</a></div>
          {showWorkbook && <div id="admin-workbook-panel"><p>Edite no SharePoint e depois use “Buscar e analisar”.</p><iframe className="admin-workbook-frame" src={officialSource.embedUrl} title="Planilha oficial de serviços no SharePoint" /></div>}
        </div>}
        <div className="admin-import-options">
          <form className="admin-upload-form" onSubmit={analyzeLink}>
            <h3>Buscar pelo link</h3>
            <label htmlFor="admin-source-url">Link da planilha</label>
            <input id="admin-source-url" type="url" required value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setPreview(null); }} />
            <button type="submit" disabled={busy || !sourceUrl.trim()}>{busy ? "Analisando…" : "Buscar e analisar"}</button>
          </form>
          <form className="admin-upload-form" onSubmit={analyze}>
            <h3>Enviar arquivo</h3>
            <label htmlFor="admin-file">Arquivo XLSX</label>
            <input id="admin-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); }} />
            <button type="submit" disabled={busy || !file}>{busy ? "Analisando…" : "Analisar arquivo"}</button>
          </form>
        </div>
      </section>
      {preview && <section className="admin-section" aria-labelledby="preview-title">
        <h2 id="preview-title">Relatório antes da publicação</h2>
        <div className="admin-counts"><span><b>{preview.report.updated}</b> alterados</span><span><b>{preview.report.created}</b> criados</span><span><b>{preview.report.deactivated}</b> excluídos</span><span><b>{preview.report.reactivated}</b> reativados</span></div>
        {preview.identical && <p>Esta planilha já corresponde à versão publicada.</p>}
        {!!preview.report.blockers.length && <div className="admin-blockers"><strong>Publicação pendente</strong><ul>{preview.report.blockers.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        {preview.draftId && preview.services && <DraftBrowser key={preview.draftId} draftId={preview.draftId} services={preview.services} changedRows={[...new Set(preview.report.changes.flatMap((change) => change.sourceRow ? [change.sourceRow] : []))]} />}
        <details className="admin-change-details" open><summary>Ver diferenças por coluna ({preview.report.changes.length})</summary><ChangesTable changes={preview.report.changes} /></details>
        <button type="button" className="admin-publish" onClick={() => void publish()} disabled={busy || !preview.draftId || !!preview.report.blockers.length || !preview.report.changes.length}>Publicar esta versão</button>
      </section>}
      <section className="admin-section" aria-labelledby="history-title"><h2 id="history-title">Histórico de publicações</h2>
        {!versions.length && <p>Nenhuma planilha publicada ainda.</p>}
        <div className="admin-history-scroll" role="region" aria-labelledby="history-title" tabIndex={0}>
        <ul className="admin-history">{visibleVersions.map((version) => <li key={version.id}>
          <button type="button" className="admin-history-toggle" aria-expanded={selected?.id === version.id} aria-controls="admin-history-detail" onClick={() => setSelected(selected?.id === version.id ? null : version)}>
            <strong>Versão {version.id}{version.active ? " · atual" : ""}{version.reverted_from ? ` · restauração da ${version.reverted_from}` : ""}</strong>
            <span className="admin-history-meta">{version.source_filename} · {new Date(version.published_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}<small className="admin-history-author">Atualizado por: {responsibleAccount(version)}</small></span>
            <small>{version.report.created} criados · {version.report.updated} alterados · {version.report.deactivated} excluídos</small>
          </button>
        </li>)}</ul>
        </div>
        <PaginationControls page={currentHistoryPage} totalItems={versions.length} itemName="publicações" onPageChange={(value) => { setHistoryPage(value); setSelected(null); }} />
        {selectedVersion && <div id="admin-history-detail" ref={historyDetailRef} className="admin-history-detail">
          <h3>Versão {selectedVersion.id}{selectedVersion.active ? " · atual" : ""}</h3>
          <p className="admin-history-author">Atualizado por: {responsibleAccount(selectedVersion)}</p>
          <HistoryBrowser key={selectedVersion.id} versionId={String(selectedVersion.id)} changedRows={[...new Set(selectedVersion.report.changes.flatMap((change) => change.sourceRow ? [change.sourceRow] : []))]} />
          <details key={selectedVersion.id} className="admin-change-details" open><summary>Ver diferenças por coluna ({selectedVersion.report.changes.length})</summary><ChangesTable changes={selectedVersion.report.changes} /></details>
          {!selectedVersion.active && <button type="button" className="admin-restore" disabled={busy} onClick={() => void restore(selectedVersion)}>Restaurar esta versão</button>}
        </div>}
      </section>
      </>}
    </div>
  </main>;
}
