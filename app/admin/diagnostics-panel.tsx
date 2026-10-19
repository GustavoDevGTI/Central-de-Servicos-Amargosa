"use client";

import { useEffect, useState } from "react";

export function DiagnosticsPanel() {
  const [source, setSource] = useState<{ url: string; embedUrl: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/diagnostics", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const body = await response.json() as { url: string; embedUrl: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Diagnóstico indisponível.");
      if (!controller.signal.aborted) setSource(body);
    }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Diagnóstico indisponível."); });
    return () => controller.abort();
  }, []);
  return <section className="admin-section" aria-labelledby="diagnostics-title">
    <h2 id="diagnostics-title">Uso da Central de Serviços</h2>
    <div className="admin-preview-actions admin-diagnostics-meta"><p>Google Analytics · Data Studio</p>{source && !error && <a href={source.url} target="_blank" rel="noreferrer">Abrir relatório no Google</a>}</div>
    {error ? <p className="admin-error" role="alert">{error}</p> : !source ? <p role="status">Carregando diagnóstico…</p> : <>
      <iframe className="admin-diagnostics-frame" width={600} height={450} src={source.embedUrl} title="Google Analytics — uso da Central de Serviços" style={{ border: 0 }} allowFullScreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin-when-cross-origin" />
    </>}
  </section>;
}
