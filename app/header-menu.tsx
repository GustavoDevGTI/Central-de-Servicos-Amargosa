"use client";

import { useEffect, useRef, useState } from "react";
import { municipalManuals } from "./municipal-manuals";

const menuItems = [
  { label: "Página inicial", href: "/" },
  { label: "Serviços públicos", href: "/servicos" },
  { label: "Manuais Municipais", href: "/manuais-municipais" },
  { label: "Sobre", href: "/sobre" },
  {
    label: "Transparência",
    href: "https://amargosa.ba.gov.br/portal-da-transparencia",
  },
  { label: "Diário Oficial", href: "http://dom.amargosa.ba.gov.br/" },
  {
    label: "Organograma",
    href: "https://www.amargosa.ba.gov.br/arquivos/2026-04-27-09-16-00-organograma.pdf",
  },
  { label: "Telefones úteis", href: "/telefones-uteis" },
  {
    label: "Site oficial de Amargosa",
    href: "https://www.amargosa.ba.gov.br/",
  },
  { label: "Acessibilidade", href: "/menu" },
];

const external = (href: string) =>
  /^https?:\/\//i.test(href)
    ? { target: "_blank", rel: "noreferrer" }
    : {};

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const manuals = document.activeElement?.closest<HTMLDetailsElement>(".header-municipal-manuals[open]");
      if (manuals && menuRef.current?.contains(manuals)) {
        manuals.open = false;
        manuals.querySelector("summary")?.focus();
        return;
      }
      if (menuRef.current?.contains(document.activeElement)) menuButtonRef.current?.focus();
      setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className={`header-menu${open ? " is-open" : ""}`}>
      <button
        ref={menuButtonRef}
        type="button"
        className="menu"
        aria-expanded={open}
        aria-controls="header-menu-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
        <svg
          className="menu-arrow"
          viewBox="0 0 12 12"
          aria-hidden="true"
          focusable="false"
        >
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
        <nav id="header-menu-panel" className="header-menu-panel" aria-label="Menu principal">
          {menuItems.map((item) => item.href === "/manuais-municipais" ? (
            <details key={item.href} className="header-municipal-manuals">
              <summary>
                {item.label}
                <svg className="header-manuals-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </summary>
              <ul className="header-manuals-list" role="list">
                {[...municipalManuals, { href: item.href, label: "Ver todos os manuais" }].map((manual) => (
                  <li key={manual.href}>
                    <a href={manual.href} onClick={() => setOpen(false)}>
                      <span>{manual.label}</span>
                      <b aria-hidden="true">→</b>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <a
              key={item.label}
              href={item.href}
              {...external(item.href)}
              onClick={() => setOpen(false)}
            >
              <span>{item.label}</span>
              <b aria-hidden="true">→</b>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
