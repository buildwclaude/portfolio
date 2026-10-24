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

/**
 * Writes the ivy's gradients into an svg, under ids prefixed with `id` so
 * each drawing carries its own (a gradient in a hidden svg doesn't paint
 * anywhere else). Returns the fills to paint with.
 */
export function ivyDefs(svg: SVGSVGElement, id: string) {
  svg.insertAdjacentHTML(
    'afterbegin',
    `<defs>
      <linearGradient id="${id}-vine" x1="0" x2="1"><stop offset="0" stop-color="#4a3a22"/><stop offset=".5" stop-color="#7d6a3f"/><stop offset="1" stop-color="#3b2e1a"/></linearGradient>
      <radialGradient id="${id}-leaf" cx=".25" cy=".35" r=".95"><stop offset="0" stop-color="#9fcf6a"/><stop offset=".45" stop-color="#4f8f2e"/><stop offset="1" stop-color="#22521a"/></radialGradient>
      <radialGradient id="${id}-leaf-now" cx=".25" cy=".35" r=".95"><stop offset="0" stop-color="#7fbf4a"/><stop offset=".5" stop-color="#2f7322"/><stop offset="1" stop-color="#143c10"/></radialGradient>
      <radialGradient id="${id}-young" cx=".3" cy=".35" r=".9"><stop offset="0" stop-color="#d6ec9c"/><stop offset=".6" stop-color="#9ccc5c"/><stop offset="1" stop-color="#5f9a32"/></radialGradient>
    </defs>`,
  );
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
