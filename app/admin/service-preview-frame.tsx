"use client";

/** Use the available panel width without shrinking the service's text. */
export function ServicePreviewFrame({ src, title, mobile = false }: { src: string; title: string; mobile?: boolean }) {
  return <div className={`admin-service-viewport${mobile ? " admin-service-viewport-mobile" : ""}`} data-preview-device={mobile ? "mobile" : "desktop"}>
    <iframe className="admin-service-frame" src={src} title={title} />
  </div>;
}
