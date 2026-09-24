/**
 * Motion.
 *
 * Three layers, in order of cost:
 *
 *   1. CSS + IntersectionObserver for every entrance. This is the whole
 *      site's reveal system and it ships in the main bundle.
 *   2. Lenis, so the page glides under the wheel instead of stepping.
 *   3. GSAP + ScrollTrigger for the one thing CSS cannot do portably yet:
 *      motion scrubbed to scroll position.
 *
 * Layers 2 and 3 load together, on demand, on large viewports only. Under
 * `prefers-reduced-motion` none of it runs and nothing is imported — the
 * page is simply already in its finished state.
 */

/* Entrances --------------------------------------------------------------- */

const STAGGER_MS = 70;

export function initReveals(root: ParentNode = document) {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (targets.length === 0) return;

  /* Siblings that arrive together read as a pop unless they are dealt out
     one after another. The delay is set once, here, rather than written
     into the markup for every item. */
  for (const target of targets) {
    const group = target.parentElement;
    if (!group?.hasAttribute('data-reveal-stagger')) continue;
    const index = Array.prototype.indexOf.call(group.children, target);
    target.style.setProperty('--reveal-delay', `${index * STAGGER_MS}ms`);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target); // one-shot: entrances never replay
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );

  /* Whatever is on the first screen at load arrives straight away. The
     observer's bottom margin is for things scrolled into view; applied here
     it would hold back anything sitting low on the landing screen. */
  const fold = window.innerHeight;
  for (const target of targets) {
    if (target.getBoundingClientRect().top < fold) target.classList.add('is-revealed');
    else observer.observe(target);
  }
}

/* Scroll ------------------------------------------------------------------ */

type ScrollMotionOptions = {
  /** Receives damped scroll velocity, roughly -1..1, once per frame. */
  onVelocity?: (velocity: number) => void;
};

/* Lenis reports px/frame; this maps a hard flick to roughly 1.0. */
const VELOCITY_SCALE = 1 / 48;
const VELOCITY_CLAMP = 1.5;

/**
 * Smooth scrolling and scroll-scrubbed motion. Everything here is
 * decoration on top of a page that is already complete, so it is imported
 * after first paint and skipped on small viewports and reduced motion.
 */
export async function initScrollMotion({ onVelocity }: ScrollMotionOptions = {}) {
  const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('lenis'),
  ]);

  gsap.registerPlugin(ScrollTrigger);

  /* --- Smooth scrolling -------------------------------------------------
     Short and lightly damped: the page should settle a beat after the
     wheel stops, not coast. Touch is left native — inertia on top of
     inertia feels wrong and costs battery. */
  const lenis = new Lenis({
    lerp: 0.11,
    wheelMultiplier: 0.95,
    syncTouch: false,
    autoRaf: false,
  });

  // One clock for everything, so scrubbed motion never lags the scroll and
  // the media planes read the same velocity GSAP is stepping on.
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
    if (onVelocity) {
      onVelocity(
        gsap.utils.clamp(-VELOCITY_CLAMP, VELOCITY_CLAMP, (lenis.velocity || 0) * VELOCITY_SCALE),
      );
    }
  });
  gsap.ticker.lagSmoothing(0);

  linkAnchorsToLenis(lenis);

  /* --- Scrubbed motion --------------------------------------------------- */

  // Featured project images drift inside their frame — under 4% of the
  // frame height, enough to feel alive and not enough to notice.
  const media = gsap.utils.toArray<HTMLElement>('.piece__media-inner');
  for (const element of media) {
    gsap.fromTo(
      element,
      { yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: {
          trigger: element.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
        },
      },
    );
  }

  // Section rules draw themselves across as the section arrives.
  const rules = gsap.utils.toArray<HTMLElement>('.section__rule');
  for (const rule of rules) {
    gsap.fromTo(
      rule,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center',
        scrollTrigger: {
          trigger: rule,
          // The end has to stay inside the viewport the last rule can reach:
          // the footer's rule never scrolls past three-quarters of the screen.
          start: 'top 96%',
          end: 'top 72%',
          scrub: 0.8,
        },
      },
    );
  }
}

/* Anchors ----------------------------------------------------------------- */

type LenisLike = { scrollTo: (target: string | HTMLElement, options?: object) => void };

/**
 * In-page links have to travel through Lenis, or they jump while the
 * smooth scroller is looking the other way. Focus moves with them, which
 * the browser would otherwise have done for us.
 *
 * Clearance under the fixed header is not set here: Lenis reads
 * `scroll-padding-top` for itself, so the one value in `base.css` governs
 * both the smooth path and the native one.
 */
function linkAnchorsToLenis(lenis: LenisLike) {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement) || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;

    event.preventDefault();
    lenis.scrollTo(target, { duration: 1.1 });
    history.pushState(null, '', hash);

    // Keyboard users must land where the page just went.
    const restore = target.getAttribute('tabindex');
    if (restore === null) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (restore === null) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  });
}
