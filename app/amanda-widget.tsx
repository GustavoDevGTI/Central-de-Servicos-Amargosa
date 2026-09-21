"use client";
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- a identidade e os links simples preservam o portal sem JavaScript */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import siteContent from "../content/site.json";
import type {
  AgentChatResponse,
  AgentErrorResponse,
  AgentServiceCard,
} from "./agent/types";

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

type Message = {
  id: string;
  author: "user" | "amanda";
  text: string;
  services?: AgentServiceCard[];
  isError?: boolean;
};

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
  const [sending, setSending] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

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

  function newMessage(
    author: Message["author"],
    text: string,
    options?: Pick<Message, "services" | "isError">,
  ): Message {
    return { id: crypto.randomUUID(), author, text, ...options };
  }

  function startNewConversation() {
    sessionIdRef.current = crypto.randomUUID();
    setMessages([]);
    setDraft("");
    setSending(false);
  }

  async function askAmanda(question: string) {
    const value = question.trim();
    if (!value || sending) return;
    const history = messages.slice(-8).map((message) => ({
      role: message.author === "user" ? ("user" as const) : ("assistant" as const),
      text: message.text,
    }));
    setMessages((current) => [...current, newMessage("user", value)]);
    setDraft("");
    setSending(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message: value,
          history,
        }),
      });
      const data = (await response.json()) as AgentChatResponse | AgentErrorResponse;
      if (!response.ok || !("message" in data)) {
        const text =
          "error" in data
            ? data.error
            : "Não foi possível consultar o assistente agora.";
        setMessages((current) => [
          ...current,
          newMessage("amanda", text, { isError: true }),
        ]);
        return;
      }

      const privacyNotice = data.personalDataRemoved
        ? "Por segurança, removi dados pessoais da mensagem antes de processá-la.\n\n"
        : "";
      setMessages((current) => [
        ...current,
        newMessage("amanda", `${privacyNotice}${data.message}`, {
          services: data.services,
        }),
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        newMessage(
          "amanda",
          "Estou temporariamente indisponível. A busca e as páginas da Central de Serviços continuam funcionando normalmente.",
          { isError: true },
        ),
      ]);
    } finally {
      setSending(false);
    }
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
            <div className="amanda-header-actions">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={startNewConversation}
                  aria-label="Iniciar nova conversa"
                  title="Nova conversa"
                >
                  ↻
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar conversa com Amanda">
                ×
              </button>
            </div>
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
              <div
                className="amanda-transcript"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={sending}
              >
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`${message.author}${message.isError ? " error" : ""}`}
                  >
                    <small>{message.author === "user" ? "Você" : "Amanda"}</small>
                    <p>{message.text}</p>
                    {message.services?.length ? (
                      <div className="amanda-service-results" aria-label="Serviços encontrados">
                        {message.services.map((service) => (
                          <a href={service.url} key={service.id}>
                            <span>
                              <small>{service.category}</small>
                              <strong>{service.title}</strong>
                              <em>{service.department}</em>
                            </span>
                            <b aria-hidden="true">→</b>
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {message.isError && (
                      <a className="amanda-search-fallback" href="/servicos">
                        Usar a busca tradicional →
                      </a>
                    )}
                  </article>
                ))}
                {sending && (
                  <article className="amanda amanda-thinking" role="status">
                    <small>Amanda</small>
                    <p>Consultando os serviços oficiais…</p>
                  </article>
                )}
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
                maxLength={1000}
                disabled={sending}
              />
              <small className="amanda-character-count">{draft.length}/1000</small>
            </label>
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label={sending ? "Enviando mensagem" : "Enviar mensagem"}
            >
              <span aria-hidden="true">{conversation?.buttonText || "➤"}</span>
            </button>
          </form>
          {getText("notice") && <small className="amanda-notice">{getText("notice")}</small>}
        </aside>
      )}
    </div>
  );
}
