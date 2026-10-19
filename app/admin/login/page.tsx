"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminAuthClient } from "../auth-client";
import "../admin.css";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminAuthClient.signIn.username({ username, password });
      if (result.error) {
        setError("Usuário ou senha inválidos.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Não foi possível entrar. Confira a conexão e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-shell admin-login-shell">
    <header className="admin-topbar">
      <Link href="/" aria-label="Voltar à Central de Serviços"><Image src="/prefeitura-amargosa-logo-preta.png" alt="Prefeitura de Amargosa" width={210} height={52} unoptimized /></Link>
      <span>Administração da Central de Serviços</span>
    </header>
    <section className="admin-login-layout">
      <div className="admin-login-intro">
        <span className="admin-kicker">Área restrita</span>
        <h1>Administração da Central</h1>
      </div>
      <form className="admin-login-form" onSubmit={signIn}>
        <h2>Entrar</h2>
        <label htmlFor="admin-user">Usuário</label>
        <input id="admin-user" name="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
        <label htmlFor="admin-password">Senha</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar no admin"}</button>
      </form>
    </section>
  </main>;
}
