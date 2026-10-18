/**
 * The temple in the hero (site/temple).
 *
 * Painted in three layers:
 *   1. A plain picture of the temple, seen from above at an angle: a
 *      platform, the dark hall behind the columns, the columns themselves —
 *      pale along the front, glowing orange down the side — the blue band
 *      over them, the pediment, and a gabled roof.
 *   2. That picture remade as fine vertical lines: only every few columns
 *      of pixels are kept, each a little brighter or dimmer than its
 *      neighbours, and from the top of each line a thinning streak runs on
 *      upward, so the roof dissolves into the air. An orange haze is laid
 *      on the ground beside it. Layers 1–2 are drawn once, on resize.
 *   3. Specks rising slowly off the roof and fading as they go, drawn every
 *      frame; the pointer nudges them aside.
 * Under reduced motion the specks hold still.
 */

const BLUE = '#3f4fd8';
const NAVY = '#1f2468';
const ORANGE = '#ff7a3d';

type Vec = [number, number];
type Speck = { x: number; y: number; base: number; rise: number; speed: number; size: number; colour: string; phase: number };

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
const up = (a: Vec, h: number): Vec => [a[0], a[1] - h];

export function initTemple() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-temple-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let base: HTMLCanvasElement | null = null;
  let specks: Speck[] = [];
  const pointer = { x: -1e4, y: -1e4 };
  let frame = 0;
  let visible = true;

  const layout = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const painted = paint(width, height, dpr);
    base = painted.canvas;
    specks = painted.specks;
  };

  const draw = (now: number) => {
    if (!base) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const s of specks) {
      if (!reducedMotion) {
        s.rise += s.speed;
        if (s.rise > 1) s.rise -= 1;
      }
      // Fades as it rises, and twinkles a little.
      const alpha = (1 - s.rise) ** 1.6 * (0.55 + 0.45 * Math.sin(now * 0.002 + s.phase));
      if (alpha < 0.03) continue;
      let x = s.x;
      const y = s.base - s.rise * s.y;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 3600) x += (dx / Math.sqrt(d2 || 1)) * (60 - Math.sqrt(d2)) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.colour;
      ctx.fillRect(x, y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  };

  const loop = (now: number) => {
    draw(now);
    frame = visible ? requestAnimationFrame(loop) : 0;
  };
  const play = () => {
    if (!frame && visible && !reducedMotion) frame = requestAnimationFrame(loop);
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    },
    { passive: true },
  );

  new ResizeObserver(() => {
    layout();
    draw(performance.now());
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting && !document.hidden;
    play();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    play();
  });

  layout();
  draw(performance.now());
  play();
}

/** Paints layers 1 and 2 into a canvas at device resolution, and seeds the specks. */
function paint(width: number, height: number, dpr: number) {
  const rand = seeded(7);
  const W = Math.round(width * dpr);
  const H = Math.round(height * dpr);

  // --- 1. The plain picture -------------------------------------------------
  const picture = document.createElement('canvas');
  picture.width = W;
  picture.height = H;
  const p = picture.getContext('2d', { willReadFrequently: true })!;
  p.scale(dpr, dpr);

  const u = Math.min(width, height * 0.95) * 0.82;
  const angle = (20 * Math.PI) / 180;
  const front: Vec = [-Math.cos(angle) * u * 0.44, -Math.sin(angle) * u * 0.44];
  const side: Vec = [Math.cos(angle) * u * 0.5, -Math.sin(angle) * u * 0.5];
  const columnH = u * 0.36;
  const bandH = u * 0.05;
  const pedimentH = u * 0.07;
  // The corner nearest us, on the ground; the whole temple centred on the
  // stage, with room above it for the streaks.
  const corner: Vec = [width / 2 - (front[0] + side[0]) / 2, height * 0.52 + u * 0.36];

  const quad = (a: Vec, b: Vec, c: Vec, d: Vec) => {
    p.beginPath();
    p.moveTo(...a);
    p.lineTo(...b);
    p.lineTo(...c);
    p.lineTo(...d);
    p.closePath();
  };
  const vertical = (top: number, bottom: number, stops: [number, string][]) => {
    const g = p.createLinearGradient(0, top, 0, bottom);
    for (const [at, colour] of stops) g.addColorStop(at, colour);
    return g;
  };

  // The platform it stands on, barely there.
  const plinth = 0.04;
  quad(
    add(corner, add(mul(front, -plinth), mul(side, -plinth))),
    add(corner, add(mul(front, 1 + plinth), mul(side, -plinth))),
    add(corner, add(mul(front, 1 + plinth), mul(side, 1 + plinth))),
    add(corner, add(mul(front, -plinth), mul(side, 1 + plinth))),
  );
  p.fillStyle = 'rgba(255, 190, 160, 0.22)';
  p.fill();

  /** One face: the dark hall behind, then its columns. */
  const face = (dir: Vec, count: number, hall: [number, string][], column: [number, string][]) => {
    const top = corner[1] - columnH + Math.min(0, dir[1]);
    quad(corner, add(corner, dir), up(add(corner, dir), columnH), up(corner, columnH));
    p.fillStyle = vertical(top, corner[1], hall);
    p.fill();
    for (let i = 0; i < count; i++) {
      const t0 = (i + 0.22) / count;
      const t1 = (i + 0.78) / count;
      const a = add(corner, mul(dir, t0));
      const b = add(corner, mul(dir, t1));
      quad(a, b, up(b, columnH), up(a, columnH));
      p.fillStyle = vertical(a[1] - columnH, a[1], column);
      p.fill();
    }
  };

  // Down the side: a hall going from navy into orange; columns glowing orange.
  face(side, 12,
    [[0, '#141845'], [0.4, '#3a1f4a'], [0.75, 'rgba(200, 80, 40, 0.75)'], [1, 'rgba(255, 140, 90, 0)']],
    [[0, BLUE], [0.22, '#7a55c8'], [0.45, ORANGE], [0.78, 'rgba(255, 130, 70, 0.6)'], [1, 'rgba(255, 160, 110, 0)']],
  );
  // Along the front: a dim hall; pale lavender columns warming toward the foot.
  face(front, 8,
    [[0, '#141845'], [0.55, 'rgba(45, 45, 120, 0.8)'], [1, 'rgba(150, 130, 200, 0)']],
    [[0, BLUE], [0.28, '#d4d6ff'], [0.7, 'rgba(255, 180, 150, 0.8)'], [1, 'rgba(255, 210, 190, 0)']],
  );

  // The band over the columns, on both faces.
  const bandBottom = (v: Vec) => up(v, columnH);
  const bandTop = (v: Vec) => up(v, columnH + bandH);
  for (const dir of [front, side]) {
    quad(bandBottom(corner), bandBottom(add(corner, dir)), bandTop(add(corner, dir)), bandTop(corner));
    p.fillStyle = '#232c8c';
    p.fill();
  }

  // The roof: gabled along the side, a pediment on the front.
  const eave = columnH + bandH;
  const frontLeft = up(add(corner, front), eave);
  const frontRight = up(corner, eave);
  const apex = up(add(corner, mul(front, 0.5)), eave + pedimentH);
  const backLeft = add(frontLeft, side);
  const backRight = add(frontRight, side);
  const backApex = add(apex, side);
  quad(frontLeft, apex, backApex, backLeft);
  p.fillStyle = vertical(backLeft[1], frontLeft[1], [[0, '#2c37a8'], [1, '#1d2478']]);
  p.fill();
  quad(apex, frontRight, backRight, backApex);
  p.fillStyle = vertical(backApex[1], frontRight[1], [[0, '#232a7a'], [1, '#15194d']]);
  p.fill();
  // Tiles on the roof: a speckle of lighter blue and the odd warm fleck.
  for (let i = 0; i < 900; i++) {
    const a = rand();
    const b = rand();
    const onLeft = rand() < 0.5;
    const at = onLeft
      ? add(add(frontLeft, mul([apex[0] - frontLeft[0], apex[1] - frontLeft[1]], a)), mul(side, b))
      : add(add(apex, mul([frontRight[0] - apex[0], frontRight[1] - apex[1]], a)), mul(side, b));
    p.fillStyle = rand() < 0.08 ? 'rgba(255, 150, 110, 0.7)' : `rgba(${onLeft ? '120, 135, 255' : '80, 95, 220'}, ${0.35 + rand() * 0.4})`;
    p.fillRect(at[0], at[1], 1.1, 1.1);
  }
  p.beginPath();
  p.moveTo(...frontLeft);
  p.lineTo(...apex);
  p.lineTo(...frontRight);
  p.closePath();
  p.fillStyle = '#1f2680';
  p.fill();
  // A frieze of pale flecks in the pediment and along the band.
  for (let i = 0; i < 90; i++) {
    const t = rand();
    const lift = rand() * (1 - Math.abs(2 * t - 1)) * pedimentH * 0.8;
    const at = up(add(corner, mul(front, t)), eave + lift);
    p.fillStyle = `rgba(200, 205, 255, ${0.3 + rand() * 0.4})`;
    p.fillRect(at[0], at[1], 1.2, 1.2);
  }

  // --- 2. Remade as vertical lines ------------------------------------------
  const source = p.getImageData(0, 0, W, H);
  const out = new ImageData(W, H);
  const src = source.data;
  const dst = out.data;
  const step = Math.max(2, Math.round(2.2 * dpr));
  const tops: number[] = new Array(W).fill(-1);

  for (let x = 0; x < W; x++) {
    const lane = x % step;
    if (lane > 1) continue;
    // Each line a little brighter or dimmer than its neighbours.
    const gain = (lane === 0 ? 1 : 0.55) * (0.65 + rand() * 0.35);
    let top = -1;
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      const a = src[i + 3]!;
      if (a < 8) continue;
      if (top < 0) top = y;
      dst[i] = src[i]!;
      dst[i + 1] = src[i + 1]!;
      dst[i + 2] = src[i + 2]!;
      dst[i + 3] = a * gain;
    }
    if (lane !== 0 || top < 0) continue;
    tops[x] = top;

    // A streak running on upward from the top, thinning as it goes.
    const length = rand() ** 1.8 * u * 0.38 * dpr;
    const warm = rand() < 0.12;
    for (let k = 1; k < length; k++) {
      const y = top - k;
      if (y < 0) break;
      // Broken more the higher it goes, so it frays into points.
      if (rand() < 0.3 + 0.6 * (k / length)) continue;
      const fade = (1 - k / length) ** 1.8;
      const i = (y * W + x) * 4;
      dst[i] = warm ? 255 : 70;
      dst[i + 1] = warm ? 130 : 85;
      dst[i + 2] = warm ? 80 : 220;
      dst[i + 3] = 220 * fade * gain;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;

  // The haze on the ground, under the lines: orange beside the side, a
  // little lavender spreading out from it.
  c.save();
  c.scale(dpr, dpr);
  c.filter = `blur(${Math.round(u * 0.05)}px)`;
  const glow = add(corner, mul(side, 0.55));
  c.fillStyle = 'rgba(255, 120, 70, 0.32)';
  c.beginPath();
  c.ellipse(glow[0], glow[1] - u * 0.02, u * 0.24, u * 0.07, -0.42, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(170, 160, 255, 0.18)';
  c.beginPath();
  c.ellipse(glow[0] + u * 0.08, glow[1] + u * 0.03, u * 0.3, u * 0.08, -0.35, 0, Math.PI * 2);
  c.fill();
  c.restore();

  const lines = document.createElement('canvas');
  lines.width = W;
  lines.height = H;
  lines.getContext('2d')!.putImageData(out, 0, 0);
  c.drawImage(lines, 0, 0);

  // --- 3. The specks, seeded over the roof ------------------------------------
  const specks: Speck[] = [];
  const columns = tops.map((t, x) => [x, t] as const).filter(([, t]) => t >= 0);
  const palette = [BLUE, BLUE, BLUE, '#6b74f0', '#6b74f0', ORANGE, '#ffa070', '#c9c6ff'];
  for (let i = 0; i < 1400 && columns.length; i++) {
    const [x, t] = columns[Math.floor(rand() * columns.length)]!;
    specks.push({
      x: x / dpr + (rand() - 0.5) * 2,
      base: t / dpr,
      y: u * (0.15 + rand() * 0.45),
      rise: rand(),
      speed: 0.0004 + rand() * 0.0012,
      size: rand() < 0.2 ? 1.6 : 1.1,
      colour: palette[Math.floor(rand() * palette.length)]!,
      phase: rand() * Math.PI * 2,
    });
  }

  return { canvas, specks };
}

/** A small seeded random source, so the drawing is the same on every visit. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
