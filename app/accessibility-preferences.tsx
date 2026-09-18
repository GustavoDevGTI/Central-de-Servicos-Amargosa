"use client";

import { useEffect, useState } from "react";
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

export const ACCESSIBILITY_STORAGE_KEY = "amargosa-accessibility-preferences";

type Preferences = {
  textScale: number;
  highContrast: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  textScale: 1,
  highContrast: false,
};

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.textSize = accessibilityTextSizeName(preferences.textScale);
  root.dataset.highContrast = String(preferences.highContrast);
  applyAccessibilityTextSize(preferences.textScale);
}

function savePreferences(preferences: Preferences) {
  window.localStorage.setItem(
    ACCESSIBILITY_STORAGE_KEY,
    JSON.stringify({
      ...preferences,
      textSize: accessibilityTextSizeName(preferences.textScale),
    }),
  );
  applyPreferences(preferences);
}

export default function AccessibilityPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [status, setStatus] = useState("Preferências padrão de leitura selecionadas.");

  useEffect(() => {
    let frame = 0;
    try {
      const stored = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (!stored) {
        applyPreferences(DEFAULT_PREFERENCES);
        return undefined;
      }
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
    } catch {
      applyPreferences(DEFAULT_PREFERENCES);
    }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectTextScale = (textScale: number) => {
    const next = { ...preferences, textScale: clampAccessibilityTextScale(textScale) };
    setPreferences(next);
    savePreferences(next);
    setStatus(`Tamanho do texto alterado para ${Math.round(next.textScale * 100)}%.`);
  };

  const toggleContrast = () => {
    const next = { ...preferences, highContrast: !preferences.highContrast };
    setPreferences(next);
    savePreferences(next);
    setStatus(next.highContrast ? "Alto contraste ativado." : "Alto contraste desativado.");
  };

  const reset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    savePreferences(DEFAULT_PREFERENCES);
    setStatus("Preferências de leitura redefinidas.");
  };

  return (
    <section
      id="preferencias-leitura"
      className="reading-preferences"
      aria-label="Preferências de leitura"
    >
      <div className="reading-preferences-panel">
        <fieldset className="reading-text-size">
          <legend>Tamanho do texto · {Math.round(preferences.textScale * 100)}%</legend>
          <div role="group" aria-label="Escolher tamanho do texto">
            <button
              type="button"
              className={preferences.textScale < 1 ? "is-active" : ""}
              aria-pressed={preferences.textScale < 1}
              aria-label={`Diminuir tamanho do texto. Atual: ${Math.round(preferences.textScale * 100)}%`}
              disabled={preferences.textScale <= MIN_ACCESSIBILITY_TEXT_SCALE}
              onClick={() => selectTextScale(preferences.textScale - ACCESSIBILITY_TEXT_SCALE_STEP)}
            >
              A−
            </button>
            <button
              type="button"
              className={preferences.textScale === 1 ? "is-active" : ""}
              aria-pressed={preferences.textScale === 1}
              aria-label="Usar tamanho padrão do texto"
              onClick={() => selectTextScale(1)}
            >
              A
            </button>
            <button
              type="button"
              className={preferences.textScale > 1 ? "is-active" : ""}
              aria-pressed={preferences.textScale > 1}
              aria-label={`Aumentar tamanho do texto. Atual: ${Math.round(preferences.textScale * 100)}%`}
              disabled={preferences.textScale >= MAX_ACCESSIBILITY_TEXT_SCALE}
              onClick={() => selectTextScale(preferences.textScale + ACCESSIBILITY_TEXT_SCALE_STEP)}
            >
              A+
            </button>
          </div>
        </fieldset>

        <div className="reading-visual-preference">
          <span>Preferência visual</span>
          <button
            type="button"
            className={preferences.highContrast ? "is-active" : ""}
            aria-pressed={preferences.highContrast}
            onClick={toggleContrast}
          >
            <strong>{preferences.highContrast ? "Desativar alto contraste" : "Ativar alto contraste"}</strong>
            <b aria-hidden="true">◐</b>
          </button>
        </div>

        <button type="button" className="reading-reset" onClick={reset}>
          Redefinir
        </button>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </section>
  );
}
