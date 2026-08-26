function handlePreviewResize(event) {
  if (event.source !== $("#preview").contentWindow || event.data?.source !== "central-editor-preview") return;
  if (event.data?.type === "preview-scroll") {
    const stage = $(".preview-stage");
    const deltaX = Number(event.data.deltaX) || 0; const deltaY = Number(event.data.deltaY) || 0;
    stage?.scrollBy({ left: deltaX, top: deltaY, behavior: "auto" });
    return;
  }
  if (event.data?.type === "document-size") {
    const height = Math.ceil(Number(event.data.height));
    if (!Number.isFinite(height) || height < 1 || Math.abs(height - previewDocumentHeight) < 2) return;
    previewDocumentHeight = Math.max(deviceViewports[activeDevice].height, height);
    fitPreview();
    return;
  }
  if (event.data?.type === "ready") { postReactPreviewSelection(); return; }
  if (event.data?.type === "reveal-selection") {
    if (event.data.fixed) return;
    const stage = $(".preview-stage"); const native = deviceViewports[activeDevice];
    const scale = calculatePreviewScale(stage.clientWidth, native, previewZoomMode);
    const top = Math.max(0, (Number(event.data.top) || 0) * scale - stage.clientHeight * .35);
    stage.scrollTo({ top, behavior: "smooth" });
    return;
  }
  if (event.data?.type === "move") {
    const currentSegment = page()?.segments.find((entry) => entry.id === event.data.segmentId);
    const target = currentSegment?.items.find((entry) => entry.id === event.data.itemId);
    const x = Math.round(Number(event.data.x)); const y = Math.round(Number(event.data.y));
    if (!target || !Number.isFinite(x) || !Number.isFinite(y)) return;
    target.position = { x: Math.max(-4096, Math.min(4096, x)), y: Math.max(-4096, Math.min(4096, y)) };
    setDirtyState(); renderResizeControls();
    return;
  }
  if (event.data?.type !== "resize") return;
  const width = Math.round(Number(event.data.width)); const height = Math.round(Number(event.data.height));
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;
  const currentSegment = page()?.segments.find((entry) => entry.id === event.data.segmentId);
  const target = event.data.targetKind === "item" ? currentSegment?.items.find((entry) => entry.id === event.data.itemId) : currentSegment;
  if (!target) return;
  target.size = { width: Math.max(event.data.targetKind === "segment" ? 160 : 40, width), height: Math.max(32, height) };
  setDirtyState(); renderResizeControls();
}

let reactPreviewUpdateTimer = null;
let lastReactPreviewContent = "";

function reactPreviewUrl() {
  if (!previewRuntime?.url) return "";
  const selected = page();
  const parameters = new URLSearchParams({ editorPage: selected?.id || "home" });
  if (selected?.id === "directory") parameters.set("value", audiences()[0]?.id || "cidadao");
  if (selected?.id === "service-detail") {
    const service = catalogServices()[0];
    parameters.set("value", service?.slug || service?.id || "isencao-iptu");
  }
  return previewRuntime.url + "/?" + parameters;
}

function postReactPreviewSelection() {
  if (previewRuntime?.mode !== "react") return;
  $("#preview")?.contentWindow?.postMessage({ source: "central-editor-host", type: "selection", selection: { segmentId: selectedSegmentId || null, itemId: selectedItemId || null } }, "*");
}

function updateReactPreviewDraft() {
  const serialized = JSON.stringify(content);
  if (serialized === lastReactPreviewContent) return;
  lastReactPreviewContent = serialized;
  clearTimeout(reactPreviewUpdateTimer);
  reactPreviewUpdateTimer = setTimeout(async () => {
    const result = await communication.updatePreview(content);
    if (!result?.ok) console.warn(result?.error || "Não foi possível atualizar a prévia React.");
    setTimeout(postReactPreviewSelection, 180);
  }, 90);
}

function resizePreviewScript() {
  return `(() => {
    const selection = window.CENTRAL_EDITOR_SELECTION || {};
    let reportedHeight = 0;
    const reportDocumentSize = () => {
      const root = document.documentElement; const body = document.body; const content = document.getElementById("conteudo");
      const contentBottom = content ? Math.ceil(content.getBoundingClientRect().bottom + window.scrollY) : 0;
      const height = Math.max(root.scrollHeight, body?.scrollHeight || 0, contentBottom);
      if (!height || Math.abs(height - reportedHeight) < 2) return;
      reportedHeight = height;
      window.parent.postMessage({ source: "central-editor-preview", type: "document-size", height }, "*");
    };
    const scheduleDocumentSize = () => requestAnimationFrame(reportDocumentSize);
    new ResizeObserver(scheduleDocumentSize).observe(document.documentElement);
    if (document.body) new ResizeObserver(scheduleDocumentSize).observe(document.body);
    new MutationObserver(scheduleDocumentSize).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    addEventListener("load", scheduleDocumentSize); addEventListener("resize", scheduleDocumentSize);
    addEventListener("wheel", (event) => window.parent.postMessage({ source: "central-editor-preview", type: "preview-scroll", deltaX: event.deltaX, deltaY: event.deltaY }, "*"), { passive: true });
    document.documentElement.style.overflowX = "hidden"; document.documentElement.style.overflowY = "hidden";
    if (document.body) { document.body.style.overflowX = "hidden"; document.body.style.overflowY = "hidden"; }
    scheduleDocumentSize();
    const segment = [...document.querySelectorAll("[data-editor-segment-id]")].find((element) => element.dataset.editorSegmentId === selection.segmentId);
    const selectedItems = selection.itemId ? [...document.querySelectorAll("[data-editor-item-id]")].filter((element) => element.dataset.editorItemId === selection.itemId) : [];
    const selectedItem = selectedItems.find((element) => element.offsetParent) || selectedItems[0];
    const target = selectedItem || segment;
    if (!target) return;
    const targetKind = selectedItem ? "item" : "segment";
    const targetRect = target.getBoundingClientRect();
    window.parent.postMessage({ source: "central-editor-preview", type: "reveal-selection", top: targetRect.top + window.scrollY, fixed: getComputedStyle(target).position === "fixed" || segment?.id === "amanda-widget" }, "*");
    if (segment?.id === "amanda-widget" && targetKind === "segment") return;
    const overlay = document.createElement("div");
    overlay.className = "editor-resize-overlay editor-resize-" + targetKind;
    overlay.setAttribute("aria-hidden", "true");
    ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((direction) => {
      const handle = document.createElement("span"); handle.className = "editor-resize-handle"; handle.dataset.direction = direction; overlay.append(handle);
    });
    if (targetKind === "item") { const handle = document.createElement("span"); handle.className = "editor-drag-handle"; handle.textContent = "✥"; overlay.append(handle); }
    const guideX = document.createElement("div"); guideX.className = "editor-alignment-guide vertical";
    const guideY = document.createElement("div"); guideY.className = "editor-alignment-guide horizontal";
    document.body.append(guideX, guideY);
    document.body.append(overlay);
    const sync = () => { const rect = target.getBoundingClientRect(); Object.assign(overlay.style, { left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px" }); };
    const notify = (width, height) => window.parent.postMessage({ source: "central-editor-preview", type: "resize", targetKind, segmentId: selection.segmentId, itemId: selection.itemId || null, width, height }, "*");
    const notifyMove = (x, y) => window.parent.postMessage({ source: "central-editor-preview", type: "move", targetKind, segmentId: selection.segmentId, itemId: selection.itemId || null, x, y }, "*");
    const positionX = Number(target.dataset.positionX) || 0; const positionY = Number(target.dataset.positionY) || 0;
    let drag = null;
    overlay.addEventListener("pointerdown", (event) => {
      const mover = event.target.closest(".editor-drag-handle");
      if (mover && targetKind === "item") {
        event.preventDefault(); event.stopPropagation();
        const rect = target.getBoundingClientRect(); const container = segment?.getBoundingClientRect();
        drag = { mode: "move", x: event.clientX, y: event.clientY, positionX, positionY, rect, container };
        mover.setPointerCapture(event.pointerId); return;
      }
      const handle = event.target.closest(".editor-resize-handle"); if (!handle) return;
      event.preventDefault(); event.stopPropagation();
      const rect = target.getBoundingClientRect(); drag = { direction: handle.dataset.direction, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height };
      handle.setPointerCapture(event.pointerId);
    });
    overlay.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
      if (drag.mode === "move") {
        let adjustedX = dx; let adjustedY = dy;
        const xGap = drag.container ? drag.container.left + drag.container.width / 2 - (drag.rect.left + drag.rect.width / 2 + dx) : Infinity;
        const yGap = drag.container ? drag.container.top + drag.container.height / 2 - (drag.rect.top + drag.rect.height / 2 + dy) : Infinity;
        const snapX = Math.abs(xGap) <= 9; const snapY = Math.abs(yGap) <= 9;
        if (snapX) adjustedX += xGap; if (snapY) adjustedY += yGap;
        guideX.style.display = snapX ? "block" : "none"; guideY.style.display = snapY ? "block" : "none";
        if (snapX) guideX.style.left = (drag.container.left + drag.container.width / 2) + "px";
        if (snapY) guideY.style.top = (drag.container.top + drag.container.height / 2) + "px";
        const nextX = Math.round(drag.positionX + adjustedX); const nextY = Math.round(drag.positionY + adjustedY);
        target.style.transform = "translate(" + nextX + "px," + nextY + "px)"; sync(); notifyMove(nextX, nextY); return;
      }
      const horizontal = drag.direction.includes("e") ? dx : drag.direction.includes("w") ? -dx : 0;
      const vertical = drag.direction.includes("s") ? dy : drag.direction.includes("n") ? -dy : 0;
      const width = Math.round(Math.min(4096, Math.max(targetKind === "segment" ? 160 : 40, drag.width + horizontal)));
      const height = Math.round(Math.min(4096, Math.max(32, drag.height + vertical)));
      target.style.width = width + "px"; target.style.maxWidth = "100%"; target.style.minHeight = height + "px";
      if (targetKind === "segment") target.style.marginInline = "auto";
      sync(); notify(width, height);
    });
    const finish = (event) => { if (!drag) return; if (drag.mode !== "move") { const rect = target.getBoundingClientRect(); notify(Math.round(rect.width), Math.round(rect.height)); } guideX.style.display = "none"; guideY.style.display = "none"; drag = null; event.target.releasePointerCapture?.(event.pointerId); };
    overlay.addEventListener("pointerup", finish); overlay.addEventListener("pointercancel", finish);
    new ResizeObserver(() => { sync(); scheduleDocumentSize(); }).observe(target); addEventListener("scroll", sync, true); addEventListener("resize", sync); requestAnimationFrame(sync);
  })();`;
}

function previewHtml() {
  const selectedPage = page();
  const previewContent = { ...content, pages: [selectedPage, ...content.pages.filter((entry) => entry.id !== selectedPage.id)] };
  const serialized = JSON.stringify(previewContent).replaceAll("<", "\\u003c");
  const selection = JSON.stringify({ segmentId: selectedSegmentId || null, itemId: selectedItemId || null }).replaceAll("<", "\\u003c");
  const importedCss = (previewAssets?.css || []).join("\n").replace(/<\/style/gi, "<\\/style");
  const trustedAppScript = (previewAssets?.appScript || "").replace(/<\/script/gi, "<\\/script");
  const baseUrl = escapeHtml(previewAssets?.baseUrl || "");
  const editorCss = `.editor-selected-segment{position:relative!important;z-index:40!important;border-radius:0!important;outline:3px solid #f2c94c!important;outline-offset:-3px!important;scroll-margin:64px}.editor-selected-segment::before{content:"SEGMENTO SELECIONADO";position:absolute;z-index:90;top:0;left:0;padding:5px 8px;background:#f2c94c;color:#302400;font:800 8px/1 "Source Sans 3 Variable","Segoe UI",sans-serif;letter-spacing:.08em;pointer-events:none}.editor-selected-item{position:relative!important;z-index:50!important;border-radius:0!important;outline:3px solid #f28c28!important;outline-offset:2px!important;scroll-margin:90px}.editor-resize-overlay{--resize-color:#f2c94c;position:fixed;z-index:2147483000;border:1px dashed var(--resize-color);pointer-events:none}.editor-resize-overlay.editor-resize-item{--resize-color:#f28c28}.editor-resize-handle{position:absolute;width:11px;height:11px;border:2px solid var(--resize-color);background:#fff;pointer-events:auto}.editor-drag-handle{position:absolute;left:50%;top:-28px;width:27px;height:22px;display:grid;place-items:center;transform:translateX(-50%);border:1px solid #c83b3b;background:#fff;color:#c83b3b;font:700 15px/1 Arial,sans-serif;cursor:move;pointer-events:auto;box-shadow:0 2px 7px #0002}.editor-alignment-guide{position:fixed;z-index:2147482999;display:none;background:#e12f2f;pointer-events:none}.editor-alignment-guide.vertical{top:0;bottom:0;width:1px}.editor-alignment-guide.horizontal{left:0;right:0;height:1px}.editor-resize-handle[data-direction="nw"]{left:-6px;top:-6px;cursor:nwse-resize}.editor-resize-handle[data-direction="n"]{left:50%;top:-6px;transform:translateX(-50%);cursor:ns-resize}.editor-resize-handle[data-direction="ne"]{right:-6px;top:-6px;cursor:nesw-resize}.editor-resize-handle[data-direction="e"]{right:-6px;top:50%;transform:translateY(-50%);cursor:ew-resize}.editor-resize-handle[data-direction="se"]{right:-6px;bottom:-6px;cursor:nwse-resize}.editor-resize-handle[data-direction="s"]{left:50%;bottom:-6px;transform:translateX(-50%);cursor:ns-resize}.editor-resize-handle[data-direction="sw"]{left:-6px;bottom:-6px;cursor:nesw-resize}.editor-resize-handle[data-direction="w"]{left:-6px;top:50%;transform:translateY(-50%);cursor:ew-resize}`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${baseUrl}"><style>${importedCss}</style><style>${editorCss}</style><script>window.CENTRAL_CONTENT=${serialized};window.CENTRAL_EDITOR_SELECTION=${selection};</script></head><body><div class="skip-links" aria-label="Atalhos de navegação"><a class="skip" href="#conteudo">Ir para o conteúdo</a><a class="skip" href="#service-search">Ir para a busca</a><a class="skip" href="#publicos">Ir para os públicos</a><a class="skip" href="#todos-os-servicos">Ir para os serviços</a></div><main id="conteudo" tabindex="-1"></main><script>${trustedAppScript}</script><script>${resizePreviewScript()}</script></body></html>`;
}

function renderPreview() {
  previewDocumentHeight = deviceViewports[activeDevice].height;
  const frame = $("#preview");
  if (previewRuntime?.mode === "react" && previewRuntime.url) {
    const url = reactPreviewUrl();
    frame.removeAttribute("srcdoc");
    if (frame.dataset.reactUrl !== url) { frame.dataset.reactUrl = url; frame.src = url; }
    updateReactPreviewDraft();
    postReactPreviewSelection();
    requestAnimationFrame(fitPreview);
    return;
  }
  delete frame.dataset.reactUrl;
  frame.removeAttribute("src");
  frame.srcdoc = previewHtml();
}

function calculatePreviewScale(stageWidth, viewport, mode = "readable", horizontalPadding = 48) {
  if (mode === "actual") return 1;
  const availableWidth = Math.max(1, stageWidth - horizontalPadding - 2);
  return Math.min(1, availableWidth / viewport.width);
}

function fitPreview() {
  const stage = $(".preview-stage"); const viewport = $("#preview-viewport"); const frame = $("#preview");
  if (!stage || !viewport || !frame) return;
  const native = deviceViewports[activeDevice];
  const scale = calculatePreviewScale(stage.clientWidth, native, previewZoomMode);
  const documentHeight = Math.max(native.height, previewDocumentHeight || native.height);
  frame.style.width = `${native.width}px`; frame.style.height = `${documentHeight}px`; frame.style.transform = `scale(${scale})`;
  viewport.style.width = `${Math.floor(native.width * scale)}px`; viewport.style.height = `${Math.ceil(documentHeight * scale)}px`;
  const zoomLabel = previewZoomMode === "actual" ? "100%" : `${Math.floor(scale * 100)}% · Legível`;
  $("#viewport-label").textContent = `${native.width} × ${native.height} · ${zoomLabel}`;
}

globalThis.CentralEditorPreview = { calculatePreviewScale, fitPreview, previewHtml, reactPreviewUrl, resizePreviewScript };
if (typeof module !== "undefined" && module.exports) module.exports = { calculatePreviewScale, resizePreviewScript };
