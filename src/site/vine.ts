import { html, raw } from '../lib/html';

/**
 * The vines doodle, redrawn as a drafted botanical plate for the right of
 * the first screen: a hairline stem climbing the sheet, leaves with their
 * midribs and veins, two flowers with centre marks and construction
 * circles, the doodle's curl as a tendril, a hatched ground line, and a few
 * callouts and a dimension down the side.
 *
 * Plain SVG, computed once at build time. Every stroke carries pathLength=1
 * and a --d delay along the stem, so the stylesheet can ink it in from the
 * ground up; construction lines fade in instead.
 */
const W = 400;
const H = 800;
const TOP = 40;
const BASE = 740;

type P = { x: number; y: number };
const f = (n: number) => n.toFixed(1);

/** The stem, bottom to top: a slow S that leans left as it climbs. */
function stem(t: number): P {
  return {
    x: 238 - 40 * t + 46 * Math.sin(t * Math.PI * 2.4 + 0.4),
    y: BASE - t * (BASE - TOP),
  };
}

function tangent(t: number): P {
  const a = stem(Math.max(0, t - 0.002));
  const b = stem(Math.min(1, t + 0.002));
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
}

const polyline = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');
const rotate = (v: P, a: number): P => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
const add = (a: P, b: P, k = 1): P => ({ x: a.x + b.x * k, y: a.y + b.y * k });

/** An inked stroke that draws itself in, `d` seconds after the start. */
const ink = (d: string, delay: number, cls = '') =>
  `<path class="vine__ink${cls ? ` ${cls}` : ''}" d="${d}" pathLength="1" style="--d:${delay.toFixed(2)}s"/>`;

function leaf(t: number, side: 1 | -1, length: number, i: number) {
  const base = stem(t);
  const tan = tangent(t);
  // Leaves reach up and out, at about fifty degrees off the stem.
  const dir = rotate(tan, side * -0.9);
  const stalk = add(base, dir, 7);
  const tip = add(stalk, dir, length);
  const across = rotate(dir, Math.PI / 2);
  const w = length * 0.36;
  const mid = add(stalk, dir, length * 0.45);
  const c1 = add(mid, across, w);
  const c2 = add(mid, across, -w);
  const delay = 0.35 + t * 1.6;
  const outline = `M${f(stalk.x)} ${f(stalk.y)}Q${f(c1.x)} ${f(c1.y)} ${f(tip.x)} ${f(tip.y)}Q${f(c2.x)} ${f(c2.y)} ${f(stalk.x)} ${f(stalk.y)}`;
  // Veins: three pairs off the midrib, raked toward the tip.
  const veins = [0.28, 0.5, 0.7]
    .flatMap((k) => {
      const on = add(stalk, dir, length * k);
      const reach = w * (1 - Math.abs(k - 0.45) * 1.2) * 0.8;
      return [1, -1].map((s) => {
        const to = add(add(on, dir, reach * 0.7), across, s * reach);
        return `M${f(on.x)} ${f(on.y)}L${f(to.x)} ${f(to.y)}`;
      });
    })
    .join('');
  return (
    ink(`M${f(base.x)} ${f(base.y)}L${f(stalk.x)} ${f(stalk.y)}`, delay) +
      ink(outline, delay + 0.1) +
      ink(`M${f(stalk.x)} ${f(stalk.y)}L${f(tip.x)} ${f(tip.y)}`, delay + 0.25, 'vine__ink--fine') +
      ink(veins, delay + 0.4, 'vine__ink--fine') +
      // A node mark where the leaf leaves the stem.
      (i % 3 === 0 ? `<circle class="vine__node" cx="${f(base.x)}" cy="${f(base.y)}" r="2.2" style="--d:${delay.toFixed(2)}s"/>` : '')
  );
}

function flower(t: number, side: 1 | -1, label: string) {
  const base = stem(t);
  const dir = rotate(tangent(t), side * -0.6);
  const c = add(base, dir, 34);
  const delay = 0.5 + t * 1.6;
  const petals = Array.from({ length: 5 }, (_, k) => {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    const p = { x: c.x + Math.cos(a) * 11, y: c.y + Math.sin(a) * 11 };
    return `M${f(p.x + 8.5)} ${f(p.y)}A8.5 8.5 0 1 0 ${f(p.x - 8.5)} ${f(p.y)}A8.5 8.5 0 1 0 ${f(p.x + 8.5)} ${f(p.y)}`;
  }).join('');
  const r = 30;
  return (
    ink(`M${f(base.x)} ${f(base.y)}L${f(c.x)} ${f(c.y)}`, delay) +
    ink(petals, delay + 0.15) +
    ink(`M${f(c.x + 3.5)} ${f(c.y)}A3.5 3.5 0 1 0 ${f(c.x - 3.5)} ${f(c.y)}A3.5 3.5 0 1 0 ${f(c.x + 3.5)} ${f(c.y)}`, delay + 0.3) +
    // Construction: a dashed bounding circle and a centre mark through it.
    `<circle class="vine__build" cx="${f(c.x)}" cy="${f(c.y)}" r="${r}" style="--d:${(delay + 0.2).toFixed(2)}s"/>` +
    `<path class="vine__build vine__build--centre" d="M${f(c.x - r - 6)} ${f(c.y)}H${f(c.x + r + 6)}M${f(c.x)} ${f(c.y - r - 6)}V${f(c.y + r + 6)}" style="--d:${(delay + 0.2).toFixed(2)}s"/>` +
    callout({ x: c.x + side * r * 0.72, y: c.y - r * 0.72 }, side, label, delay + 0.5)
  );
}

/** A leader from a point out to a short label, drafting-style. */
function callout(at: P, side: 1 | -1, text: string, delay: number) {
  const knee = { x: at.x + side * 26, y: at.y - 22 };
  const end = { x: knee.x + side * 18, y: knee.y };
  return (
    `<g class="vine__note" style="--d:${delay.toFixed(2)}s">` +
    `<circle cx="${f(at.x)}" cy="${f(at.y)}" r="1.8"/>` +
    `<path d="M${f(at.x)} ${f(at.y)}L${f(knee.x)} ${f(knee.y)}H${f(end.x)}"/>` +
    `<text x="${f(end.x + side * 5)}" y="${f(end.y + 3)}" text-anchor="${side > 0 ? 'start' : 'end'}">${text}</text>` +
    `</g>`
  );
}

/** The doodle's loop, as a tendril: a tightening spiral off the stem. */
function tendril(t: number, side: 1 | -1) {
  const base = stem(t);
  const dir = rotate(tangent(t), side * -1.3);
  const pts: P[] = [base];
  const start = add(base, dir, 26);
  const turns = 1.7;
  for (let k = 0; k <= 60; k++) {
    const u = k / 60;
    const a = Math.atan2(dir.y, dir.x) + side * u * turns * Math.PI * 2;
    const rad = 16 * (1 - u * 0.85);
    pts.push({ x: start.x + Math.cos(a) * rad - dir.x * 16, y: start.y + Math.sin(a) * rad - dir.y * 16 });
  }
  return ink(polyline(pts), 0.6 + t * 1.6, 'vine__ink--fine');
}

export function vine() {
  const stemPts = Array.from({ length: 121 }, (_, i) => stem(i / 120));

  const leaves = [0.07, 0.15, 0.24, 0.33, 0.42, 0.5, 0.6, 0.68, 0.77, 0.85]
    .map((t, i) => leaf(t, i % 2 ? 1 : -1, 56 + 18 * Math.sin(i * 1.7) + (1 - t) * 14, i))
    .join('');

  // Ground: a line with section hatching beneath, where the vine is planted.
  const g0 = stem(0);
  const hatch = Array.from({ length: 14 }, (_, k) => {
    const x = g0.x - 70 + k * 10;
    return `M${f(x)} ${BASE + 4}l-9 12`;
  }).join('');

  // A dimension down the right edge: the full height of the plant.
  const dx = 372;
  const dim =
    `<g class="vine__note vine__dim" style="--d:2.4s">` +
    `<path d="M${dx - 8} ${TOP}H${dx + 8}M${dx - 8} ${BASE}H${dx + 8}M${dx} ${TOP}V${BASE}"/>` +
    `<path d="M${dx} ${TOP}l-3.5 9h7zM${dx} ${BASE}l-3.5 -9h7z" class="vine__arrow"/>` +
    `<text x="${dx - 8}" y="${(TOP + BASE) / 2}" transform="rotate(-90 ${dx - 8} ${(TOP + BASE) / 2})" text-anchor="middle">H 700</text>` +
    `</g>`;

  return html`
    <figure class="hero__vine" aria-hidden="true">
      <svg viewBox="0 0 ${String(W)} ${String(H)}" preserveAspectRatio="xMidYMax meet">
        ${raw(ink(polyline(stemPts), 0))}
        ${raw(leaves)}
        ${raw(tendril(0.37, 1))}
        ${raw(tendril(0.72, -1))}
        ${raw(flower(0.55, -1, 'FL. 01'))}
        ${raw(flower(0.97, 1, 'FL. 02'))}
        ${raw(ink(`M${f(g0.x - 80)} ${BASE + 4}H${f(g0.x + 80)}`, 0, 'vine__ink--ground'))}
        <path class="vine__build vine__hatch" d="${hatch}" style="--d:0.2s" />
        ${raw(callout({ x: g0.x + 40, y: BASE + 4 }, 1, 'GRADE', 2.2))}
        ${raw(dim)}
        <text class="vine__note vine__title" x="20" y="${String(BASE + 44)}" style="--d:2.6s">FIG. V — VINE, AFTER THE DOODLE · 1:1</text>
      </svg>
    </figure>
  `;
}
