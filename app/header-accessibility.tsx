"use client";

import { useEffect, useRef, useState } from "react";
import { ACCESSIBILITY_STORAGE_KEY } from "./accessibility-preferences";
import {
  ACCESSIBILITY_TEXT_SCALE_STEP,
  applyAccessibilityTextSize,
  accessibilityTextSizeName,
  clampAccessibilityTextScale,
  MAX_ACCESSIBILITY_TEXT_SCALE,
  MIN_ACCESSIBILITY_TEXT_SCALE,
  normalizeAccessibilityTextScale,
  type AccessibilityTextSize,
} from "./accessibility-text-size";

type Preferences = {
  textScale: number;
  highContrast: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  textScale: 1,
  highContrast: false,
};

function applyPreferences(preferences: Preferences) {
  document.documentElement.dataset.textSize = accessibilityTextSizeName(preferences.textScale);
  document.documentElement.dataset.highContrast = String(preferences.highContrast);
  applyAccessibilityTextSize(preferences.textScale);
}

function persistPreferences(preferences: Preferences) {
  window.localStorage.setItem(
    ACCESSIBILITY_STORAGE_KEY,
    JSON.stringify({
      ...preferences,
      textSize: accessibilityTextSizeName(preferences.textScale),
    }),
  );
  applyPreferences(preferences);
}

export default function HeaderAccessibility() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const accessibilityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    try {
      const stored = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences> & {
          textSize?: AccessibilityTextSize;
        };
        const legacySize = ["small", "default", "large"].includes(parsed.textSize || "")
          ? (parsed.textSize as AccessibilityTextSize)
          : "default";
        const restored: Preferences = {
          textScale: normalizeAccessibilityTextScale(parsed.textScale, legacySize),
          highContrast: parsed.highContrast === true,
        };
        applyPreferences(restored);
        frame = window.requestAnimationFrame(() => setPreferences(restored));
      } else {
        applyPreferences(DEFAULT_PREFERENCES);
      }
    } catch {
      applyPreferences(DEFAULT_PREFERENCES);
      frame = window.requestAnimationFrame(() => setPreferences(DEFAULT_PREFERENCES));
    }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!accessibilityRef.current?.contains(event.target as Node)) setOpen(false);
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

  const update = (next: Preferences) => {
    setPreferences(next);
    persistPreferences(next);
  };

  const reset = () => update(DEFAULT_PREFERENCES);
  const updateTextScale = (textScale: number) => {
    update({ ...preferences, textScale: clampAccessibilityTextScale(textScale) });
  };

  return (
    <div
      ref={accessibilityRef}
      className={`header-accessibility${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="header-accessibility-button"
        aria-label="Acessibilidade"
        aria-expanded={open}
        aria-controls="header-accessibility-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="header-accessibility-compact" aria-hidden="true">Aa</span>
        <span className="header-accessibility-label">Acessibilidade</span>
        <svg className="menu-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d={open ? "M6 10V2M3.5 5 6 2l2.5 3" : "M6 2v8m-2.5-3L6 10l2.5-3"} />
        </svg>
      </button>

      {open && (
        <section
          id="header-accessibility-panel"
          className="header-accessibility-panel"
          aria-label="Opções de acessibilidade"
        >
          <header>
            <strong>Acessibilidade</strong>
            <button type="button" aria-label="Fechar opções de acessibilidade" onClick={() => setOpen(false)}>×</button>
          </header>

          <fieldset>
            <legend>Tamanho do texto · {Math.round(preferences.textScale * 100)}%</legend>
            <div className="header-accessibility-size" role="group" aria-label="Escolher tamanho do texto">
              <button
                type="button"
                className={preferences.textScale < 1 ? "is-active" : ""}
                aria-pressed={preferences.textScale < 1}
                aria-label={`Diminuir tamanho do texto. Atual: ${Math.round(preferences.textScale * 100)}%`}
                disabled={preferences.textScale <= MIN_ACCESSIBILITY_TEXT_SCALE}
                onClick={() => updateTextScale(preferences.textScale - ACCESSIBILITY_TEXT_SCALE_STEP)}
              >A−</button>
              <button
                type="button"
                className={preferences.textScale === 1 ? "is-active" : ""}
                aria-pressed={preferences.textScale === 1}
                aria-label="Usar tamanho padrão do texto"
                onClick={() => updateTextScale(1)}
              >A</button>
              <button
                type="button"
                className={preferences.textScale > 1 ? "is-active" : ""}
                aria-pressed={preferences.textScale > 1}
                aria-label={`Aumentar tamanho do texto. Atual: ${Math.round(preferences.textScale * 100)}%`}
                disabled={preferences.textScale >= MAX_ACCESSIBILITY_TEXT_SCALE}
                onClick={() => updateTextScale(preferences.textScale + ACCESSIBILITY_TEXT_SCALE_STEP)}
              >A+</button>
            </div>
          </fieldset>

          <div className="header-accessibility-contrast">
            <span>Preferência visual</span>
            <button
              type="button"
              className={preferences.highContrast ? "is-active" : ""}
              aria-pressed={preferences.highContrast}
              onClick={() => update({ ...preferences, highContrast: !preferences.highContrast })}
            >
              <strong>{preferences.highContrast ? "Desativar alto contraste" : "Ativar alto contraste"}</strong>
              <b aria-hidden="true">◐</b>
            </button>
          </div>

          <button type="button" className="header-accessibility-reset" onClick={reset}>Redefinir</button>
          <a className="header-accessibility-more" href="/menu" onClick={() => setOpen(false)}>
            <span>Página de acessibilidade</span>
            <b aria-hidden="true">→</b>
          </a>
        </section>
      )}
    </div>
  );
}
