"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminAuthClient } from "./auth-client";
import { ServiceEditor } from "./service-editor";
import { ChangesTable } from "./change-table";
import type { CatalogReport as Report } from "../../lib/catalog-db";
import { HistoryBrowser } from "./history-browser";
import { DiagnosticsPanel } from "./diagnostics-panel";
import { UsersPanel } from "./users-panel";
import { canManageUsers, type AdminRole } from "../../lib/admin-permissions";
import "./admin.css";

type Version = { id: string; source_filename: string; published_at: string; author_name: string | null; author_username: string | null; active: boolean; reverted_from?: string | null; report: Report };

function responsibleAccount(version: Version) {
  const name = version.author_name;
  const username = version.author_username;
  if (!username) return name || "Conta não disponível";
  return name && name.toLocaleLowerCase("pt-BR") !== username.toLocaleLowerCase("pt-BR") ? `${name} (@${username})` : name || username;
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "A operação falhou.");
  return body;
}

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: AdminRole } | null>(null);
  const [section, setSection] = useState<"catalog" | "diagnostics" | "users">("catalog");
  const [editorRevision, setEditorRevision] = useState(0);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<Version | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const historyDetailRef = useRef<HTMLDivElement>(null);
  const selectedVersion = versions.find((version) => version.id === selected?.id);

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

      } })
      .catch(() => { if (active) setError("Admin indisponível."); });
    return () => { active = false; };
  }, []);

  async function restore(version: Version) {
    if (hasUnsaved && !window.confirm("Descartar a edição não salva antes de restaurar?")) return;
    if (!window.confirm(`Restaurar a versão ${version.id}? A restauração será registrada como uma nova publicação.`)) return;
    setBusy(true); setError("");
    try {
      const result = await responseJson<{ version: number; identical?: boolean }>(await fetch("/api/admin/restore", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: Number(version.id) }),
      }));
      setMessage(result.identical ? "Esta versão já corresponde ao catálogo atual." : `Versão ${result.version} publicada com o conteúdo da versão ${version.id}.`);
      setSelected(null); setEditorRevision((value) => value + 1); await loadHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao restaurar.");
    } finally { setBusy(false); }
  }

  function navigateSection(next: "catalog" | "diagnostics" | "users") {
    if (hasUnsaved && next !== section && !window.confirm("Descartar as alterações não salvas?")) return;
    setSection(next);
  }

  if (!ready) return <main className="admin-shell admin-loading" aria-live="polite">{error || "Carregando admin…"}</main>;

  return <main className="admin-shell">
    <header className="admin-topbar">
      <Link
        href={section === "catalog" ? "/" : "/admin"}
        aria-label={section === "catalog" ? "Ir para a página inicial da Central" : "Voltar ao início do admin"}
        onClick={(event) => {
          if (hasUnsaved && !window.confirm("Descartar as alterações não salvas?")) { event.preventDefault(); return; }
          if (section === "catalog" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          setSection("catalog");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      ><Image src="/prefeitura-amargosa-logo-preta.png" alt="Prefeitura de Amargosa" width={210} height={52} unoptimized /></Link>
      <nav aria-label="Administração"><a href="/" target="_blank" rel="noreferrer">Ver a Central</a><button type="button" onClick={() => { if (hasUnsaved && !window.confirm("Descartar as alterações não salvas e sair?")) return; void adminAuthClient.signOut().then(() => window.location.assign("/admin/login")); }}>Sair</button></nav>
    </header>
    <div className="admin-content">
      <header className="admin-page-heading"><span className="admin-kicker">Administração</span><h1>{section === "catalog" ? "Catálogo de serviços" : section === "diagnostics" ? "Diagnóstico" : "Usuários"}</h1></header>
      <nav className="admin-section-nav admin-preview-actions" aria-label="Seções do admin">
        <button type="button" aria-pressed={section === "catalog"} onClick={() => navigateSection("catalog")}>Catálogo</button>
        <button type="button" aria-pressed={section === "diagnostics"} onClick={() => navigateSection("diagnostics")}>Diagnóstico</button>
        {canManageUsers(currentUser?.role) && <button type="button" aria-pressed={section === "users"} onClick={() => navigateSection("users")}>Usuários</button>}
      </nav>
      {section === "diagnostics" && <DiagnosticsPanel />}
      {section === "users" && currentUser && canManageUsers(currentUser.role) && <UsersPanel currentUserId={currentUser.id} />}
      {section === "catalog" && <>
      {message && <p className="admin-success" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      <ServiceEditor key={editorRevision} onSaved={loadHistory} onDirtyChange={setHasUnsaved} />
      <section className="admin-section" aria-labelledby="history-title"><h2 id="history-title">Histórico de publicações</h2>
        {!versions.length && <p>Nenhuma edição salva ainda.</p>}
        <div className="admin-history-scroll" role="region" aria-labelledby="history-title" tabIndex={0}>
        <ul className="admin-history">{versions.map((version) => <li key={version.id}>
          <button type="button" className="admin-history-toggle" aria-expanded={selected?.id === version.id} aria-controls="admin-history-detail" onClick={() => setSelected(selected?.id === version.id ? null : version)}>
            <strong>Versão {version.id}{version.active ? " · atual" : ""}{version.reverted_from ? ` · restauração da ${version.reverted_from}` : ""}</strong>
            <span className="admin-history-meta">{version.source_filename} · {new Date(version.published_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}<small className="admin-history-author">Atualizado por: {responsibleAccount(version)}</small></span>
            <small>{version.report.created} criados · {version.report.updated} alterados · {version.report.deactivated} excluídos</small>
          </button>
        </li>)}</ul>
        </div>
        {selectedVersion && <div id="admin-history-detail" ref={historyDetailRef} className="admin-history-detail">
          <h3>Versão {selectedVersion.id}{selectedVersion.active ? " · atual" : ""}</h3>
          <p className="admin-history-author">Atualizado por: {responsibleAccount(selectedVersion)}</p>
          <HistoryBrowser key={selectedVersion.id} versionId={String(selectedVersion.id)} changedRows={[...new Set(selectedVersion.report.changes.flatMap((change) => change.sourceRow ? [change.sourceRow] : []))]} changedIds={selectedVersion.report.changes.map((change) => change.serviceId)} />
          <details key={selectedVersion.id} className="admin-change-details" open><summary>Ver diferenças por campo ({selectedVersion.report.changes.length})</summary><ChangesTable changes={selectedVersion.report.changes} /></details>
          {!selectedVersion.active && <button type="button" className="admin-restore" disabled={busy} onClick={() => void restore(selectedVersion)}>Restaurar esta versão</button>}
        </div>}
      </section>
      </>}
    </div>
  </main>;
}
