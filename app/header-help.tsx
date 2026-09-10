"use client";

import { useEffect, useRef, useState } from "react";

const helpItems = [
  { label: "Dúvidas com o SEI", href: "/manual-sei" },
  {
    label: "Dúvidas com o BA.GOV",
  },
  { label: "Dúvidas sobre a Ouvidoria", href: "/servicos/ouvidoria-geral" },
  {
    label: "Fazer uma reclamação",
    href: "https://falabr.cgu.gov.br/web/manifestacao/criar/selecionar-assunto",
  },
  {
    label: "Reportar um bug",
    href: "mailto:seafi.gti@amargosa.ba.gov.br?subject=Relato%20de%20erro%20na%20Central%20de%20Servi%C3%A7os",
  },
];

const external = (href: string) =>
  /^https?:\/\//i.test(href)
    ? { target: "_blank", rel: "noreferrer" }
    : {};

export default function HeaderHelp() {
  const [open, setOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!helpRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={helpRef} className={`header-help${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="header-help-button"
        aria-expanded={open}
        aria-controls="header-help-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="header-help-symbol" aria-hidden="true">?</span>
        <span>Ajuda</span>
        <svg className="menu-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path
            d={
              open
                ? "M6 10V2M3.5 5 6 2l2.5 3"
                : "M6 2v8m-2.5-3L6 10l2.5-3"
            }
          />
        </svg>
      </button>
      {open && (
        <nav id="header-help-panel" className="header-help-panel" aria-label="Opções de ajuda">
          {helpItems.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                {...external(item.href)}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                <b aria-hidden="true">→</b>
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                aria-disabled="true"
                title="Página em preparação"
              >
                <span>{item.label}</span>
                <small>Em breve</small>
              </button>
            ),
          )}
        </nav>
      )}
    </div>
  );
}
