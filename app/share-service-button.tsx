"use client";

import { useEffect, useState } from "react";

type ShareServiceButtonProps = {
  title: string;
  href?: string;
  iconOnly?: boolean;
  className?: string;
};

export default function ShareServiceButton({
  title,
  href,
  iconOnly = false,
  className = "",
}: ShareServiceButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const share = async () => {
    const url = new URL(href ?? window.location.pathname, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copie o link do serviço:", url);
    }
  };

  return (
    <button
      type="button"
      className={`service-share-button${iconOnly ? " service-share-icon-only" : ""}${className ? ` ${className}` : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void share();
      }}
      title={iconOnly ? `Compartilhar ${title}` : undefined}
    >
      <span className={iconOnly ? "sr-only" : undefined} aria-live="polite">
        {copied ? "Link copiado" : iconOnly ? `Compartilhar ${title}` : "Compartilhar"}
      </span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <circle cx="18" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="m8 11 8-5M8 13l8 5" />
      </svg>
    </button>
  );
}
