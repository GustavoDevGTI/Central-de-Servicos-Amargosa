"use client";

import { useEffect } from "react";

export default function GoogleTagManager({ id }: { id: string }) {
  useEffect(() => {
    if (document.querySelector(`script[data-google-tag-manager="${id}"]`)) {
      return;
    }

    window.dataLayer ||= [];
    window.dataLayer.push({ event: "gtm.js", "gtm.start": Date.now() });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    script.dataset.googleTagManager = id;
    document.head.appendChild(script);
  }, [id]);

  return null;
}
