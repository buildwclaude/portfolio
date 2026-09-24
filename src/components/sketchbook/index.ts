import './sketchbook.css';
import { motif } from '../../lib/motif';
import type { Book } from '../../content/site';
import { PAGE_BREAK, type Section } from '../../site/sketchbook';

/**
 * "More about me" as a bound set of drawings that opens over the page, in
 * the shelf's technical-drawing style: ruled sheets, crop marks, a title
 * block on every sheet.
 *
 * Every page is real, selectable HTML. A turn is one rigid sheet swinging
 * on the spine, with a front and a back, while a dashed construction arc
 * traces the path of its edge. Every turn is drawn as spread A becoming
 * spread B (B = A + 1) at t ∈ [0, 1]; turning back plays it from 1 to 0.
 *
 * Below 760px the set shows one sheet at a time, hinged at its left edge.
 */
export type SketchbookOptions = {
  name: string;
  sections: (motifSrc: (motif: string) => string) => Section[];
  /** Called after the book closes itself (Escape, the close button). */
  onClose?: () => void;
};

export type Sketchbook = {
  open: (label?: string) => void;
  close: () => void;
  isOpen: () => boolean;
};

type Page = { html: string; section: number; head: string; num: number };

/** Sheet width over sheet height. */
const ASPECT = 0.72;
/** The width sheets are laid out at; everything on a sheet is sized in cqw. */
const MEASURE_W = 500;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', attrs: Record<string, string> = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

export async function createSketchbook(options: SketchbookOptions): Promise<Sketchbook> {
  /* ------------------------------------------------------------- the frame */
  const root = el('div', 'sb', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'More about me', 'data-lenis-prevent': '' });
  root.hidden = true;
  root.innerHTML = `
    <div class="sb__backdrop" aria-hidden="true"></div>
    <header class="sb__top">
      <p class="sb__kicker">More about me — drawing set</p>
      <p class="sb__name">${options.name}</p>
      <button class="sb__close" type="button"><span>Close</span><span aria-hidden="true">✕</span></button>
    </header>
    <div class="sb__stage">
      <button class="sb__arrow sb__arrow--prev" type="button" aria-label="Previous sheet"><span aria-hidden="true">←</span></button>
      <div class="sb__view">
        <div class="sb__book">
          <svg class="sb__arc" aria-hidden="true"><path class="sb__arc-path"/><line class="sb__arc-ray"/><circle class="sb__arc-dot" r="3"/><text class="sb__arc-label"></text></svg>
        </div>
      </div>
      <button class="sb__arrow sb__arrow--next" type="button" aria-label="Next sheet"><span aria-hidden="true">→</span></button>
    </div>
    <footer class="sb__foot">
      <p class="sb__caption" aria-live="polite"></p>
      <nav class="sb__index" aria-label="Chapters"></nav>
      <p class="sb__hint">Drag or ← →</p>
    </footer>
  `;
  document.body.appendChild(root);

  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T;
  const stage = q('.sb__stage');
  const book = q('.sb__book');
  const caption = q('.sb__caption');
  const index = q('.sb__index');
  const prevBtn = q<HTMLButtonElement>('.sb__arrow--prev');
  const nextBtn = q<HTMLButtonElement>('.sb__arrow--next');
  const arc = q<SVGSVGElement>('.sb__arc');
  const arcPath = q<SVGPathElement>('.sb__arc-path');
  const arcRay = q<SVGLineElement>('.sb__arc-ray');
  const arcDot = q<SVGCircleElement>('.sb__arc-dot');
  const arcLabel = q<SVGTextElement>('.sb__arc-label');

  /* ---------------------------------------------------------------- pages */
  const motifCache = new Map<string, string>();
  const motifSrc = (kind: string) => {
    if (!motifCache.has(kind)) motifCache.set(kind, drawMotif(kind as Book['motif']));
    return motifCache.get(kind)!;
  };
  const sections = options.sections(motifSrc);
  await document.fonts.ready.catch(() => undefined);
  const pages = paginate(sections, options.name);
  const sectionStart = sections.map((_, s) => pages.findIndex((p) => p.section === s));

  const realPages = pages.map((p) => {
    const page = el('div', 'sb-page');
    page.innerHTML = pageInner(p, pages.length, options.name, sections[p.section]!.label);
    return page;
  });

  sections.forEach((s, i) => {
    const b = el('button', 'sb__chip', { type: 'button' });
    b.innerHTML = `<span class="sb__chip-num">${String(i).padStart(2, '0')}</span>${s.short}`;
    b.addEventListener('click', () => goToPage(sectionStart[i]!));
    index.appendChild(b);
  });
  const chips = Array.from(index.children) as HTMLElement[];

  /* ---------------------------------------------------------------- state */
  let single = false;
  let v = 0; // the spread (or, single, the sheet) on show
  let turn: { a: number; t: number; leaf: HTMLElement } | null = null;
  let anim: { kind: 'spring' | 'tween'; target: number; vel: number; from: number; dur: number; e: number } | null = null;
  let queue: (() => void)[] = [];
  let isOpen = false;
  let lastFocus: HTMLElement | null = null;
  let raf = 0;
  let last = 0;
  let pw = 0;
  let ph = 0;

  const views = () => (single ? pages.length : Math.ceil(pages.length / 2));
  const leftOf = (s: number) => (single ? -1 : 2 * s);
  const rightOf = (s: number) => (single ? s : 2 * s + 1);
  const viewOfPage = (p: number) => (single ? p : Math.floor(p / 2));

  /* --------------------------------------------------------------- layout */
  function layout() {
    const wasSingle = single;
    const r = stage.getBoundingClientRect();
    single = r.width < 760;
    if (single !== wasSingle) {
      if (turn) finishTurnNow();
      v = viewOfPage(wasSingle ? v : 2 * v);
    }
    // Room above the sheets for the construction arc.
    const availW = single ? r.width - 32 : r.width - 140;
    const availH = r.height - 70;
    pw = Math.floor(Math.max(160, single ? Math.min(availW, availH * ASPECT) : Math.min(availW / 2, availH * ASPECT, 620)));
    ph = Math.round(pw / ASPECT);
    root.style.setProperty('--pw', `${pw}px`);
    root.style.setProperty('--bw', `${single ? pw : pw * 2}px`);
    root.style.setProperty('--bh', `${ph}px`);
    root.style.setProperty('--gx', `${single ? 0 : pw}px`);
    root.classList.toggle('is-single', single);
    if (!turn) paint();
  }

  /* ---------------------------------------------------------------- paint */
  function clearBook() {
    Array.from(book.children).forEach((c) => {
      if (c !== arc) c.remove();
    });
  }

  function place(p: number, side: 'left' | 'right') {
    if (p < 0 || p >= realPages.length) return;
    const page = realPages[p]!;
    page.classList.toggle('is-left', side === 'left');
    page.classList.toggle('is-right', side === 'right');
    book.appendChild(page);
  }

  function paint() {
    clearBook();
    if (!turn) {
      place(leftOf(v), 'left');
      place(rightOf(v), 'right');
    } else {
      place(leftOf(turn.a), 'left');
      place(rightOf(turn.a + 1), 'right');
      book.appendChild(turn.leaf);
      applyTurn(turn.t);
    }
    sync();
  }

  function pageCopy(p: number, side: 'left' | 'right') {
    const src = p >= 0 ? realPages[p] : null;
    const copy = src ? (src.cloneNode(true) as HTMLElement) : el('div', 'sb-page sb-page--back');
    copy.classList.remove('is-left', 'is-right');
    copy.classList.add(`is-${side}`);
    copy.setAttribute('aria-hidden', 'true');
    copy.setAttribute('inert', '');
    return copy;
  }

  /** The turning sheet: A's right-hand page on the front, B's left on the back. */
  function buildLeaf(a: number) {
    const leaf = el('div', 'sb-leaf', { 'aria-hidden': 'true' });
    const front = el('div', 'sb-leaf__face sb-leaf__face--front');
    const back = el('div', 'sb-leaf__face sb-leaf__face--back');
    front.append(pageCopy(rightOf(a), 'right'), el('div', 'sb-leaf__shade'));
    back.append(pageCopy(single ? -1 : leftOf(a + 1), 'left'), el('div', 'sb-leaf__shade'));
    leaf.append(front, back);
    return leaf;
  }

  function applyTurn(t: number) {
    if (!turn) return;
    const deg = 180 * t;
    turn.leaf.style.transform = `rotateY(${(-deg).toFixed(2)}deg)`;
    const lift = Math.sin(Math.PI * t);
    root.style.setProperty('--lift', lift.toFixed(3));
    // Front darkens as it swings away, the back lightens as it lands.
    root.style.setProperty('--shade-front', (Math.min(1, t * 2) * 0.35).toFixed(3));
    root.style.setProperty('--shade-back', (Math.min(1, (1 - t) * 2) * 0.35).toFixed(3));
    drawArc(t);
  }

  /** The construction arc: the path the sheet's free edge travels, seen from above. */
  function drawArc(t: number) {
    const gx = single ? 0 : pw;
    const r = pw;
    const ry = Math.min(56, pw * 0.12);
    const pad = ry + 18;
    const w = single ? pw * 2 : pw * 2;
    const left = single ? -pw : 0;
    arc.setAttribute('viewBox', `${left} ${-pad} ${w} ${pad}`);
    arc.style.left = `${left}px`;
    arc.style.width = `${w}px`;
    arc.style.height = `${pad}px`;
    arc.style.top = `${-pad}px`;
    arcPath.setAttribute('d', `M ${gx + r} -2 A ${r} ${ry} 0 0 0 ${gx - r} -2`);
    const a = Math.PI * t;
    const x = gx + r * Math.cos(a);
    const y = -2 - ry * Math.sin(a);
    arcRay.setAttribute('x1', String(gx));
    arcRay.setAttribute('y1', '-2');
    arcRay.setAttribute('x2', x.toFixed(1));
    arcRay.setAttribute('y2', y.toFixed(1));
    arcDot.setAttribute('cx', x.toFixed(1));
    arcDot.setAttribute('cy', y.toFixed(1));
    arcLabel.setAttribute('x', (x + (t < 0.5 ? 8 : -8)).toFixed(1));
    arcLabel.setAttribute('y', (y - 6).toFixed(1));
    arcLabel.setAttribute('text-anchor', t < 0.5 ? 'start' : 'end');
    arcLabel.textContent = `θ ${Math.round(180 * t)}°`;
  }

  /* -------------------------------------------------------------- turning */
  function startTurn(a: number, t: number) {
    turn = { a, t, leaf: buildLeaf(a) };
    root.classList.add('is-turning');
    paint();
  }

  function endTurn() {
    if (!turn) return;
    v = turn.t >= 0.5 ? turn.a + 1 : turn.a;
    turn = null;
    anim = null;
    root.classList.remove('is-turning');
    paint();
    queue.shift()?.();
  }

  function finishTurnNow() {
    if (!turn) return;
    turn.t = anim ? anim.target : Math.round(turn.t);
    queue = [];
    endTurn();
  }

  function animate(target: number, dur = 0, vel = 0) {
    anim = { kind: dur ? 'tween' : 'spring', target, vel, from: turn!.t, dur, e: 0 };
    kick();
  }

  /** One spread forwards (+1) or back (-1); tweened at a fixed pace when riffling. */
  function step(dir: 1 | -1, dur = 0) {
    if (turn) return;
    if (dir === 1 && v >= views() - 1) return;
    if (dir === -1 && v <= 0) return;
    if (reduced) {
      v += dir;
      paint();
      queue.shift()?.();
      return;
    }
    startTurn(dir === 1 ? v : v - 1, dir === 1 ? 0 : 1);
    animate(dir === 1 ? 1 : 0, dur);
  }

  /** Riffles to the view holding page p. */
  function goToPage(p: number) {
    if (turn) finishTurnNow();
    const n = viewOfPage(p) - v;
    if (!n) return;
    const dur = Math.max(0.18, Math.min(0.55, 1 / Math.abs(n)));
    queue = Array.from({ length: Math.abs(n) - 1 }, () => () => step(n > 0 ? 1 : -1, dur));
    step(n > 0 ? 1 : -1, Math.abs(n) > 1 ? dur : 0);
  }

  function tick(now: number) {
    raf = 0;
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    if (!anim || !turn) return;
    if (anim.kind === 'tween') {
      anim.e += dt;
      const k = Math.min(1, anim.e / anim.dur);
      const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      turn.t = anim.from + (anim.target - anim.from) * ease;
      applyTurn(turn.t);
      if (k >= 1) return endTurn();
    } else {
      const x = turn.t - anim.target;
      anim.vel += (-120 * x - 20 * anim.vel) * dt;
      turn.t = Math.max(0, Math.min(1, turn.t + anim.vel * dt));
      applyTurn(turn.t);
      if (Math.abs(turn.t - anim.target) < 0.003 && Math.abs(anim.vel) < 0.05) {
        turn.t = anim.target;
        return endTurn();
      }
    }
    kick();
  }
  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------ dragging a sheet */
  let drag: { x0: number; y0: number; id: number; dir: 0 | 1 | -1; lastX: number; lastT: number; vx: number } | null = null;

  book.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || turn || (e.target as HTMLElement).closest('a, button')) return;
    drag = { x0: e.clientX, y0: e.clientY, id: e.pointerId, dir: 0, lastX: e.clientX, lastT: e.timeStamp, vx: 0 };
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (!drag.dir) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(e.clientY - drag.y0)) return;
      const dir = dx < 0 ? 1 : -1;
      if (reduced || (dir === 1 && v >= views() - 1) || (dir === -1 && v <= 0)) {
        drag = null;
        return;
      }
      drag.dir = dir;
      window.getSelection()?.removeAllRanges();
      startTurn(dir === 1 ? v : v - 1, dir === 1 ? 0 : 1);
    }
    const k = Math.max(0, Math.min(1, Math.abs(dx) / (pw * (single ? 1 : 1.6))));
    if (turn) {
      turn.t = drag.dir === 1 ? k : 1 - k;
      applyTurn(turn.t);
    }
    const dtm = e.timeStamp - drag.lastT;
    if (dtm > 0) drag.vx = (e.clientX - drag.lastX) / dtm;
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
  });

  const release = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.dir || !turn) return;
    const toward = d.dir === 1 ? turn.t : 1 - turn.t;
    const commit = toward > 0.3 || d.vx * -d.dir > 0.3;
    animate(d.dir === 1 ? (commit ? 1 : 0) : commit ? 0 : 1);
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  /* ------------------------------------------------------------ reporting */
  function sync() {
    const shown = [leftOf(v), rightOf(v)].filter((p) => p >= 0 && p < pages.length);
    const nums = shown.map((p) => String(pages[p]!.num).padStart(2, '0'));
    caption.textContent = `Sheet ${nums.join('–')} / ${String(pages.length).padStart(2, '0')}`;
    const sectionsShown = new Set(shown.map((p) => pages[p]!.section));
    chips.forEach((c, i) => c.classList.toggle('is-current', sectionsShown.has(i)));
    prevBtn.disabled = v <= 0;
    nextBtn.disabled = v >= views() - 1;
  }

  /* -------------------------------------------------------- open & close */
  const inertTargets = ['header', '#main', 'main', 'footer', '.header', '.footer']
    .map((s) => document.querySelector<HTMLElement>(s))
    .filter((x, i, all): x is HTMLElement => !!x && all.indexOf(x) === i && !root.contains(x));

  function open(label?: string) {
    const s = label ? sections.findIndex((x) => x.label === label) : 0;
    const p = sectionStart[Math.max(0, s)] ?? 0;
    if (isOpen) return goToPage(p);
    isOpen = true;
    lastFocus = document.activeElement as HTMLElement | null;
    root.hidden = false;
    document.documentElement.classList.add('is-locked', 'sb-open');
    inertTargets.forEach((x) => x.setAttribute('inert', ''));
    layout();
    v = viewOfPage(p);
    paint();
    requestAnimationFrame(() => root.classList.add('is-open'));
    q<HTMLButtonElement>('.sb__close').focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    if (turn) finishTurnNow();
    root.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked', 'sb-open');
    inertTargets.forEach((x) => x.removeAttribute('inert'));
    setTimeout(() => {
      if (!isOpen) root.hidden = true;
    }, reduced ? 0 : 300);
    lastFocus?.focus({ preventScroll: true });
  }

  const dismiss = () => {
    close();
    options.onClose?.();
  };
  q('.sb__close').addEventListener('click', dismiss);
  q('.sb__backdrop').addEventListener('click', dismiss);

  document.addEventListener(
    'keydown',
    (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        dismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (turn) finishTurnNow();
        step(e.key === 'ArrowRight' ? 1 : -1);
      } else if (e.key === 'Tab') {
        const focusables = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')).filter(
          (x) => !x.closest('[inert]') && x.offsetParent !== null,
        );
        const first = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (!first || !lastEl) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    true,
  );

  new ResizeObserver(() => isOpen && layout()).observe(stage);

  return { open, close, isOpen: () => isOpen };
}

/* ======================================================================
   Pagination: pour each section's blocks onto sheets of a fixed size.
   Everything on a sheet is sized in cqw, so the break points found at the
   measuring width hold at every size the set is shown at.
   ====================================================================== */
function paginate(sections: Section[], name: string): Page[] {
  const host = el('div', 'sb sb--measure', { 'aria-hidden': 'true' });
  const page = el('div', 'sb-page is-right');
  page.style.width = `${MEASURE_W}px`;
  page.style.height = `${Math.round(MEASURE_W / ASPECT)}px`;
  page.innerHTML = pageInner({ html: '', section: 0, head: '', num: 0 }, 0, name, '');
  host.appendChild(page);
  document.body.appendChild(host);
  const body = page.querySelector<HTMLElement>('.sb-page__body')!;
  const overflows = () => body.scrollHeight > body.clientHeight + 1;

  const out: Page[] = [];
  sections.forEach((section, s) => {
    // Every section opens on a left-hand sheet; a gap takes the one before's filler.
    if (out.length % 2 === 1) out.push({ html: sections[s - 1]!.filler, section: s - 1, head: '', num: 0 });
    let blocks: string[] = [];
    const flush = () => {
      if (blocks.length) out.push({ html: blocks.join(''), section: s, head: section.label, num: 0 });
      blocks = [];
      body.innerHTML = '';
    };
    for (const block of section.blocks) {
      if (block === PAGE_BREAK) {
        flush();
        continue;
      }
      body.insertAdjacentHTML('beforeend', block);
      if (overflows() && blocks.length) {
        flush();
        body.insertAdjacentHTML('beforeend', block);
      }
      blocks.push(block);
    }
    flush();
  });
  if (out.length % 2 === 1) out.push({ html: sections[sections.length - 1]!.filler, section: sections.length - 1, head: '', num: 0 });
  host.remove();

  out.forEach((p, i) => (p.num = i + 1));
  return out;
}

/** A sheet: the drawing area, crop marks, and a title block along the foot. */
function pageInner(p: Page, total: number, name: string, title: string) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `
    <span class="sb-page__crop" aria-hidden="true"></span>
    <div class="sb-page__body">${p.html}</div>
    <dl class="sb-page__block">
      <div class="sb-page__cell sb-page__cell--wide"><dt>Project</dt><dd>${name} — More about me</dd></div>
      <div class="sb-page__cell sb-page__cell--wide"><dt>Title</dt><dd>${title}</dd></div>
      <div class="sb-page__cell"><dt>Scale</dt><dd>1 : 1</dd></div>
      <div class="sb-page__cell"><dt>Sheet</dt><dd>${pad(p.num)} / ${pad(total)}</dd></div>
    </dl>
  `;
}

/** The chapter's line drawing, used as a mask so it inks in the theme's colour. */
function drawMotif(kind: Book['motif']) {
  const c = document.createElement('canvas');
  c.width = c.height = 400;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.lineJoin = ctx.lineCap = 'round';
  motif(ctx, kind, 200, 200, 130);
  return c.toDataURL('image/png');
}
