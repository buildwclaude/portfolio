import { html } from '../lib/html';

/**
 * The selected work, in order. The hero's featured stage and the grid below
 * it both read this list, so they always show the same pieces. `key` names
 * the case study `lib/warp-detail.ts` opens.
 */
export const selectedWork = [
  { key: 'yatri-hub', title: 'Yatri Hub', disciplines: 'Product Design · UX Research', year: '2025', cover: '/work/yatrihub/cover.webp', shape: 'tall', fallback: 'field', blurb: 'A companion app for electric-bike riders that cut trip-planning uncertainty by 67%.' },
  { key: 'ar-hud', title: 'AR Head-Up Display', disciplines: 'AR · Research', year: '2026', cover: '/work/ar-hud/3abae169-38f525.webp', shape: 'wide', fallback: 'moire', blurb: 'Augmented-reality interfaces for astronaut spacesuits, with Moon-to-Mars missions in mind.' },
  { key: 'yatri-energy', title: 'Yatri Energy', disciplines: 'Product Design · UX', year: '2023', cover: '/work/yatri-energy/cover.webp', shape: 'tall', fallback: 'rings', blurb: 'Finding, paying for and using EV charging in Nepal, with the friction taken out.' },
  { key: 'eduquest', title: 'EduQuest', disciplines: 'UX Research · Product Design', year: '2024', cover: '/work/eduquest/59d0b409-7a3941.webp', shape: 'wide', fallback: 'strata', blurb: 'A home for structured mentorship, replacing scattered social-media threads.' },
  { key: 'dashboard', title: 'Dynamic Dashboard', disciplines: 'UX Research · Product Design', year: '2024', cover: '/work/dashboard/f5f971ba-fda800.webp', shape: 'tall', fallback: 'dots', blurb: 'An interactive motorcycle dashboard riders actually engage with.' },
] as const;

export type Work = (typeof selectedWork)[number];

export const pad2 = (n: number) => String(n).padStart(2, '0');

function card(w: Work, i: number, speed: string) {
  return html`
    <a class="warp-card" href="#" data-speed="${speed}" data-case="${w.key}">
      <figure class="media media--${w.shape}" data-gl>
        <img src="${w.cover}" alt="${w.title}" data-fallback="${w.fallback}" />
      </figure>
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
    <section class="warp-work" id="warp-work">
      <div class="shell sectionbar"><b>Selected work</b><span>${pad2(selectedWork.length)} pieces</span></div>
      <div class="shell warp-grid">
        <div class="warp-col">${left.map((w, i) => card(w, i, '0.06'))}</div>
        <div class="warp-col warp-col--offset">${right.map((w, i) => card(w, i + left.length, '-0.05'))}</div>
      </div>
    </section>
  `;
}
