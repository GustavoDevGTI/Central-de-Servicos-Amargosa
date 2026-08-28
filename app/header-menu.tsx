"use client";

import { useEffect, useRef, useState } from "react";

const menuItems = [
  { label: "Página inicial", href: "/" },
  { label: "Serviços públicos", href: "/servicos" },
  { label: "Sobre", href: "/sobre" },
  { label: "Organograma", href: "/organograma" },
  { label: "Acessibilidade", href: "/menu" },
];

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
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
    <div ref={menuRef} className={`header-menu${open ? " is-open" : ""}`}>
      <button
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
          {menuItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
              <span>{item.label}</span>
              <b aria-hidden="true">→</b>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
