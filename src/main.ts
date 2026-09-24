import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components/header.css';
import './styles/components/kodama.css';
import './styles/components/hero.css';
import './styles/components/work.css';
import './styles/components/warp.css';
import './styles/components/warp-detail.css';
import './styles/components/playground.css';
import './styles/components/about.css';
import './styles/components/records.css';
import './styles/components/experiments.css';
import './styles/components/shelf.css';
import './styles/components/footer.css';
import './styles/components/rail.css';
import './styles/motion.css';

import { site } from './content/site';
import { initNav } from './lib/nav';
import { initKodama } from './lib/kodama';
import { initReveals, initScrollMotion } from './lib/motion';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

root.dataset.booted = '';

window.addEventListener('mousemove', (e) => {
  root.style.setProperty('--mouse-x', `${e.clientX}px`);
  root.style.setProperty('--mouse-y', `${e.clientY}px`);
});

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  
  const updateIcon = (theme: string) => {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'dark') {
      // Moon icon
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      // Sun icon
      icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
  };

  const currentTheme = root.getAttribute('data-theme') || 'light';
  updateIcon(currentTheme);

  toggleBtn.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    if (newTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
  });
}

import { initRail } from './lib/rail';
import type { Sketchbook } from './components/sketchbook';

initThemeToggle();
initNav();
initRail();

mountHeroScene();
mountShelf();

if (reducedMotion) {
  // Nothing to reveal: the stylesheet leaves everything visible.
  root.classList.remove('pre-reveal');
} else {
  initReveals();
}

/**
 * The hero's line-drawn scene, named by its host's data-scene. It is on the
 * first screen, but only decoration, so three.js waits until the page has
 * finished loading and the browser is idle.
 */
function mountHeroScene() {
  const host = document.querySelector<HTMLElement>('[data-scene]');
  if (!host) return;
  const scenes: Record<string, () => Promise<unknown>> = {
    console: () => import('./components/console').then(({ createConsole }) => createConsole(host)),
    ribbon: () => import('./components/ribbon').then(({ createRibbon }) => createRibbon(host)),
  };
  const load = scenes[host.dataset.scene || ''];
  if (!load) return;
  const go = () => requestIdleCallbackShim(() => void load().catch(() => undefined));
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}

/**
 * "More about me": one volume per chapter, built only when it is nearly
 * in view. Without WebGL the section keeps its plain index and
 * nothing else changes. Every way in opens the sketchbook.
 */
function mountShelf() {
  const stage = document.querySelector<HTMLElement>('[data-shelf]');
  if (!stage) return;

  // The index always works: each chapter opens the sketchbook at its spread.
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openSketchbook(link.dataset.chapter || '');
    });
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      import('./components/bookshelf')
        .then(({ createBookshelf }) =>
          createBookshelf(stage, {
            books: site.shelf.books.map((book) => ({
              ...book,
              items: site.records.groups.find((g) => g.label === book.group)?.items ?? [],
            })),
            brand: site.meta.name,
            onOpen: (book) => openSketchbook(book.group),
          }),
        )
        .catch(() => undefined);
    },
    { rootMargin: '40% 0px' },
  );
  observer.observe(stage.closest('section') ?? stage);
}

/* ══════════════════════════════════════════════════════════════════════
   SKETCHBOOK — "More about me", at #me
   ══════════════════════════════════════════════════════════════════════ */

const BOOK_HASH = '#me';
let sketchbook: Promise<Sketchbook> | null = null;
/** Whether opening the book added the #me history entry, so closing can undo it. */
let pushedBookHash = false;

function loadSketchbook() {
  sketchbook ??= Promise.all([import('./components/sketchbook'), import('./site/sketchbook')]).then(
    ([{ createSketchbook }, { sketchbookSections }]) =>
      createSketchbook({
        name: site.meta.name,
        sections: sketchbookSections,
        onClose: leaveBookHash,
      }),
  );
  return sketchbook;
}

/** Opens the sketchbook, at a chapter's spread when given one. */
function openSketchbook(chapter?: string) {
  if (location.hash !== BOOK_HASH) {
    history.pushState(null, '', BOOK_HASH);
    pushedBookHash = true;
  }
  loadSketchbook()
    .then((book) => book.open(chapter))
    .catch(() => undefined);
}

function leaveBookHash() {
  if (location.hash !== BOOK_HASH) return;
  if (pushedBookHash) history.back();
  else history.replaceState(null, '', location.pathname + location.search);
  pushedBookHash = false;
}

document.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement | null)?.closest?.('[data-sketchbook]');
  if (!link) return;
  e.preventDefault();
  openSketchbook();
});

// The address bar and the back button open and close it too.
const syncBookToHash = () => {
  if (location.hash === BOOK_HASH) {
    loadSketchbook()
      .then((book) => book.isOpen() || book.open())
      .catch(() => undefined);
  } else if (sketchbook) {
    pushedBookHash = false;
    sketchbook.then((book) => book.close()).catch(() => undefined);
  }
};
window.addEventListener('popstate', syncBookToHash);
window.addEventListener('hashchange', syncBookToHash);
if (location.hash === BOOK_HASH) syncBookToHash();

/* The scroll layer waits until the page has painted. */
async function enhance() {
  // The case-study window works at every width, so it is wired up before the
  // desktop-only scroll layer bails out.
  import('./lib/warp-detail').then(({ initWarpDetail }) => initWarpDetail());

  // Scrubbed motion is a desktop-only nicety: below this width the layout is
  // a single column and the parallax has nothing to play against. A failure
  // is swallowed on purpose — the page is already complete without any of it.
  const wantsScrollMotion = !reducedMotion && matchMedia('(min-width: 861px)').matches;
  if (!wantsScrollMotion) return;

  // The media planes want scroll velocity, so they are built first and the
  // scroll layer is handed their sink.
  const media = await import('./lib/warp-gl')
    .then(({ initWarpGl }) => initWarpGl())
    .catch(() => null);

  await initScrollMotion({ onVelocity: media?.setVelocity }).catch(() => undefined);
}

if (document.readyState === 'complete') requestIdleCallbackShim(enhance);
else window.addEventListener('load', () => requestIdleCallbackShim(enhance), { once: true });

function requestIdleCallbackShim(callback: () => void) {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(callback);
  else setTimeout(callback, 200);
}


/* ══════════════════════════════════════════════════════════════════════
═════════════════════════════════════════════════════════
   PLAYGROUND
   ══════════════════════════════════════════════════════════════════════ */

import { closeDetail, detailOpen } from './lib/playground/panel.js';

const HASH = '#playground';
let loading: Promise<any> | null = null;
let room: any = null;

async function enterPlayground() {
  document.body.classList.add('pg-open');
  document.getElementById('pg')?.setAttribute('aria-hidden', 'false');
  if (location.hash !== HASH) history.pushState(null, '', HASH);

  if (!room) {
    loading ??= import('./lib/playground/index.js').then((m) => m.createPlayground());
    room = await loading;
  }
  if (document.body.classList.contains('pg-open')) room.start();
}

function exitPlayground() {
  document.body.classList.remove('pg-open');
  document.getElementById('pg')?.setAttribute('aria-hidden', 'true');
  room?.stop();
  if (location.hash === HASH) history.pushState(null, '', location.pathname);
}

document.getElementById('enter-pg')?.addEventListener('click', enterPlayground);
document.getElementById('pg-close')?.addEventListener('click', exitPlayground);

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (detailOpen()) closeDetail();
  else if (document.body.classList.contains('pg-open')) exitPlayground();
});

window.addEventListener('popstate', () => {
  if (location.hash === HASH) enterPlayground();
  else exitPlayground();
});

window.addEventListener('hashchange', () => {
  if (location.hash === HASH) enterPlayground();
  else exitPlayground();
});

if (location.hash === HASH) enterPlayground();


