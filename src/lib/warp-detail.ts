import { gsap } from 'gsap';
import { ITEMS } from './playground/items';

/**
 * Opens a "Featured projects" card into the case-study window. A copy of the
 * card's image lifts out of the grid and lands on the case study's hero
 * picture, then hands over to the page underneath it.
 *
 * Cards with `data-case="<key>"` show that project's full case study: the
 * original Readymag page, rebuilt widget for widget by
 * `scripts/import-readymag.py` into `src/content/studies/`. The rest fall
 * back to their short playground description until they have one.
 */
const STUDIES: Record<string, () => Promise<string>> = {
  'yatri-hub': () => import('../content/studies/yatrihub.html?raw').then((m) => m.default),
  'ar-hud': () => import('../content/studies/ar-hud.html?raw').then((m) => m.default),
  'yatri-energy': () => import('../content/studies/yatri-energy.html?raw').then((m) => m.default),
  eduquest: () => import('../content/studies/eduquest.html?raw').then((m) => m.default),
  dashboard: () => import('../content/studies/dashboard.html?raw').then((m) => m.default),
};

/**
 * Studies that open from a link rather than a card, and have an address of
 * their own so they can be shared, e.g. `<a href="#name" data-study="name">`.
 * (#me is the sketchbook, opened from main.ts.)
 */
const HASHES: Record<string, string> = {};

/**
 * The Readymag pages are set in these, loaded the first time one opens. The
 * variable versions, since the pages set weight with font-variation-settings.
 */
const STUDY_FONTS =
  'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Inter:wght@100..900&family=Manrope:wght@200..800&family=Mulish:wght@200..1000&family=Open+Sans:wght@300..800&display=swap';

const BASE = import.meta.env.BASE_URL;
/** Readymag's desktop canvas width; the page is scaled to the window from it. */
const CANVAS = 1024;
/**
 * Readymag zooms the canvas to fill the window's width (1.4x on a 1440px
 * laptop), so the case studies do the same. Capped where a 1920px screen
 * lands, so an ultra-wide monitor doesn't turn 12px body text into 30px.
 */
const MAX_SCALE = 1.875;

export function initWarpDetail() {
  const root = document.getElementById('warp-detail');
  if (!root) return;
  const scrim = root.querySelector<HTMLElement>('.detail__scrim')!;
  const panel = root.querySelector<HTMLElement>('.detail__panel')!;
  const figure = root.querySelector<HTMLElement>('.detail__figure')!;
  const img = root.querySelector<HTMLImageElement>('#detail-img')!;
  const closeBtn = root.querySelector<HTMLElement>('.detail__close')!;
  const content = root.querySelector<HTMLElement>('#detail-rich-content')!;
  const railFill = root.querySelector<HTMLElement>('.detail-rail__fill');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.warp-card'));
  const inertTargets = ['.header', '#main', '.footer', 'header', 'footer']
    .map((s) => document.querySelector<HTMLElement>(s))
    .filter((el, i, all): el is HTMLElement => !!el && all.indexOf(el) === i && !root.contains(el));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let open = false;
  /** The card the window was opened from; null when opened by link or address. */
  let current: HTMLElement | null = null;
  let busy = false;
  let lastFocus: HTMLElement | null = null;
  let tl: gsap.core.Timeline | null = null;
  let ghost: HTMLImageElement | null = null;
  let reveals: IntersectionObserver | null = null;

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openStudy(card.dataset.case || '', card);
    });
    // Fetch the page before the click lands, so opening never waits on it.
    const load = STUDIES[card.dataset.case || ''];
    if (load) card.addEventListener('pointerenter', () => void load(), { once: true });
  });

  root.querySelectorAll('[data-detail-close]').forEach((el) => {
    el.addEventListener('click', () => closeCard());
  });

  // Links that open a study by name, e.g. "More about me".
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-study]');
    if (!link || e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    openStudy(link.dataset.study || '', null);
  }, true);

  // The address bar and the back button drive the named studies too.
  const syncToHash = () => {
    const key = HASHES[location.hash];
    if (key && !open) openStudy(key, null);
    else if (!key && open && !current) closeCard();
  };
  window.addEventListener('popstate', syncToHash);
  window.addEventListener('hashchange', syncToHash);
  if (HASHES[location.hash]) syncToHash();

  panel.addEventListener(
    'scroll',
    () => {
      const max = panel.scrollHeight - panel.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, panel.scrollTop / max)) : 0;
      if (railFill) gsap.set(railFill, { scaleY: p });
      panel.classList.toggle('is-scrolled', p > 0.02);
    },
    { passive: true },
  );

  window.addEventListener('resize', () => {
    if (open) fitStudy();
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeCard();
    }
    if (e.key === 'Tab') trapFocus(e);
  });

  function trapFocus(e: KeyboardEvent) {
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** Scales the fixed-width Readymag canvas to fill the window, as Readymag does. */
  function fitStudy() {
    const page = content.querySelector<HTMLElement>('.rm');
    if (page) page.style.setProperty('--rm-s', String(Math.min(MAX_SCALE, content.clientWidth / CANVAS)));
  }

  /** Readymag's scroll animation: widgets grow and fade in as they arrive. */
  function watchReveals() {
    reveals?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { root: panel, rootMargin: '0px 0px -6% 0px' },
    );
    content.querySelectorAll('[data-rm-reveal]').forEach((el) => {
      if (reduced) el.classList.add('is-in');
      else observer.observe(el);
    });
    reveals = observer;
  }

  async function fill(key: string, card: HTMLElement | null) {
    const source = card?.querySelector('img');
    const title = card?.querySelector('.title')?.textContent?.trim() || '';
    const num = card?.querySelector('.idx')?.textContent?.trim() || '';
    const spans = card?.querySelectorAll('.meta')[1]?.querySelectorAll('span');
    const meta = spans && spans.length >= 2 ? `${spans[0]!.textContent} · ${spans[1]!.textContent}` : '';
    const load = STUDIES[key];

    root!.querySelector('#detail-num')!.textContent = num;
    root!.querySelector('#detail-title')!.textContent = title;
    root!.querySelector('#detail-meta')!.textContent = meta;
    root!.classList.toggle('detail--study', !!load);

    if (load) {
      loadFonts();
      const page = await load();
      content.innerHTML = page.replace(/src="\//g, `src="${BASE}`);
      content.hidden = false;
      // Native pages (not a Readymag canvas) sit on the site's own paper.
      root!.classList.toggle('detail--native', !content.querySelector('.rm'));
    } else {
      // The card's image is already decoded, so the hero appears instantly.
      img.src = source?.currentSrc || source?.src || '';
      img.alt = source?.alt || '';
      const item = ITEMS.find((it: { title: string }) => it.title === title);
      root!.querySelector('#detail-note')!.textContent = item?.desc || 'Full case study coming soon.';
      content.innerHTML = '';
      content.hidden = true;
      root!.classList.remove('detail--native');
    }
  }

  /**
   * Where the flying image lands: the study's copy of the card's picture if it
   * has one, else its first picture; or the plain hero for cards without one.
   */
  function landing(card: HTMLElement | null): HTMLElement {
    if (!root!.classList.contains('detail--study')) return figure;
    const file = card?.querySelector('img')?.getAttribute('src')?.split('/').pop();
    const match = file ? content.querySelector(`.rm-pic img[src$="/${file}"]`) : null;
    return match?.parentElement || content.querySelector<HTMLElement>('.rm-pic') || content;
  }

  function makeGhost(card: HTMLElement) {
    const source = card.querySelector('img');
    const el = document.createElement('img');
    el.className = 'detail__ghost';
    el.src = source?.currentSrc || source?.src || '';
    el.alt = '';
    document.body.appendChild(el);
    return el;
  }

  function rectVars(r: DOMRect) {
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  /** Opens a study; from a card the card's image flies in, otherwise it fades. */
  async function openStudy(key: string, card: HTMLElement | null) {
    if (busy || open || (!card && !STUDIES[key])) return;
    busy = true;
    open = true;
    current = card;
    lastFocus = document.activeElement as HTMLElement;

    const hash = Object.keys(HASHES).find((h) => HASHES[h] === key);
    if (hash && location.hash !== hash) history.pushState(null, '', hash);

    await fill(key, card);
    root!.hidden = false;
    document.documentElement.classList.add('is-locked');
    inertTargets.forEach((el) => el.setAttribute('inert', ''));
    panel.scrollTop = 0;
    panel.classList.remove('is-scrolled');
    if (railFill) gsap.set(railFill, { scaleY: 0 });
    fitStudy();
    watchReveals();

    tl?.kill();
    if (reduced) {
      gsap.set([scrim, panel], { opacity: 1 });
      closeBtn.focus({ preventScroll: true });
      busy = false;
      return;
    }

    if (!card) {
      tl = gsap.timeline({
        onComplete: () => {
          busy = false;
          closeBtn.focus({ preventScroll: true });
        },
      });
      tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0)
        .fromTo(panel, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.1);
      return;
    }

    const from = (card.querySelector('figure') || card).getBoundingClientRect();
    const to = landing(card).getBoundingClientRect();

    card.classList.add('is-lifting');
    ghost?.remove();
    ghost = makeGhost(card);

    tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        ghost?.remove();
        ghost = null;
        busy = false;
        closeBtn.focus({ preventScroll: true });
      },
    });

    tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(ghost, rectVars(from), { ...rectVars(to), duration: 0.9 }, 0)
      .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.3)
      .to(ghost, { opacity: 0, duration: 0.35, ease: 'power1.out' }, 0.85);
  }

  function closeCard() {
    if (!open) return;
    // Closing mid-animation (Back pressed while it opens) finishes it first.
    if (busy) {
      tl?.progress(1);
      if (!open || busy) return;
    }
    const card = current;
    busy = true;
    if (HASHES[location.hash]) history.pushState(null, '', location.pathname + location.search);

    const finish = () => {
      root!.hidden = true;
      open = false;
      current = null;
      busy = false;
      ghost?.remove();
      ghost = null;
      reveals?.disconnect();
      card?.classList.remove('is-lifting');
      document.documentElement.classList.remove('is-locked');
      inertTargets.forEach((el) => el.removeAttribute('inert'));
      lastFocus?.focus({ preventScroll: true });
      gsap.set([scrim, panel], { clearProps: 'all' });
    };

    tl?.kill();
    if (reduced) {
      finish();
      return;
    }

    tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finish });

    // Fly the image back only while the hero is still on screen; deep in the
    // page a plain fade reads better than an image arriving from above.
    const to = landing(card).getBoundingClientRect();
    if (card && to.bottom > to.height * 0.4) {
      const from = (card.querySelector('figure') || card).getBoundingClientRect();
      ghost?.remove();
      ghost = makeGhost(card);
      tl.fromTo(ghost, { ...rectVars(to), opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 0)
        .to(ghost, { ...rectVars(from), duration: 0.75 }, 0.15)
        .to(panel, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.15)
        .to(scrim, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.4);
    } else {
      tl.to(panel, { opacity: 0, y: 24, duration: 0.4, ease: 'power2.in' }, 0).to(
        scrim,
        { opacity: 0, duration: 0.45, ease: 'power2.in' },
        0.1,
      );
    }
  }
}

let fontsLoaded = false;
function loadFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STUDY_FONTS;
  document.head.appendChild(link);
}
