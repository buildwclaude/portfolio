import Lenis from 'lenis';
import Gallery from './lib/Gallery.js';
import './style.css';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* 1. INERTIA SCROLL                                                   */
/*    Lenis intercepts the wheel and eases the real scroll position    */
/*    toward the target. `lerp` is the weight of the glide.            */
/* ------------------------------------------------------------------ */
const lenis = new Lenis({
  lerp: 0.075,            // ↓ = heavier / longer glide
  wheelMultiplier: 1.0,
  smoothWheel: !reduce,
  syncTouch: true
});

// Raw velocity from Lenis, in px per frame. Spikes hard, so we smooth it.
let rawVelocity = 0;
let velocity = 0;         // ← this single number drives the whole warp
let scroll = 0;

lenis.on('scroll', ({ velocity: v, scroll: s }) => {
  rawVelocity = v;
  scroll = s;
});

/* ------------------------------------------------------------------ */
/* 2. WEBGL GALLERY                                                    */
/* ------------------------------------------------------------------ */
const gallery = new Gallery(document.querySelector('#gl'));
await gallery.init();

addEventListener('resize', () => {
  gallery.resize();
  lenis.resize();
});

/* ------------------------------------------------------------------ */
/* 3. THE LOOP                                                         */
/* ------------------------------------------------------------------ */
const velEl = document.querySelector('#vel');
const trace = document.querySelector('#trace');
const history = new Array(28).fill(0);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function raf(time) {
  lenis.raf(time);

  // critical: ease the velocity, or the bend snaps and looks cheap.
  velocity += (rawVelocity - velocity) * 0.14;
  if (Math.abs(velocity) < 0.01) velocity = 0;

  gallery.render(reduce ? 0 : velocity, scroll);

  // HUD readout
  history.push(clamp(velocity, -60, 60));
  history.shift();
  trace.setAttribute(
    'points',
    history.map((v, i) => `${i * (86 / 27)},${13 - v * 0.19}`).join(' ')
  );
  velEl.textContent = (Math.abs(velocity) / 10).toFixed(2);

  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* ------------------------------------------------------------------ */
/* 4. chrome                                                           */
/* ------------------------------------------------------------------ */
const clock = document.querySelector('#clock');
const tick = () =>
  (clock.textContent = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kathmandu',
    hour12: false
  }));
tick();
setInterval(tick, 1000);

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80 });
  });
});
