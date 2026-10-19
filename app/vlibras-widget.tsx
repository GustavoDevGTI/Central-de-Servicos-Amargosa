"use client";

import { useEffect } from "react";

type VlibrasWidgetOptions = {
  rootPath?: string;
  avatar?: "icaro" | "hosana" | "guga" | "random";
  position?: "L" | "R";
};

declare global {
  interface Window {
    VLibras?: {
      Widget: new (options?: VlibrasWidgetOptions) => unknown;
    };
    VLibrasWidget?: {
      initBtn?: HTMLButtonElement;
      open?: () => void;
    };
  }
}

export const VLIBRAS_READY_EVENT = "amargosa:vlibras-ready";

function announceReady() {
  if (!window.VLibrasWidget?.open) return;
  window.dispatchEvent(new Event(VLIBRAS_READY_EVENT));
}

export default function VlibrasWidget({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) {
      const wrapper = document.getElementById("vlibras-access-wrapper");
      if (!wrapper) return;
      const display = wrapper.style.getPropertyValue("display");
      const priority = wrapper.style.getPropertyPriority("display");
      wrapper.style.setProperty("display", "none", "important");
      return () => {
        if (display) wrapper.style.setProperty("display", display, priority);
        else wrapper.style.removeProperty("display");
      };
    }
    const initialize = () => {
      if (
        window.VLibras?.Widget &&
        !document.getElementById("vlibras-access-wrapper")
      ) {
        new window.VLibras.Widget({
          rootPath: "https://vlibras.gov.br/app",
          avatar: "random",
          position: "R",
        });
      }
      window.setTimeout(announceReady, 100);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-vlibras-widget="true"]',
    );
    if (existing) {
      if (window.VLibrasWidget?.open) announceReady();
      else existing.addEventListener("load", initialize, { once: true });
      return () => existing.removeEventListener("load", initialize);
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.dataset.vlibrasWidget = "true";
    script.addEventListener("load", initialize, { once: true });
    document.head.appendChild(script);

    return () => script.removeEventListener("load", initialize);
  }, [enabled]);

  return null;
}
