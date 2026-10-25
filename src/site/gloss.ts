import { html, raw } from '../lib/html';

/**
 * Glossy jelly shapes to go with the star (public/shapes/star.webp): a
 * heart, a ring, a pill and a flower, drawn as SVG — a gradient through
 * three colours, shaded toward the edges for volume, a soft white shine at
 * the top left and a pale rim. Each comes in one of the page's colours; the
 * star, being a picture, is tinted to match. components/gloss.css floats
 * them.
 */
const SHAPES = {
  heart: {
    d: 'M50 88C20 66 6 50 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 18-14 34-44 56z',
    shine: [30, 26, 16, 9],
    evenodd: false,
  },
  ring: {
    d: 'M50 8a42 42 0 1 1 0 84 42 42 0 1 1 0-84zm0 24a18 18 0 1 0 0 36 18 18 0 1 0 0-36z',
    shine: [30, 24, 15, 8],
    evenodd: true,
  },
  pill: {
    d: 'M28 30h44a20 20 0 0 1 0 40H28a20 20 0 0 1 0-40z',
    shine: [36, 39, 22, 5],
    evenodd: false,
  },
  flower: {
    d: 'M50 8c12 0 18 12 18 22 10 0 22 6 22 20S78 70 68 70c0 10-6 22-18 22S32 80 32 70c-10 0-22-6-22-20s12-20 22-20c0-10 6-22 18-22z',
    shine: [36, 26, 13, 8],
    evenodd: false,
  },
} as const;

/** The colours, each a gradient of three and a shade for the edges. */
const PALETTES = {
  pink: { stops: ['#ff9fae', '#ff8fc6', '#c7a5f6'], shade: '#7a2d6e' },
  butter: { stops: ['#fff3ad', '#ffd65c', '#ffab5c'], shade: '#8a4a00' },
  lime: { stops: ['#efffb0', '#b8f05a', '#5fd49c'], shade: '#1f5a1a' },
  sky: { stops: ['#d4ecff', '#8ec5ff', '#8a8cff'], shade: '#1e2a8a' },
  lilac: { stops: ['#f2e1ff', '#c9a5ff', '#8f7bff'], shade: '#3d2580' },
  peach: { stops: ['#ffe1cc', '#ffa98a', '#ff7fa6'], shade: '#7a2d1e' },
} as const;

export type GlossShape = keyof typeof SHAPES | 'star';
export type GlossColor = keyof typeof PALETTES;

let n = 0;

function drawn(shape: keyof typeof SHAPES, color: GlossColor, extra: string, style: string) {
  const { d, shine, evenodd } = SHAPES[shape];
  const { stops, shade } = PALETTES[color];
  const id = `gl${(n += 1)}`;
  const rule = evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : '';
  return raw(`
    <svg class="gloss gloss--${shape} gloss--${color} ${extra}" viewBox="0 0 100 100" aria-hidden="true" style="${style}">
      <defs>
        <linearGradient id="${id}-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${stops[0]}" />
          <stop offset="0.45" stop-color="${stops[1]}" />
          <stop offset="1" stop-color="${stops[2]}" />
        </linearGradient>
        <radialGradient id="${id}-shade" cx="0.42" cy="0.36" r="0.7">
          <stop offset="0.55" stop-color="${shade}" stop-opacity="0" />
          <stop offset="1" stop-color="${shade}" stop-opacity="0.22" />
        </radialGradient>
        <clipPath id="${id}-clip"><path d="${d}"${rule} /></clipPath>
        <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6" /></filter>
      </defs>
      <path d="${d}" fill="url(#${id}-fill)"${rule} />
      <path d="${d}" fill="url(#${id}-shade)"${rule} />
      <g clip-path="url(#${id}-clip)">
        <ellipse cx="${shine[0]}" cy="${shine[1]}" rx="${shine[2]}" ry="${shine[3]}" fill="#fff" opacity="0.85" filter="url(#${id}-soft)" transform="rotate(-24 ${shine[0]} ${shine[1]})" />
        <path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="5" filter="url(#${id}-soft)" transform="translate(3 3)" />
      </g>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1.6"${rule} />
    </svg>
  `);
}

/** One shape in one colour. `style` places it (see scatter). */
export function gloss(shape: GlossShape, color: GlossColor = 'pink', extra = '', style = '') {
  if (shape === 'star') {
    return html`<img class="gloss gloss--star gloss--${color} ${extra}" src="/shapes/star.webp" alt="" width="320" height="318" loading="lazy" decoding="async" aria-hidden="true" style="${style}" />`;
  }
  return drawn(shape, color, extra, style);
}

/**
 * A handful of shapes strewn over a section: where each sits (x, y, as any
 * CSS length), how big it is, how it's turned, and whether it stays on a
 * phone. Hand-picked to look random, so no two sections fall alike.
 */
export type Strewn = {
  shape: GlossShape;
  color: GlossColor;
  x: string;
  y: string;
  size: number;
  turn: number;
  phone?: boolean;
};

export function scatter(list: Strewn[]) {
  return html`${list.map((g, i) =>
    gloss(
      g.shape,
      g.color,
      `gloss--strewn${g.phone ? '' : ' gloss--wide-only'}`,
      `--x:${g.x}; --y:${g.y}; --s:${g.size}px; --r:${g.turn}deg; animation-delay:${-(i * 1.7) % 9}s`,
    ),
  )}`;
}
