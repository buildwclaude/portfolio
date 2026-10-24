/**
 * The ivy's parts, as the climbing rail (lib/rail) draws them: its colours,
 * a five-lobed leaf and a tendril. Leaves and tendrils start folded;
 * `.is-grown` unfurls them (ivy.css).
 */

const NS = 'http://www.w3.org/2000/svg';

export function el<K extends keyof SVGElementTagNameMap>(parent: Element, tag: K, attrs: Record<string, string | number> = {}) {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, String(attrs[k]));
  parent.appendChild(node);
  return node;
}

type Ramp = [string, string, string];

/**
 * The ivy's colour themes, picked by name (the rail's data-ivy-theme). Each
 * gives the vine's shading across, the three leaf shadings (highlight, middle,
 * edge) and the fine lines drawn over them.
 */
export const IVY_THEMES = {
  /** Soft, slightly yellow greens and a weathered olive stem, from the overgrown walker in the hero. */
  default: {
    vine: ['#6f6a4e', '#a39d7a', '#5f5a40'],
    leaf: ['#dbe7a9', '#99b46d', '#5f8650'],
    leafNow: ['#aec875', '#6f9a4a', '#3f6a34'],
    young: ['#f0f4d6', '#c4d98f', '#99ae55'],
    lines: { stalk: '#7a7256', blade: '#4a6a3a', vein: '#f6f4e2', tendril: '#a39d7a' },
  },
  /** The page's ink: near-black leaves shaded in greys, like a charcoal drawing; the current one darkest. */
  black: {
    vine: ['#2a2a28', '#5e5e5a', '#1f1f1d'],
    leaf: ['#9a9a95', '#4a4a47', '#232321'],
    leafNow: ['#5c5c58', '#1f1f1e', '#0a0a0a'],
    young: ['#e4e3de', '#b2b1ab', '#7d7c77'],
    lines: { stalk: '#3a3a38', blade: '#000000', vein: '#f2f1ec', tendril: '#6a6a66' },
  },
} satisfies Record<string, { vine: Ramp; leaf: Ramp; leafNow: Ramp; young: Ramp; lines: Record<string, string> }>;

export type IvyTheme = keyof typeof IVY_THEMES;

/**
 * Writes the ivy's gradients for a theme into an svg, under ids prefixed
 * with `id` so each drawing carries its own (a gradient in a hidden svg
 * doesn't paint anywhere else), and sets the theme's line colours on it for
 * ivy.css. Returns the fills to paint with.
 */
export function ivyDefs(svg: SVGSVGElement, id: string, theme: IvyTheme = 'default') {
  const t = IVY_THEMES[theme] ?? IVY_THEMES.default;
  const stops = (ramp: Ramp, at: string[]) => ramp.map((c, i) => `<stop offset="${at[i]}" stop-color="${c}"/>`).join('');
  svg.insertAdjacentHTML(
    'afterbegin',
    `<defs>
      <linearGradient id="${id}-vine" x1="0" x2="1">${stops(t.vine, ['0', '.5', '1'])}</linearGradient>
      <radialGradient id="${id}-leaf" cx=".25" cy=".35" r=".95">${stops(t.leaf, ['0', '.45', '1'])}</radialGradient>
      <radialGradient id="${id}-leaf-now" cx=".25" cy=".35" r=".95">${stops(t.leafNow, ['0', '.5', '1'])}</radialGradient>
      <radialGradient id="${id}-young" cx=".3" cy=".35" r=".9">${stops(t.young, ['0', '.6', '1'])}</radialGradient>
    </defs>`,
  );
  for (const [part, colour] of Object.entries(t.lines)) svg.style.setProperty(`--ivy-${part}`, colour);
  return {
    vine: `url(#${id}-vine)`,
    leaf: `url(#${id}-leaf)`,
    leafNow: `url(#${id}-leaf-now)`,
    young: `url(#${id}-young)`,
  };
}

/** A five-lobed ivy leaf on a short stalk at (x, y), pointing along `rot`, with pale veins. */
export function ivyLeaf(parent: Element, x: number, y: number, rot: number, size: number, fill: string) {
  const g = el(parent, 'g', { transform: `translate(${x} ${y}) rotate(${rot})` });
  const leaf = el(g, 'g', { class: 'ivy__leaf' });
  const s = size / 10;
  const p = (a: number, b: number) => `${a * s} ${b * s}`;
  const base = `${3 * s + 3} 0`;
  el(leaf, 'path', { d: 'M0 0 L3 0', class: 'ivy__stalk' });
  el(leaf, 'path', {
    d: `M${base} C4 ${-4 * s} ${p(7, -9)} ${p(10, -8)} C${p(11, -13)} ${p(17, -14)} ${p(18, -9)} C${p(23, -10)} ${p(27, -5)} ${p(23, 0)} C${p(27, 5)} ${p(23, 10)} ${p(18, 9)} C${p(17, 14)} ${p(11, 13)} ${p(10, 8)} C${p(7, 9)} 4 ${4 * s} ${base}Z`,
    fill,
    class: 'ivy__blade',
  });
  for (const [vx, vy] of [[23, 0], [18, -9], [18, 9], [10, -8], [10, 8]] as const) {
    el(leaf, 'path', { d: `M${base} L${p(vx, vy)}`, class: 'ivy__vein' });
  }
  return leaf;
}

/** A small curling tendril at (x, y), curling toward `dir` (±1) and turned by `rot`. */
export function tendril(parent: Element, x: number, y: number, dir: number, rot = 0) {
  const g = el(parent, 'g', { transform: `translate(${x} ${y}) rotate(${rot})` });
  return el(g, 'path', {
    d: `M0 0 c${6 * dir} -2 ${9 * dir} 3 ${6 * dir} 6 c${-2 * dir} 2 ${-4 * dir} 0 ${-3 * dir} -2`,
    class: 'ivy__tendril',
  });
}
