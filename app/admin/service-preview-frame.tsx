"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export const previewViewportWidth = (mobile: boolean) => mobile ? 390 : 1440;
export function previewViewportScale(availableWidth: number, mobile: boolean) {
  return availableWidth > 0 ? Math.min(1, availableWidth / previewViewportWidth(mobile)) : 1;
}

/** Keep real device breakpoints independent of the comparison column's width. */
export function ServicePreviewFrame({ src, title, mobile = false }: { src: string; title: string; mobile?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const style = {
    "--admin-preview-width": `${previewViewportWidth(mobile)}px`,
    "--admin-preview-scale": previewViewportScale(availableWidth, mobile),
  } as CSSProperties;
  return <div ref={viewport} className="admin-service-viewport" style={style} data-preview-device={mobile ? "mobile" : "desktop"}>
    <iframe className="admin-service-frame" src={src} title={title} width={previewViewportWidth(mobile)} />
  </div>;
}
