/* eslint-disable @next/next/no-img-element -- a identidade municipal pode usar imagens incorporadas */

import type { CSSProperties } from "react";
import siteContent from "../content/site.json";

type Size = { width?: number; height?: number };
type Item = {
  id: string;
  type: string;
  role?: string;
  value?: string;
  src?: string;
  alt?: string;
  size?: Size;
};
type Segment = {
  id: string;
  type: string;
  enabled: boolean;
  size?: Size;
  style: {
    background?: string;
    color?: string;
    accent?: string;
    width?: string;
    spacing?: string;
    radius?: string;
    variant?: string;
    headingFont?: string;
    bodyFont?: string;
    fontSize?: string;
    hoverEffect?: string;
    clickEffect?: string;
    backgroundImage?: string;
  };
  items: Item[];
};

const page = siteContent.pages[0] as unknown as { segments: Segment[] };
const header = page.segments.find((entry) => entry.type === "header");
const footer = page.segments.find((entry) => entry.type === "footer");
const design = siteContent.site.design;
const fontStacks: Record<string, string> = {
  lora: '"Lora Variable", Georgia, serif',
  source: '"Source Sans 3 Variable", "Segoe UI", sans-serif',
  segoe: '"Segoe UI", Tahoma, sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  cambria: 'Cambria, Georgia, serif',
  arial: 'Arial, Helvetica, sans-serif',
};

const dimension = (value: unknown, minimum: number) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && number >= minimum ? number : undefined;
};
const itemProps = (item?: Item) => ({
  style: {
    width: dimension(item?.size?.width, 40),
    minHeight: dimension(item?.size?.height, 32),
    maxWidth: item?.size?.width ? "100%" : undefined,
  } as CSSProperties,
  "data-editor-item-id": item?.id,
  "data-user-sized-item": item?.size ? "true" : undefined,
});

export default function PortalFooter() {
  if (!footer?.enabled) return null;

  const logo = header?.items.find((item) => item.type === "image" && item.role === "logo");
  const subtitle = header?.items.find((item) => item.role === "subtitle");
  const className = [
    "segment-footer",
    "portal-footer-shared",
    "editable-segment",
    "segment-footer",
    `variant-${footer.style.variant || design.theme || "institutional"}`,
    `width-${footer.style.width || "contained"}`,
    `spacing-${footer.style.spacing || "comfortable"}`,
    `radius-${footer.style.radius || "soft"}`,
    `text-size-${footer.style.fontSize || design.fontSize || "normal"}`,
    `segment-hover-${footer.style.hoverEffect || design.hoverEffect || "none"}`,
    `segment-click-${footer.style.clickEffect || design.clickEffect || "none"}`,
    footer.size ? "user-sized-segment" : "",
  ].filter(Boolean).join(" ");
  const style = {
    "--segment-bg": footer.style.background || siteContent.site.surfaceColor,
    "--segment-color": footer.style.color || siteContent.site.textColor,
    "--segment-accent": footer.style.accent || siteContent.site.primaryColor,
    "--segment-heading-font": fontStacks[footer.style.headingFont || design.headingFont || "lora"],
    "--segment-body-font": fontStacks[footer.style.bodyFont || design.bodyFont || "source"],
    backgroundImage: footer.style.backgroundImage
      ? `linear-gradient(rgba(3,45,35,.68),rgba(3,45,35,.68)),url(${JSON.stringify(footer.style.backgroundImage)})`
      : undefined,
    width: dimension(footer.size?.width, 160),
    minHeight: dimension(footer.size?.height, 32),
    maxWidth: footer.size?.width ? "100%" : undefined,
  } as CSSProperties;

  return (
    <footer className={className} style={style}>
      <div className="portal-footer-grid">
        <section className="portal-footer-identity" aria-label="Central de Serviços de Amargosa">
          {header && (
            <span className="brand">
              {logo?.src ? (
                <img {...itemProps(logo)} className="brand-image" src={logo.src} alt={logo.alt || "Bandeira de Amargosa"} />
              ) : (
                <span {...itemProps(logo)} className="mark">AM</span>
              )}
              <span>
                <small>Prefeitura de Amargosa</small>
                <strong {...itemProps(subtitle)}>{subtitle?.value || "Central de Serviços"}</strong>
              </span>
            </span>
          )}
        </section>

        <section className="portal-footer-contact" aria-label="Informações de contato da Prefeitura de Amargosa">
          <p><strong>CNPJ:</strong> 13.825.484/0001-50</p>
          <p><strong>Endereço:</strong> Praça Lourival Monte, nº 001, Centro, Amargosa – BA</p>
          <p><strong>CEP:</strong> 45300-000</p>
          <p><strong>Telefone:</strong> <a href="tel:+557535127811">(75) 3512-7811</a></p>
          <p><strong>E-mail:</strong> <a href="mailto:contato@amargosa.ba.gov.br">contato@amargosa.ba.gov.br</a></p>
          <p><strong>Atendimento:</strong> segunda a sexta, das 8h às 16h30</p>
        </section>

      </div>
      <div className="portal-footer-bottom">
        <span>© Prefeitura Municipal de Amargosa</span>
        <span>Central de Serviços</span>
      </div>
    </footer>
  );
}
