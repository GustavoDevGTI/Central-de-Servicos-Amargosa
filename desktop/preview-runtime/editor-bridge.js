import siteContent from './content/site.json';

const SOURCE = 'central-editor-preview';
let selection = { segmentId: null, itemId: null };
let overlay = null;
let guides = [];
let resizeObserver = null;

const editorStyle = document.createElement('style');
editorStyle.textContent = `
  .editor-selected-segment{position:relative!important;z-index:40!important;outline:3px solid #f2c94c!important;outline-offset:-3px!important;scroll-margin:64px}
  .editor-selected-item{position:relative!important;z-index:50!important;outline:3px solid #f28c28!important;outline-offset:2px!important;scroll-margin:90px}
  .editor-resize-overlay{--resize-color:#f2c94c;position:fixed;z-index:2147483000;border:1px dashed var(--resize-color);pointer-events:none}
  .editor-resize-overlay.editor-resize-item{--resize-color:#f28c28}
  .editor-resize-handle{position:absolute;width:11px;height:11px;border:2px solid var(--resize-color);background:#fff;pointer-events:auto}
  .editor-drag-handle{position:absolute;left:50%;top:-28px;width:27px;height:22px;display:grid;place-items:center;transform:translateX(-50%);border:1px solid #c83b3b;background:#fff;color:#c83b3b;font:700 15px/1 Arial,sans-serif;cursor:move;pointer-events:auto;box-shadow:0 2px 7px #0002}
  .editor-alignment-guide{position:fixed;z-index:2147482999;display:none;background:#e12f2f;pointer-events:none}.editor-alignment-guide.vertical{top:0;bottom:0;width:1px}.editor-alignment-guide.horizontal{left:0;right:0;height:1px}
  .editor-resize-handle[data-direction="nw"]{left:-6px;top:-6px;cursor:nwse-resize}.editor-resize-handle[data-direction="n"]{left:50%;top:-6px;transform:translateX(-50%);cursor:ns-resize}.editor-resize-handle[data-direction="ne"]{right:-6px;top:-6px;cursor:nesw-resize}.editor-resize-handle[data-direction="e"]{right:-6px;top:50%;transform:translateY(-50%);cursor:ew-resize}.editor-resize-handle[data-direction="se"]{right:-6px;bottom:-6px;cursor:nwse-resize}.editor-resize-handle[data-direction="s"]{left:50%;bottom:-6px;transform:translateX(-50%);cursor:ns-resize}.editor-resize-handle[data-direction="sw"]{left:-6px;bottom:-6px;cursor:nesw-resize}.editor-resize-handle[data-direction="w"]{left:-6px;top:50%;transform:translateY(-50%);cursor:ew-resize}
`;
document.head.append(editorStyle);

function activePage() {
  const requested = new URLSearchParams(location.search).get('editorPage') || 'home';
  return siteContent.pages.find((page) => page.id === requested) || siteContent.pages[0];
}

function annotateSegments() {
  const entries = activePage().segments.filter((segment) => segment.enabled);
  const elements = [...document.querySelectorAll('.editable-segment,.internal-editable')];
  entries.forEach((segment, index) => {
    const element = elements[index];
    if (!element) return;
    element.dataset.editorSegmentId = segment.id;
    const byType = new Map();
    segment.items.forEach((item) => {
      if (element.querySelector('[data-editor-item-id="' + CSS.escape(item.id) + '"]')) return;
      let candidates = byType.get(item.type);
      if (!candidates) {
        const selector = item.type === 'image' ? 'img'
          : item.type === 'link' ? 'a'
          : item.type === 'search' ? 'form,input,.context-filter-grid'
          : ['audience','category'].includes(item.type) ? 'button'
          : ['service','serviceRef'].includes(item.type) ? 'a'
          : item.role === 'title' ? 'h1,h2'
          : item.role === 'description' ? 'p'
          : item.role === 'eyebrow' ? '.eyebrow,small'
          : 'span,strong,small,p';
        candidates = [...element.querySelectorAll(selector)].filter((node) => !node.closest('[data-editor-segment-id]') || node.closest('[data-editor-segment-id]') === element);
        byType.set(item.type, candidates);
      }
      const target = candidates.shift();
      if (target) target.dataset.editorItemId = item.id;
    });
  });
}

function cleanupOverlay() {
  resizeObserver?.disconnect(); resizeObserver = null;
  overlay?.remove(); overlay = null;
  guides.forEach((guide) => guide.remove()); guides = [];
  document.querySelectorAll('.editor-selected-segment,.editor-selected-item').forEach((node) => node.classList.remove('editor-selected-segment', 'editor-selected-item'));
}

function post(type, data = {}) { parent.postMessage({ source: SOURCE, type, ...data }, '*'); }

function reportSize() {
  const root = document.documentElement; const body = document.body;
  post('document-size', { height: Math.max(root.scrollHeight, body?.scrollHeight || 0) });
}

function applySelection() {
  annotateSegments(); cleanupOverlay();
  const segment = [...document.querySelectorAll('[data-editor-segment-id]')].find((node) => node.dataset.editorSegmentId === selection.segmentId);
  const candidates = selection.itemId ? [...document.querySelectorAll('[data-editor-item-id]')].filter((node) => node.dataset.editorItemId === selection.itemId) : [];
  const item = candidates.find((node) => node.offsetParent) || candidates[0];
  const target = item || segment;
  if (!target) return reportSize();
  segment?.classList.add('editor-selected-segment');
  item?.classList.add('editor-selected-item');
  const kind = item ? 'item' : 'segment';
  const rect = target.getBoundingClientRect();
  post('reveal-selection', { top: rect.top + scrollY, fixed: getComputedStyle(target).position === 'fixed' });
  if (getComputedStyle(target).position === 'fixed' && kind === 'segment') return;
  overlay = document.createElement('div'); overlay.className = `editor-resize-overlay editor-resize-${kind}`; overlay.setAttribute('aria-hidden', 'true');
  for (const direction of ['nw','n','ne','e','se','s','sw','w']) { const handle = document.createElement('span'); handle.className = 'editor-resize-handle'; handle.dataset.direction = direction; overlay.append(handle); }
  if (kind === 'item') { const handle = document.createElement('span'); handle.className = 'editor-drag-handle'; handle.textContent = '✥'; overlay.append(handle); }
  const guideX = document.createElement('div'); guideX.className = 'editor-alignment-guide vertical';
  const guideY = document.createElement('div'); guideY.className = 'editor-alignment-guide horizontal';
  guides = [guideX, guideY]; document.body.append(guideX, guideY, overlay);
  const sync = () => { if (!overlay?.isConnected) return; const next = target.getBoundingClientRect(); Object.assign(overlay.style, { left:`${next.left}px`, top:`${next.top}px`, width:`${next.width}px`, height:`${next.height}px` }); };
  let drag = null;
  overlay.addEventListener('pointerdown', (event) => {
    const mover = event.target.closest('.editor-drag-handle'); const handle = event.target.closest('.editor-resize-handle');
    if (!mover && !handle) return; event.preventDefault(); event.stopPropagation();
    const current = target.getBoundingClientRect(); const container = segment?.getBoundingClientRect();
    drag = { mode: mover ? 'move' : 'resize', direction: handle?.dataset.direction, x:event.clientX, y:event.clientY, width:current.width, height:current.height, positionX:Number(target.dataset.positionX)||0, positionY:Number(target.dataset.positionY)||0, rect:current, container };
    event.target.setPointerCapture(event.pointerId);
  });
  overlay.addEventListener('pointermove', (event) => {
    if (!drag) return; const dx=event.clientX-drag.x; const dy=event.clientY-drag.y;
    if (drag.mode === 'move') {
      let x=dx,y=dy; const xGap=drag.container ? drag.container.left+drag.container.width/2-(drag.rect.left+drag.rect.width/2+dx) : Infinity; const yGap=drag.container ? drag.container.top+drag.container.height/2-(drag.rect.top+drag.rect.height/2+dy) : Infinity;
      const snapX=Math.abs(xGap)<=9,snapY=Math.abs(yGap)<=9; if(snapX)x+=xGap;if(snapY)y+=yGap; guideX.style.display=snapX?'block':'none';guideY.style.display=snapY?'block':'none';if(snapX)guideX.style.left=`${drag.container.left+drag.container.width/2}px`;if(snapY)guideY.style.top=`${drag.container.top+drag.container.height/2}px`;
      const nextX=Math.round(drag.positionX+x),nextY=Math.round(drag.positionY+y); target.style.transform=`translate(${nextX}px,${nextY}px)`; sync(); post('move',{targetKind:kind,segmentId:selection.segmentId,itemId:selection.itemId,x:nextX,y:nextY}); return;
    }
    const horizontal=drag.direction.includes('e')?dx:drag.direction.includes('w')?-dx:0; const vertical=drag.direction.includes('s')?dy:drag.direction.includes('n')?-dy:0;
    const width=Math.round(Math.max(kind==='segment'?160:40,drag.width+horizontal)); const height=Math.round(Math.max(32,drag.height+vertical)); target.style.width=`${width}px`;target.style.maxWidth='100%';target.style.minHeight=`${height}px`;sync();post('resize',{targetKind:kind,segmentId:selection.segmentId,itemId:selection.itemId,width,height});
  });
  const finish = (event) => { drag=null; guideX.style.display='none';guideY.style.display='none';event.target.releasePointerCapture?.(event.pointerId); };
  overlay.addEventListener('pointerup',finish);overlay.addEventListener('pointercancel',finish);
  resizeObserver = new ResizeObserver(() => { sync(); reportSize(); }); resizeObserver.observe(target);
  addEventListener('scroll',sync,true); requestAnimationFrame(sync); reportSize();
}

addEventListener('message', (event) => {
  if (event.data?.source !== 'central-editor-host' || event.data.type !== 'selection') return;
  selection = event.data.selection || selection; requestAnimationFrame(applySelection);
});
addEventListener('wheel', (event) => post('preview-scroll', { deltaX:event.deltaX, deltaY:event.deltaY }), { passive:true });
addEventListener('load', () => { reportSize(); post('ready'); });
new MutationObserver(() => requestAnimationFrame(() => { annotateSegments(); reportSize(); })).observe(document.documentElement, { childList:true, subtree:true });
