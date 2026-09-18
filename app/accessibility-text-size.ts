export type AccessibilityTextSize = "small" | "default" | "large";

const LEGACY_TEXT_SCALE: Record<AccessibilityTextSize, number> = {
  small: 0.9,
  default: 1,
  large: 1.12,
};

export const MIN_ACCESSIBILITY_TEXT_SCALE = 0.8;
export const MAX_ACCESSIBILITY_TEXT_SCALE = 2;
export const ACCESSIBILITY_TEXT_SCALE_STEP = 0.1;

type OriginalFontStyle = {
  computedSize: number;
  priority: string;
  value: string;
};

const originalFontStyles = new WeakMap<HTMLElement, OriginalFontStyle>();
const adjustedElements = new Set<HTMLElement>();
let activeTextScale = 1;
let textObserver: MutationObserver | null = null;

export function clampAccessibilityTextScale(scale: number) {
  const clamped = Math.min(
    MAX_ACCESSIBILITY_TEXT_SCALE,
    Math.max(MIN_ACCESSIBILITY_TEXT_SCALE, scale),
  );
  return Math.round(clamped * 10) / 10;
}

export function normalizeAccessibilityTextScale(
  scale: unknown,
  legacySize: AccessibilityTextSize = "default",
) {
  return typeof scale === "number" && Number.isFinite(scale)
    ? clampAccessibilityTextScale(scale)
    : LEGACY_TEXT_SCALE[legacySize];
}

export function accessibilityTextSizeName(scale: number): AccessibilityTextSize {
  if (scale < 1) return "small";
  if (scale > 1) return "large";
  return "default";
}

function hasOwnText(element: HTMLElement) {
  if (element.matches("input, textarea, select, option")) return true;

  return Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
  );
}

function restoreFontSize(element: HTMLElement) {
  const original = originalFontStyles.get(element);
  if (!original) return;

  if (original.value) {
    element.style.setProperty("font-size", original.value, original.priority);
  } else {
    element.style.removeProperty("font-size");
  }

  originalFontStyles.delete(element);
  adjustedElements.delete(element);
}

function resizeElement(element: HTMLElement, scale: number) {
  if (!hasOwnText(element)) return;

  let original = originalFontStyles.get(element);
  if (!original) {
    const computedSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    if (!Number.isFinite(computedSize)) return;

    original = {
      computedSize,
      value: element.style.getPropertyValue("font-size"),
      priority: element.style.getPropertyPriority("font-size"),
    };
    originalFontStyles.set(element, original);
  }

  element.style.setProperty(
    "font-size",
    `${Math.round(original.computedSize * scale * 100) / 100}px`,
    "important",
  );
  adjustedElements.add(element);
}

function resizeTree(root: HTMLElement, scale: number) {
  if (root instanceof HTMLElement) resizeElement(root, scale);
  root.querySelectorAll<HTMLElement>("*").forEach((element) => resizeElement(element, scale));
}

function observeNewText() {
  if (textObserver || !document.body) return;

  textObserver = new MutationObserver((mutations) => {
    if (activeTextScale === 1) return;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) resizeTree(node, activeTextScale);
      });
    });
  });
  textObserver.observe(document.body, { childList: true, subtree: true });
}

export function applyAccessibilityTextSize(scale: number) {
  activeTextScale = clampAccessibilityTextScale(scale);

  if (activeTextScale === 1) {
    textObserver?.disconnect();
    textObserver = null;
    Array.from(adjustedElements).forEach(restoreFontSize);
    return;
  }

  resizeTree(document.body, activeTextScale);
  observeNewText();
}
