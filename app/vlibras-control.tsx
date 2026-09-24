"use client";

import { useEffect, useState } from "react";
import { VLIBRAS_READY_EVENT } from "./vlibras-widget";

export default function VlibrasControl() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const update = () => {
      const officialButton = document
        .getElementById("vlibras-access-wrapper")
        ?.shadowRoot?.querySelector<HTMLButtonElement>("#vlibras-button");
      setReady(Boolean(window.VLibrasWidget?.open || officialButton));
    };
    update();
    const interval = window.setInterval(update, 250);
    window.addEventListener(VLIBRAS_READY_EVENT, update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(VLIBRAS_READY_EVENT, update);
    };
  }, []);

  return (
    <section
      id="libras"
      className="vlibras-accessibility"
      aria-labelledby="vlibras-title"
    >
      <header>
        <span>ACESSIBILIDADE EM LIBRAS</span>
        <h2 id="vlibras-title">Tradução com o VLibras</h2>
        <p>
          O VLibras traduz os textos do portal do Português Brasileiro para a
          Língua Brasileira de Sinais. O botão flutuante permanece disponível
          no lado direito de todas as páginas.
        </p>
      </header>
      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          if (window.VLibrasWidget?.open) window.VLibrasWidget.open();
          else {
            document
              .getElementById("vlibras-access-wrapper")
              ?.shadowRoot?.querySelector<HTMLButtonElement>("#vlibras-button")
              ?.click();
          }
          setStatus("O tradutor VLibras foi aberto.");
        }}
      >
        {ready ? "Abrir tradução em Libras" : "Carregando VLibras…"}
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
