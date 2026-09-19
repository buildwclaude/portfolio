import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components/header.css';
import './styles/components/kodama.css';
import './styles/components/hero.css';
import './styles/components/work.css';
import './styles/components/about.css';
import './styles/components/records.css';
import './styles/components/experiments.css';
import './styles/components/footer.css';
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

import { initHeroCards } from './components/hero-cards';

initThemeToggle();
initNav();
initKodama(reducedMotion);
mountHelix();
initHeroCards();

if (reducedMotion) {
  // Nothing to reveal: the stylesheet leaves everything visible.
  root.classList.remove('pre-reveal');
} else {
  initReveals();
}

/**
 * The helix is well below the fold, so it is not built until it is nearly
 * in view — the component, its stylesheet and its images all stay off the
 * critical path.
 */
function mountHelix() {
  const target = document.querySelector<HTMLElement>('[data-helix]');
  if (!target) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      import('./components/helix-carousel')
        .then(({ createHelixCarousel }) => {
          const images = site.helix.images;
          const helix = createHelixCarousel({
            // Repeated to fill the spiral; it reads as rhythm, not padding.
            images: Array.from({ length: 15 }, (_, i) => images[i % images.length]!.src),
            alt: (i) => images[i % images.length]!.alt,
            speed: 0.45,
            radius: 357, // Extra 0.5mm gap (radius up from 353)
            angleStep: 36, // Exactly 10 cards per revolution
            rise: 50,
            height: 700, // Cinematic height
            label: 'A spiral of project imagery',
          });
          target.appendChild(helix.element);
        })
        .catch(() => undefined);
    },
    { rootMargin: '30% 0px' },
  );
  observer.observe(target);
}

/* The scroll layer waits until the page has painted. */
async function enhance() {
  // Scrubbed motion is a desktop-only nicety: below this width the layout is
  // a single column and the parallax has nothing to play against. A failure
  // is swallowed on purpose — the page is already complete without any of it.
  const wantsScrollMotion = !reducedMotion && matchMedia('(min-width: 861px)').matches;
  if (!wantsScrollMotion) return;

  // The media planes want scroll velocity, so they are built first and the
  // scroll layer is handed their sink.
  const media = await import('./lib/media-gl')
    .then(({ initMediaGl }) => initMediaGl())
    .catch(() => null);

  await initScrollMotion({ onVelocity: media?.setVelocity }).catch(() => undefined);
}

if (document.readyState === 'complete') requestIdleCallbackShim(enhance);
else window.addEventListener('load', () => requestIdleCallbackShim(enhance), { once: true });

function requestIdleCallbackShim(callback: () => void) {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(callback);
  else setTimeout(callback, 200);
}
