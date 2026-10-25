import { html } from '../lib/html';

/**
 * The selected work, in order. The hero's featured stage and the grid below
 * it both read this list, so they always show the same pieces. `key` names
 * the case study `lib/warp-detail.ts` opens.
 */
export const selectedWork = [
  { key: 'yatri-hub', title: 'Yatri Hub', disciplines: 'Product Design · UX Research', year: '2025', cover: '/work/yatrihub/41e0eb98-67ccc7.webp', shape: 'square', fallback: 'field', blurb: 'A companion app for electric-bike riders that cut trip-planning uncertainty by 67%.' },
  { key: 'ar-hud', title: 'AR Head-Up Display', disciplines: 'AR · Research', year: '2026', cover: '/work/ar-hud.webp', shape: 'tall', fallback: 'moire', tone: 'sketch', blurb: 'Augmented-reality interfaces for astronaut spacesuits, with Moon-to-Mars missions in mind.' },
  { key: 'yatri-energy', title: 'Yatri Energy', disciplines: 'Product Design · UX', year: '2023', cover: '/work/yatri-energy/4bfbc0b6-6d6f66.webp', shape: 'square', fallback: 'rings', blurb: 'Finding, paying for and using EV charging in Nepal, with the friction taken out.' },
  { key: 'eduquest', title: 'EduQuest', disciplines: 'UX Research · Product Design', year: '2024', cover: '/work/eduquest/f66cce46-56c348.webp', shape: 'tall', fallback: 'strata', blurb: 'A home for structured mentorship, replacing scattered social-media threads.' },
  { key: 'dashboard', title: 'Dynamic Dashboard', disciplines: 'UX Research · Product Design', year: '2024', cover: '/work/dashboard/edb34e0b-4271df.webp', shape: 'square', fallback: 'dots', blurb: 'An interactive motorcycle dashboard riders actually engage with.' },
] as const;

export type Work = (typeof selectedWork)[number];

export const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Each thumbnail is a quiet tile holding one thing — an app icon, a word, a
 * single control — rendered with some depth rather than as a screenshot. The
 * covers stay on the list for the case studies.
 */
function mark(w: Work) {
  switch (w.key) {
    case 'yatri-hub':
      // The app's battery, from its home screen: the cell, the bolt, the level beside.
      return html`
        <span class="tile__battery" role="img" aria-label="${w.title}: battery at 70 percent">
          <span class="tile__battery-cell" aria-hidden="true">
            <span class="tile__battery-fill"></span>
            <svg viewBox="0 0 12 16"><path d="M7 0L0 9h5l-1 7 7-9H6z" /></svg>
          </span>
          <span class="tile__battery-read"><b>70%</b><span>Battery</span></span>
        </span>`;
    case 'ar-hud':
      // One pane of the visor's glass, tilted in the dark: the way home.
      return html`
        <span class="tile__glass" role="img" aria-label="A head-up display panel showing the way back to base, 240 metres">
          <span class="tile__glass-head"><span>NAV</span><span>EVA 02:14</span></span>
          <span class="tile__glass-main">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 17-7-4-7 4z" /></svg>
            <b>240<small> m</small></b>
          </span>
          <span class="tile__glass-sub">Return to base</span>
          <span class="tile__glass-bar" aria-hidden="true"><span></span></span>
          <span class="tile__glass-foot"><span>O₂</span><span>98%</span></span>
        </span>`;
    case 'yatri-energy':
      // One widget: a station, mid-charge.
      return html`
        <span class="tile__widget" role="img" aria-label="A charging widget at 72 percent">
          <span class="tile__widget-head">
            <span class="tile__widget-dot" aria-hidden="true"></span>Station 04
            <span class="tile__widget-time">38 min</span>
          </span>
          <span class="tile__charge" aria-hidden="true">
            <span class="tile__charge-fill">
              <span class="tile__charge-knob"><svg viewBox="0 0 12 16"><path d="M7 0L0 9h5l-1 7 7-9H6z" /></svg></span>
            </span>
          </span>
          <span class="tile__widget-foot" aria-hidden="true"><b>72%</b><span>22 kW · Fast</span></span>
        </span>`;
    case 'eduquest':
      // Two messages: a question, and a mentor's answer.
      return html`
        <span class="tile__chat" role="img" aria-label="${w.title}: a mentee asks where to start in UX, and a mentor replies">
          <span class="tile__bubble tile__bubble--ask">Where do I start in UX?</span>
          <span class="tile__bubble tile__bubble--reply">Let’s map it out together ✦</span>
        </span>`;
    case 'dashboard':
      return gauge();
  }
}

/** Dynamic Dashboard: the charge screen — a violet ring, the bolt, the level beside it. */
function gauge() {
  return html`
    <span class="tile__charge-ring" role="img" aria-label="Charging, 59 percent, 4 hours 15 minutes to full">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="ring-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#c58bff" />
            <stop offset="1" stop-color="#7b3cf0" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" class="track" />
        <circle cx="50" cy="50" r="40" class="arc" pathLength="100" transform="rotate(-90 50 50)" />
        <path d="M54 26L36 54h13l-3 20 18-28H51z" class="bolt" />
      </svg>
      <span class="tile__charge-ring-read"><b>59%</b><span>4 h 15 min to full</span></span>
    </span>`;
}

function card(w: Work, i: number, speed: string) {
  return html`
    <a class="warp-card" href="#" data-speed="${speed}" data-case="${w.key}">
      <figure class="media media--${w.shape} tile tile--${w.key}">${mark(w)}</figure>
      <div class="meta"><span class="title">${w.title}</span><span class="idx">${pad2(i + 1)}</span></div>
      <div class="meta"><span>${w.disciplines}</span><span>${w.year}</span></div>
    </a>
  `;
}

export function warp() {
  // Three down the left, the rest in the offset column on the right.
  const left = selectedWork.slice(0, 3);
  const right = selectedWork.slice(3);
  return html`
    <section class="section warp-work" id="warp-work" aria-labelledby="work-title">
      <div class="shell grid">
        <div class="section__head">
          <h2 class="section__title" id="work-title">Featured projects</h2>
          <span class="section__index">${pad2(selectedWork.length)} pieces</span>
        </div>
        <div class="section__rule" aria-hidden="true"></div>
      </div>
      <div class="shell warp-grid">
        <div class="warp-col">${left.map((w, i) => card(w, i, '0.06'))}</div>
        <div class="warp-col warp-col--offset">${right.map((w, i) => card(w, i + left.length, '-0.05'))}</div>
      </div>
    </section>
  `;
}
