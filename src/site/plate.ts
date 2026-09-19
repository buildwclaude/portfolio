import { html, raw } from '../lib/html';

/**
 * A drawn plate, used wherever a project has no image yet.
 *
 * It is deliberately abstract — geometry from the same family as the page
 * grid, not a pretend screenshot. Replace it by setting `image` on the
 * project in `content/site.ts`.
 *
 * The composition is deterministic: the same seed always draws the same
 * plate, so the page does not shuffle between builds.
 */

const W = 600;
const H = 420;

function prng(seed: number) {
  let t = seed * 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function plate(seed: number) {
  const rand = prng(seed + 1);

  const cx = W * (0.32 + rand() * 0.34);
  const cy = H * (0.40 + rand() * 0.08);
  const r = H * (0.19 + rand() * 0.05);
  const horizon = H * (0.58 + rand() * 0.12);
  const bias = 1.2 + rand() * 1.2; // how tightly the contours bunch
  const flip = rand() > 0.5;

  const count = 22;
  const contours: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const eased = flip ? Math.pow(t, bias) : 1 - Math.pow(1 - t, bias);
    const y = cy - r + eased * r * 2;
    contours.push(`M${cx - r} ${y.toFixed(1)}H${cx + r}`);
  }

  const ticks: string[] = [];
  const tickCount = 12;
  for (let i = 1; i < tickCount; i++) {
    const x = (W / tickCount) * i;
    ticks.push(`M${x.toFixed(1)} ${horizon.toFixed(1)}v7`);
  }

  const id = `plate-${seed}`;

  return html`
    <svg
      class="plate"
      viewBox="0 0 ${W} ${H}"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      focusable="false"
    >
      <defs>
        <clipPath id="${id}">
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" />
        </clipPath>
      </defs>
      <rect width="${W}" height="${H}" class="plate__ground" />
      <g clip-path="url(#${id})" class="plate__contours">
        <path d="${raw(contours.join(''))}" />
      </g>
      <circle
        class="plate__circle"
        cx="${cx.toFixed(1)}"
        cy="${cy.toFixed(1)}"
        r="${r.toFixed(1)}"
      />
      <path class="plate__horizon" d="M0 ${horizon.toFixed(1)}H${W}" />
      <path class="plate__ticks" d="${raw(ticks.join(''))}" />
    </svg>
  `;
}
