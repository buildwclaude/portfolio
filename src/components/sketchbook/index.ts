import './sketchbook.css';
import { motif } from '../../lib/motif';
import type { Book } from '../../content/site';
import type { Section } from '../../site/sketchbook';

/**
 * "More about me" as a reader that opens over the page: one frosted-glass
 * panel, in the shelf card's style, with the chapters listed down its side
 * and all of them set in one scrolling column. Opening at a chapter scrolls
 * straight to it; the list follows the reading position.
 *
 * Below 760px the list becomes a row of chips across the top.
 */
export type SketchbookOptions = {
  name: string;
  sections: (motifSrc: (motif: string) => string) => Section[];
  /** Called after the reader closes itself (Escape, the close button). */
  onClose?: () => void;
};

export type Sketchbook = {
  open: (label?: string) => void;
  close: () => void;
  isOpen: () => boolean;
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', attrs: Record<string, string> = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

export async function createSketchbook(options: SketchbookOptions): Promise<Sketchbook> {
  const motifCache = new Map<string, string>();
  const motifSrc = (kind: string) => {
    if (!motifCache.has(kind)) motifCache.set(kind, drawMotif(kind as Book['motif']));
    return motifCache.get(kind)!;
  };
  const sections = options.sections(motifSrc);

  /* ------------------------------------------------------------- the frame */
  const root = el('div', 'sb', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'More about me', 'data-lenis-prevent': '' });
  root.hidden = true;
  root.innerHTML = `
    <div class="sb__backdrop" aria-hidden="true"></div>
    <div class="sb__panel">
      <aside class="sb__side">
        <div class="sb__brand">
          <p class="sb-kicker">More about me</p>
          <p class="sb__name"></p>
        </div>
        <nav class="sb__nav" aria-label="Chapters"></nav>
      </aside>
      <div class="sb__scroll" tabindex="-1"></div>
      <button class="sb__close" type="button" aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(root);

  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T;
  const scroller = q('.sb__scroll');
  const nav = q('.sb__nav');
  q('.sb__name').textContent = options.name;

  const blocks = sections.map((s, i) => {
    const sec = el('section', 'sb-sec', { 'aria-label': s.label, id: `sb-${i}` });
    sec.innerHTML = s.html;
    scroller.appendChild(sec);
    return sec;
  });

  const tabs = sections.map((s, i) => {
    const b = el('button', 'sb__tab', { type: 'button' });
    b.innerHTML = `<span class="sb__tab-num">${String(i).padStart(2, '0')}</span><span>${s.short}</span>`;
    b.addEventListener('click', () => goTo(i, !reduced));
    nav.appendChild(b);
    return b;
  });

  /* ------------------------------------------------------------ navigation */
  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    tabs.forEach((t, j) => {
      t.classList.toggle('is-active', j === i);
      if (j === i) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    // Keep the active chip in view in the narrow layout's scrolling row.
    tabs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  /** Where a chapter starts within the reading column. */
  const topOf = (b: HTMLElement) => b.offsetTop - scroller.offsetTop;

  function goTo(i: number, smooth = false) {
    const target = blocks[i];
    if (!target) return;
    scroller.scrollTo({ top: Math.max(0, topOf(target) - 40), behavior: smooth ? 'smooth' : 'auto' });
    setActive(i);
  }

  // The chapter whose top has most recently passed the upper third is the one being read.
  const track = () => {
    const line = scroller.scrollTop + scroller.clientHeight * 0.33;
    let i = 0;
    blocks.forEach((b, j) => {
      if (topOf(b) <= line) i = j;
    });
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) i = blocks.length - 1;
    setActive(i);
  };
  scroller.addEventListener('scroll', track, { passive: true });

  /* -------------------------------------------------------- open & close */
  let isOpen = false;
  let lastFocus: HTMLElement | null = null;
  const inertTargets = ['header', '#main', 'main', 'footer', '.header', '.footer']
    .map((s) => document.querySelector<HTMLElement>(s))
    .filter((x, i, all): x is HTMLElement => !!x && all.indexOf(x) === i && !root.contains(x));

  function open(label?: string) {
    const i = Math.max(0, label ? sections.findIndex((x) => x.label === label) : 0);
    if (isOpen) return goTo(i, !reduced);
    isOpen = true;
    lastFocus = document.activeElement as HTMLElement | null;
    root.hidden = false;
    document.documentElement.classList.add('is-locked', 'sb-open');
    inertTargets.forEach((x) => x.setAttribute('inert', ''));
    goTo(i);
    requestAnimationFrame(() => root.classList.add('is-open'));
    q<HTMLButtonElement>('.sb__close').focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
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
      } else if (e.key === 'Tab') {
        const focusables = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')).filter(
          (x) => x.offsetParent !== null,
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

  return { open, close, isOpen: () => isOpen };
}

/** A chapter's line drawing, in black on transparent: the stylesheet uses it as a mask. */
function drawMotif(kind: Book['motif']) {
  const c = document.createElement('canvas');
  c.width = c.height = 400;
  const ctx = c.getContext('2d')!;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 14;
  ctx.lineJoin = ctx.lineCap = 'round';
  motif(ctx, kind, 200, 200, 130);
  return c.toDataURL('image/png');
}
