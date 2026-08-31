"use client";
/* eslint-disable @next/next/no-img-element -- a identidade da Amanda usa a imagem configurada no portal */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import siteContent from "../content/site.json";

type AmandaItem = {
  id: string;
  type: string;
  role?: string;
  value?: string;
  src?: string;
  placeholder?: string;
  buttonText?: string;
};

type AmandaSegment = {
  id: string;
  type: string;
  enabled: boolean;
  style: {
    background?: string;
    color?: string;
    accent?: string;
    variant?: string;
    headingFont?: string;
    bodyFont?: string;
    fontSize?: string;
    hoverEffect?: string;
    clickEffect?: string;
  };
  items: AmandaItem[];
};

type Message = { author: "user" | "amanda"; text: string };

const homePage = siteContent.pages[0] as unknown as { segments: AmandaSegment[] };
const segment = homePage.segments.find((entry) => entry.type === "amanda" && entry.enabled);
const siteDesign = siteContent.site.design;
const fontStacks: Record<string, string> = {
  lora: '"Lora Variable", Georgia, serif',
  source: '"Source Sans 3 Variable", "Segoe UI", sans-serif',
  segoe: '"Segoe UI", Tahoma, sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  cambria: 'Cambria, Georgia, serif',
  arial: 'Arial, Helvetica, sans-serif',
};

const getText = (role: string, fallback = "") =>
  segment?.items.find((item) => item.role === role)?.value || fallback;

export default function AmandaWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const launcher = launcherRef.current;
    const focusable = () => [
      ...(panel?.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],textarea,input,select,[tabindex]:not([tabindex="-1"])',
      ) || []),
    ];

    requestAnimationFrame(() => focusable()[0]?.focus());
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", containFocus);
    return () => {
      document.removeEventListener("keydown", containFocus);
      requestAnimationFrame(() => launcher?.focus());
    };
  }, [open]);

  if (!segment) return null;

  const avatar = segment.items.find((item) => item.type === "image" && item.role === "avatar");
  const conversation = segment.items.find((item) => item.type === "search");
  const prompts = segment.items.filter((item) => item.role === "prompt");
  const style = {
    "--segment-bg": segment.style.background || siteContent.site.surfaceColor,
    "--segment-color": segment.style.color || siteContent.site.textColor,
    "--segment-accent": segment.style.accent || siteContent.site.primaryColor,
    "--segment-heading-font": fontStacks[segment.style.headingFont || siteDesign.headingFont || "lora"],
    "--segment-body-font": fontStacks[segment.style.bodyFont || siteDesign.bodyFont || "source"],
  } as CSSProperties;
  const interactionClasses = `segment-hover-${segment.style.hoverEffect || siteDesign.hoverEffect || "none"} segment-click-${segment.style.clickEffect || siteDesign.clickEffect || "none"}`;
  const symbol = (
    <span className="amanda-symbol" aria-hidden="true">
      {avatar?.src ? <img src={avatar.src} alt="" /> : "A"}
    </span>
  );

  function askAmanda(question: string) {
    const value = question.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      { author: "user", text: value },
      {
        author: "amanda",
        text: "Minha inteligência ainda está sendo preparada. Em breve vou responder e indicar o canal oficial mais adequado para você.",
      },
    ]);
    setDraft("");
  }

  return (
    <div
      className={`amanda-widget segment-amanda variant-${segment.style.variant || siteDesign.theme || "institutional"} text-size-${segment.style.fontSize || siteDesign.fontSize || "normal"} ${interactionClasses}`}
      style={style}
    >
      <button
        ref={launcherRef}
        className={`amanda-launcher ${open ? "open" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="amanda-panel"
        aria-haspopup="dialog"
      >
        {symbol}
        <span>
          <small>{getText("eyebrow", "Assistente virtual")}</small>
          <strong>Amanda</strong>
        </span>
        <b aria-hidden="true">{open ? "×" : "✦"}</b>
      </button>

      {open && (
        <aside
          ref={panelRef}
          id="amanda-panel"
          className="amanda-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="amanda-title"
          aria-describedby="amanda-description"
        >
          <header className="amanda-header">
            <div className="amanda-identity">
              {symbol}
              <div>
                <small>{getText("eyebrow", "Assistente virtual")}</small>
                <strong id="amanda-title">{getText("title", "Oi, eu sou Amanda")}</strong>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar conversa com Amanda">
              ×
            </button>
          </header>

          <div className="amanda-body">
            <p id="amanda-description" className="amanda-intro">
              {getText("description")}
            </p>
            {getText("status") && (
              <div className="amanda-status" role="status">
                <i aria-hidden="true" />
                <span>{getText("status")}</span>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="amanda-prompts">
                <small>Você pode começar por aqui</small>
                {prompts.map((prompt) => (
                  <button key={prompt.id} type="button" onClick={() => askAmanda(prompt.value || "")}>
                    {prompt.value}
                    <b aria-hidden="true">↗</b>
                  </button>
                ))}
              </div>
            ) : (
              <div className="amanda-transcript" aria-live="polite" aria-relevant="additions">
                {messages.map((message, index) => (
                  <article key={`${message.author}-${index}`} className={message.author}>
                    <small>{message.author === "user" ? "Você" : "Amanda"}</small>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form
            className="amanda-compose"
            onSubmit={(event) => {
              event.preventDefault();
              askAmanda(draft);
            }}
          >
            <label>
              <span className="sr-only">Mensagem para Amanda</span>
              <textarea
                rows={2}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={conversation?.placeholder}
              />
            </label>
            <button type="submit" disabled={!draft.trim()} aria-label="Enviar mensagem">
              <span aria-hidden="true">{conversation?.buttonText || "➤"}</span>
            </button>
          </form>
          {getText("notice") && <small className="amanda-notice">{getText("notice")}</small>}
        </aside>
      )}
    </div>
  );
}
