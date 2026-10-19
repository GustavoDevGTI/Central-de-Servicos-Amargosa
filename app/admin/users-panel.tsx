"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminRoles, isAdminRole, type AdminRole } from "../../lib/admin-permissions";

type ManagedUser = { id: string; name: string; email: string; username: string | null; role: string | null; banned: boolean | null };
type UserForm = { name: string; username: string; email: string; role: AdminRole; password: string };
const emptyForm: UserForm = { name: "", username: "", email: "", role: "catalog_admin", password: "" };

export function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/admin/users?q=${encodeURIComponent(query)}&page=${page}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
        const body = await response.json() as { users: ManagedUser[]; total: number; error?: string };
        if (!response.ok) throw new Error(body.error || "Não foi possível carregar os usuários.");
        if (!controller.signal.aborted) { setUsers(body.users); setTotal(body.total); }
      }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Não foi possível carregar os usuários."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, page, revision]);
  async function mutate(body: Record<string, unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
      setMessage(success); setRevision((value) => value + 1);
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar."); return false; }
    finally { setBusy(false); }
  }
  function openForm(user?: ManagedUser) {
    setEditing(user || null); setShowForm(true); setNewPassword(""); setError(""); setMessage("");
    setForm(user ? { name: user.name, username: user.username || "", email: user.email, role: isAdminRole(user.role) ? user.role : "catalog_admin", password: "" } : emptyForm);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = editing ? { action: "update", userId: editing.id, name: form.name, username: form.username, email: form.email, role: form.role } : { action: "create", ...form };
    if (await mutate(body, editing ? "Usuário atualizado." : "Usuário cadastrado.")) { setShowForm(false); setEditing(null); setForm(emptyForm); }
  }
  async function toggle(user: ManagedUser) {
    if (!user.banned && !window.confirm(`Desativar o acesso de ${user.name}? As sessões abertas serão encerradas.`)) return;
    await mutate({ action: "status", userId: user.id, active: Boolean(user.banned) }, user.banned ? "Acesso reativado." : "Acesso desativado e sessões encerradas.");
  }
  return <section className="admin-section" aria-labelledby="users-title">
    <h2 id="users-title">Controle de usuários</h2>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {message && <p className="admin-success" role="status">{message}</p>}
    <div className="admin-preview-actions"><button type="button" disabled={busy} onClick={() => openForm()}>Cadastrar usuário</button></div>
    {showForm && <div className="admin-user-editor">
      <form onSubmit={save}>
        <h3>{editing ? `Editar usuário: ${editing.name}` : "Novo usuário"}</h3>
        <fieldset disabled={busy} className="admin-user-fields">
          <label>Nome<input required maxLength={150} value={form.name} autoComplete="off" onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Usuário<input required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_.]{3,30}" title="Use letras, números, ponto ou sublinhado." autoComplete="off" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>E-mail<input type="email" required maxLength={254} autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Perfil<select value={form.role} disabled={editing?.id === currentUserId} onChange={(event) => { if (isAdminRole(event.target.value)) setForm({ ...form, role: event.target.value }); }}>{Object.entries(adminRoles).map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select><small>O administrador geral também gerencia usuários.</small></label>
          {!editing && <label>Senha inicial<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>Mínimo de 8 caracteres.</small></label>}
        </fieldset>
        <div className="admin-preview-actions"><button type="submit" disabled={busy}>{busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar usuário"}</button><button type="button" disabled={busy} onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); setNewPassword(""); }}>Cancelar</button></div>
      </form>
      {editing && editing.id !== currentUserId && <form className="admin-password-form" onSubmit={async (event) => { event.preventDefault(); if (await mutate({ action: "password", userId: editing.id, password: newPassword }, "Senha redefinida e sessões encerradas.")) setNewPassword(""); }}>
        <h3>Redefinir senha</h3><label>Nova senha<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} disabled={busy} onChange={(event) => setNewPassword(event.target.value)} /></label><div className="admin-preview-actions"><button type="submit" disabled={busy}>Redefinir senha e encerrar sessões</button></div>
      </form>}
    </div>}
    <div className="admin-preview-controls"><label htmlFor="admin-user-search">Pesquisar usuários</label><div className="admin-service-search"><input id="admin-user-search" type="search" placeholder="Nome, usuário ou e-mail" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setError(""); }} /></div></div>
    {loading ? <p role="status">Carregando usuários…</p> : !users.length ? <p>Nenhum usuário encontrado.</p> : <ul className="admin-user-list">{users.map((user) => <li key={user.id}>
      <div><strong>{user.name}{user.id === currentUserId ? " · você" : ""}</strong><span>{user.username || "Usuário não definido"} · {user.email}</span><small>{isAdminRole(user.role) ? adminRoles[user.role] : "Sem acesso administrativo"} · {user.banned ? "Desativado" : "Ativo"}</small></div>
      <div className="admin-preview-actions"><button type="button" disabled={busy} onClick={() => openForm(user)} aria-label={`Editar ${user.name}`}>Editar</button><button type="button" disabled={busy || user.id === currentUserId} onClick={() => void toggle(user)} aria-label={`${user.banned ? "Reativar" : "Desativar"} ${user.name}`}>{user.banned ? "Reativar acesso" : "Desativar acesso"}</button></div>
    </li>)}</ul>}
    {!loading && <div className="admin-preview-actions"><span>{total ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} de ${total} usuários` : "0 usuários"}</span><button type="button" disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>Anterior</button><button type="button" disabled={page * 20 >= total || busy} onClick={() => setPage(page + 1)}>Próxima</button></div>}
  </section>;
}
