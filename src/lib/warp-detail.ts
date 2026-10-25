import { gsap } from 'gsap';
import { ITEMS } from './playground/items';

/**
 * Opens a "Featured projects" card into its case study: a white page that
 * rises over the site, read top to bottom in one narrow column, with the
 * way back and its sections in a rail on the left and the neighbouring
 * projects at the foot.
 *
 * Cards with `data-case="<key>"` show that project's case study, rebuilt
 * from the original Readymag page by `scripts/readymag-to-case.py` into
 * `src/content/cases/`. The rest fall back to their short playground
 * description until they have one.
 */
const STUDIES: Record<string, () => Promise<string>> = {
  'yatri-hub': () => import('../content/cases/yatrihub.html?raw').then((m) => m.default),
  'ar-hud': () => import('../content/cases/ar-hud.html?raw').then((m) => m.default),
  'yatri-energy': () => import('../content/cases/yatri-energy.html?raw').then((m) => m.default),
  eduquest: () => import('../content/cases/eduquest.html?raw').then((m) => m.default),
  dashboard: () => import('../content/cases/dashboard.html?raw').then((m) => m.default),
};

/**
 * Studies that open from a link rather than a card, and have an address of
 * their own so they can be shared, e.g. `<a href="#name" data-study="name">`.
 * (#me is the sketchbook, opened from main.ts.)
 */
const HASHES: Record<string, string> = {};

/** The case studies are set in Inter, loaded the first time one opens. */
const STUDY_FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap';

const BASE = import.meta.env.BASE_URL;

export function initWarpDetail() {
  const root = document.getElementById('warp-detail');
  if (!root) return;
  const scrim = root.querySelector<HTMLElement>('.detail__scrim')!;
  const panel = root.querySelector<HTMLElement>('.detail__panel')!;
  const img = root.querySelector<HTMLImageElement>('#detail-img')!;
  const closeBtn = root.querySelector<HTMLElement>('.detail__close')!;
  const content = root.querySelector<HTMLElement>('#detail-rich-content')!;
  const sectionList = root.querySelector<HTMLElement>('#detail-sections')!;
  // The project cards, and anything else that opens a study.
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-case]'));
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
  let reveals: IntersectionObserver | null = null;
  let spy: IntersectionObserver | null = null;

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

  // The rail's section links and the foot's neighbouring projects.
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const jump = target.closest<HTMLAnchorElement>('[data-cs-jump]');
    if (jump) {
      e.preventDefault();
      const section = content.querySelector<HTMLElement>(`#${jump.dataset.csJump}`);
      section?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const next = target.closest<HTMLElement>('[data-cs-go]');
    if (next) {
      e.preventDefault();
      switchTo(next.dataset.csGo || '');
    }
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

  /** Each block rises and fades in as it scrolls into view. */
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
    content.querySelectorAll('[data-cs-reveal]').forEach((el) => {
      if (reduced) el.classList.add('is-in');
      else observer.observe(el);
    });
    reveals = observer;
  }

  /**
   * The rail: one link per section, the one being read set in ink, with a
   * small arrow beside it that slides along as the reader moves on.
   */
  function buildRail() {
    spy?.disconnect();
    const sections = Array.from(content.querySelectorAll<HTMLElement>('.cs-section[data-cs-title]'));
    sectionList.innerHTML =
      `<li class="detail__marker" aria-hidden="true"><svg viewBox="0 0 6 6"><path d="M1.5 0.5 4 3 1.5 5.5" /></svg></li>` +
      sections.map((s) => `<li><a href="#${s.id}" data-cs-jump="${s.id}">${s.dataset.csTitle}</a></li>`).join('');
    const marker = sectionList.querySelector<HTMLElement>('.detail__marker')!;
    const links = new Map(
      sections.map((s) => [s, sectionList.querySelector<HTMLElement>(`[data-cs-jump="${s.id}"]`)!]),
    );
    const setActive = (section: HTMLElement) => {
      links.forEach((link, s) => link.classList.toggle('is-active', s === section));
      // Level with the first line of the active link.
      const item = links.get(section)?.parentElement;
      if (item) marker.style.transform = `translateY(${item.offsetTop}px)`;
    };
    if (sections[0]) setActive(sections[0]);
    // A section is "being read" once its top passes the upper third.
    spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target as HTMLElement);
      },
      { root: panel, rootMargin: '-30% 0px -65% 0px' },
    );
    sections.forEach((s) => spy!.observe(s));
  }

  /** The foot: the projects before and after this one, in the grid's order. */
  function neighbours(key: string) {
    const keys = cards.map((c) => c.dataset.case || '').filter((k) => STUDIES[k]);
    const at = keys.indexOf(key);
    const titleOf = (k: string) =>
      cards.find((c) => c.dataset.case === k)?.querySelector('.title')?.textContent?.trim() || '';
    const link = (k: string | undefined, label: string, side: string) =>
      k
        ? `<a href="#" class="cs-next__link cs-next__link--${side}" data-cs-go="${k}"><span>${label}</span><b>${titleOf(k)}</b></a>`
        : `<span class="cs-next__link cs-next__link--${side} is-empty"><span>${label}</span><b>More soon</b></span>`;
    return `<nav class="cs-next" aria-label="More projects">${link(keys[at - 1], 'Previous project', 'prev')}${link(keys[at + 1], 'Next project', 'next')}</nav>`;
  }

  async function fill(key: string, card: HTMLElement | null) {
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
      content.innerHTML = page.replace(/src="\//g, `src="${BASE}`) + neighbours(key);
      content.hidden = false;
    } else {
      const source = card?.querySelector('img');
      img.src = source?.currentSrc || source?.src || '';
      img.alt = source?.alt || '';
      const item = ITEMS.find((it: { title: string }) => it.title === title);
      root!.querySelector('#detail-note')!.textContent = item?.desc || 'Full case study coming soon.';
      content.innerHTML = '';
      content.hidden = true;
    }
    buildRail();
  }

  /** Moves to another study from the foot, without closing the page. */
  async function switchTo(key: string) {
    if (busy || !STUDIES[key]) return;
    busy = true;
    const card = cards.find((c) => c.dataset.case === key) || null;
    const swap = async () => {
      current = card;
      await fill(key, card);
      panel.scrollTop = 0;
      watchReveals();
    };
    if (reduced) {
      await swap();
      busy = false;
      return;
    }
    await gsap.to(content, { opacity: 0, y: 12, duration: 0.25, ease: 'power2.in' });
    await swap();
    await gsap.fromTo(content, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', clearProps: 'all' });
    busy = false;
  }

  /** Opens a study: the page rises and fades in over the site. */
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
    watchReveals();

    tl?.kill();
    if (reduced) {
      gsap.set([scrim, panel], { opacity: 1 });
      closeBtn.focus({ preventScroll: true });
      busy = false;
      return;
    }

    tl = gsap.timeline({
      onComplete: () => {
        busy = false;
        closeBtn.focus({ preventScroll: true });
      },
    });
    // The page rises, not the panel: a transform on the panel would carry
    // the fixed rail along with the scroll.
    tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.05)
      .fromTo(content, { y: 32 }, { y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform' }, 0.05);
  }

  function closeCard() {
    if (!open) return;
    // Closing mid-animation (Back pressed while it opens, or while it moves
    // to the next study) finishes or drops that first.
    if (busy) {
      tl?.progress(1);
      gsap.killTweensOf(content);
      gsap.set(content, { clearProps: 'all' });
      busy = false;
    }
    busy = true;
    if (HASHES[location.hash]) history.pushState(null, '', location.pathname + location.search);

    const finish = () => {
      root!.hidden = true;
      open = false;
      current = null;
      busy = false;
      reveals?.disconnect();
      spy?.disconnect();
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

    tl = gsap.timeline({ onComplete: finish });
    tl.to(panel, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0).to(
      scrim,
      { opacity: 0, duration: 0.45, ease: 'power2.in' },
      0.1,
    );
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
