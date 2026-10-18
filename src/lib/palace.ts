/**
 * The palace in the hero (site/palace): the picture in /hero/palace.jpg,
 * shown as it is, with light rising off it.
 *
 *   1. The picture is fitted to the stage and its pale ground keyed out —
 *      whatever is light and colourless goes; the navy stone and the lit
 *      windows, which are warm, stay, untouched.
 *   2. On the page above it stands a volume of particles, the building's
 *      roofline carried upward: packed and blue just over the roofs, faint
 *      vertical lines through it, thinning with height into scattered blue,
 *      orange and pink points. The points stream slowly upward: two sheets
 *      of grain scroll through the volume's fixed shape each frame. A warm haze is laid on the ground under it,
 *      and a light grain over the building and through the haze, so the
 *      whole picture is stippled. Layers 1–2 are drawn once, on resize.
 *   3. The lit windows glow, with a slow pulse, and each carries its own
 *      orange volume, built like the blue one's edge: a column of grain
 *      dense at the light and thinning upward, faint lines through it, the
 *      grain streaming up. Loose orange grain rises from them too.
 *   4. Moving grain: single device pixels, snapped to the grid like the
 *      still layers, leave from all over the building — roofs,
 *      dome, courtyards, walls — and drift up past the roofline, fading in
 *      as they leave and out as they climb. Drawn every frame; the pointer
 *      nudges them aside.
 * Under reduced motion the specks hold still.
 */

const SRC = 'hero/palace.jpg';
// The blue volume over the roofline (its grain and faint lines). Off for now, to try the picture without it.
const BLUE_VOLUME = true;

type Speck = { x: number; y: number; base: number; rise: number; speed: number; size: number; colour: string; phase: number; sway: number; swayRate: number };
// A lane of a grain sheet: scrolled at its own pace, surging and swaying.
type Lane = { sheet: HTMLCanvasElement; pace: number; drift: number; swing: number; period: number; phase: number };

export function initPalace() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-palace-canvas]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const image = new Image();
  image.src = SRC;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let base: HTMLCanvasElement | null = null;
  let specks: Speck[] = [];
  let volume: { coolSheet: Lane[]; warmSheet: Lane[]; coolMask: HTMLCanvasElement; warmMask: HTMLCanvasElement; glow: HTMLCanvasElement; amberSheet: Lane[]; lightMask: HTMLCanvasElement } | null = null;
  // Where the grain sheets are mixed with their masks, each frame.
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d')!;
  const pointer = { x: -1e4, y: -1e4 };
  let frame = 0;
  let visible = true;

  const layout = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height || !image.naturalWidth) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const painted = paint(image, width, height, dpr);
    base = painted.canvas;
    specks = painted.specks;
    volume = painted;
    layer.width = canvas.width;
    layer.height = canvas.height;
    canvas.classList.add('is-drawn');
  };

  const draw = (now: number) => {
    if (!base) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);

    // The volume: each grain sheet scrolled upward — the warm one a little
    // faster — in whole device pixels so the points stay crisp, wrapped,
    // and cut to its mask.
    // The windows' glow, breathing slowly.
    if (volume) {
      const pulse = reducedMotion ? 0.6 : 0.5 + 0.18 * Math.sin(now * 0.0012);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = pulse * 0.55;
      ctx.drawImage(volume.glow, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    if (volume) {
      const t = reducedMotion ? 0 : now / 1000;
      const sheets: [Lane[], HTMLCanvasElement, number][] = [
        ...(BLUE_VOLUME ? [[volume.coolSheet, volume.coolMask, 9] as [Lane[], HTMLCanvasElement, number]] : []),
        [volume.warmSheet, volume.warmMask, 14],
        // The lights' own volumes, rising a touch faster.
        [volume.amberSheet, volume.lightMask, 18],
      ];
      for (const [lanes, shape, speed] of sheets) {
        // Each lane at its own pace, which itself surges and slackens, and
        // swaying sideways a little — so the points pass one another rather
        // than moving as one block. Whole device pixels, to stay crisp.
        lctx.clearRect(0, 0, layer.width, layer.height);
        for (const lane of lanes) {
          const h = lane.sheet.height;
          const travel = t * speed * lane.pace * dpr + lane.drift * dpr * Math.sin(t / lane.period + lane.phase);
          const offset = Math.round(((travel % h) + h) % h);
          const shift = Math.round(lane.swing * dpr * Math.sin(t / (lane.period * 0.7) + lane.phase * 1.7));
          for (let y = -offset; y < layer.height; y += h) lctx.drawImage(lane.sheet, shift, y);
        }
        lctx.globalCompositeOperation = 'destination-in';
        lctx.drawImage(shape, 0, 0);
        lctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(layer, 0, 0);
      }

    }

    for (const s of specks) {
      if (!reducedMotion) {
        s.rise += s.speed;
        if (s.rise > 1) s.rise -= 1;
      }
      // Fades in where it leaves the stone, out as it climbs, and twinkles.
      const life = s.rise < 0.12 ? s.rise / 0.12 : ((1 - s.rise) / 0.88) ** 1.4;
      const alpha = life * (0.6 + 0.4 * Math.sin(now * 0.002 + s.phase));
      if (alpha < 0.03) continue;
      // Each wanders a little from side to side as it climbs, more the higher it gets.
      let x = s.x + s.sway * s.rise * Math.sin(s.rise * s.swayRate + s.phase);
      const y = s.base - s.rise * s.y;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 3600) x += (dx / Math.sqrt(d2 || 1)) * (60 - Math.sqrt(d2)) * 0.4;
      // Stipple, not sprites: one whole device pixel, snapped to the grid, so
      // it reads as the same grain as the still layers rather than a box.
      ctx.globalAlpha = alpha * s.size;
      ctx.fillStyle = s.colour;
      ctx.fillRect(Math.round(x * dpr), Math.round(y * dpr), 1, 1);
    }
    ctx.globalAlpha = 1;
  };

  const loop = (now: number) => {
    draw(now);
    frame = visible ? requestAnimationFrame(loop) : 0;
  };
  const play = () => {
    if (!frame && visible && !reducedMotion && base) frame = requestAnimationFrame(loop);
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

  image
    .decode()
    .then(() => {
      layout();
      draw(performance.now());
      play();

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
    })
    .catch(() => undefined);
}

/** Paints layers 1 and 2 into a canvas at device resolution, and seeds the specks. */
function paint(image: HTMLImageElement, width: number, height: number, dpr: number) {
  const rand = seeded(7);
  const W = Math.round(width * dpr);
  const H = Math.round(height * dpr);

  // --- 1. The picture, fitted low in the stage, with room above for the
  // particles to stand on it.
  const picture = document.createElement('canvas');
  picture.width = W;
  picture.height = H;
  const p = picture.getContext('2d', { willReadFrequently: true })!;
  const ratio = image.naturalWidth / image.naturalHeight;
  const drawW = Math.min(W * 0.88, H * 0.62 * ratio);
  const drawH = drawW / ratio;
  const left = (W - drawW) / 2;
  const top = H - drawH - H * 0.06;
  p.drawImage(image, left, top, drawW, drawH);
  const src = p.getImageData(0, 0, W, H).data;

  // --- 2. Keyed, untouched -----------------------------------------------------
  const out = new ImageData(W, H);
  const dst = out.data;
  const step = Math.max(2, Math.round(2.2 * dpr));
  const seeds: [number, number][] = [];
  // The lit windows: warm, bright pixels — where the orange grain and the
  // glow come from.
  const lights: [number, number][] = [];
  const glowImg = new ImageData(W, H);
  const gd = glowImg.data;
  const tops: number[] = new Array(W).fill(-1);
  const footEnd = top + drawH;

  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      if (src[i + 3]! < 8) continue;
      const r = src[i]! / 255;
      const g = src[i + 1]! / 255;
      const b = src[i + 2]! / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = max - min;
      // The ground is light and nearly colourless; the stone is dark and the
      // windows are warm. Keep what is either dark or strongly coloured —
      // untouched, so the building reads exactly as in the picture.
      const keep = Math.max(clamp((0.7 - lum) / 0.12), clamp((sat - 0.26) / 0.14));
      if (keep < 0.05) continue;
      // Every few pixels of solid building, a place for a speck to leave from.
      if (keep > 0.6 && x % step === 0 && y % step === 0) seeds.push([x, y]);
      if (r > 0.55 && r > g * 1.15 && g > b * 1.1 && sat > 0.3) {
        gd[i] = 255;
        gd[i + 1] = Math.round(120 + 60 * g);
        gd[i + 2] = 50;
        gd[i + 3] = 255;
        if (x % 2 === 0 && y % 2 === 0) lights.push([x, y]);
      }
      if (keep > 0.6 && tops[x]! < 0) tops[x] = y;
      dst[i] = src[i]!;
      dst[i + 1] = src[i + 1]!;
      dst[i + 2] = src[i + 2]!;
      dst[i + 3] = 255 * keep;
    }
  }

  // --- 2b. The particle volume standing on the roofs --------------------------
  // Above each column of the roofline: a faint still line, and the shape of
  // the moving grain — packed and blue just over the roof, thinning upward,
  // orange and pink partway up. On the page only, never over the building.
  const cloud = new ImageData(W, H);
  const cd = cloud.data;
  const mask = new ImageData(W, H);
  const md = mask.data;
  const warmShape = new ImageData(W, H);
  const wd = warmShape.data;
  const cool: [number, number, number][] = [[52, 64, 196], [63, 79, 216], [84, 96, 228], [40, 46, 150], [110, 118, 236]];
  const warm: [number, number, number][] = [[255, 128, 80], [255, 160, 120], [250, 120, 150], [255, 190, 150]];
  const put = (x: number, y: number, [r, g, b]: [number, number, number], a: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    // Over whatever is already there, so overlapping points build up.
    const prev = cd[i + 3]! / 255;
    const next = a + prev * (1 - a);
    if (next <= 0) return;
    cd[i] = (r * a + cd[i]! * prev * (1 - a)) / next;
    cd[i + 1] = (g * a + cd[i + 1]! * prev * (1 - a)) / next;
    cd[i + 2] = (b * a + cd[i + 2]! * prev * (1 - a)) / next;
    cd[i + 3] = next * 255;
  };
  const lane = Math.max(2, Math.round(1.6 * dpr));
  for (let x = 0; x < W; x++) {
    const roof = tops[x]!;
    if (roof < 0) continue;
    // Never as far as the top of the stage, so the volume frays out
    // rather than being cut off; each column a different height.
    const reachUp = Math.min(roof - H * 0.03, drawH * (0.55 + rand() * 0.3));
    const isLine = x % lane === 0;
    const lineGain = 0.5 + rand() * 0.5;
    for (let k = 1; k < reachUp; k++) {
      const y = roof - k;
      if (y < 0) break;
      // Never over the building itself.
      if (dst[(y * W + x) * 4 + 3]! > 40) continue;
      const t = k / reachUp;
      // A faint vertical line through the volume, on every few columns.
      if (BLUE_VOLUME && isLine) put(x, y, cool[1]!, 0.22 * (1 - t) ** 1.3 * lineGain);
      // How strong the moving grain is here — the volume's shape: deep
      // blue nearly solid at the roof, thinning fast with height; orange and
      // pink strongest partway up.
      const m = (y * W + x) * 4 + 3;
      md[m] = 255 * Math.min(1, 1.15 * (1 - t) ** 2.2 + 0.02);
      wd[m] = 255 * 0.75 * t ** 0.8 * (1 - t) ** 0.7;
    }
  }

  // The grain that streams through the volume: two tall sheets, one blue
  // and one warm, scrolled upward each frame and seen through the masks
  // above. Each point is one device pixel; most are faint, so where the
  // mask is weak only a few still show and the grain looks sparse there.
  const sheet = (cover: number, colours: [number, number, number][], deep?: [number, number, number], tall = H) => {
    const img = new ImageData(W, tall);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (rand() > cover) continue;
      const [r, g, b] = deep && rand() < 0.5 ? deep : colours[Math.floor(rand() * colours.length)]!;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255 * (0.45 + 0.55 * rand() ** 1.2);
    }
    return toCanvas(img);
  };
  // The sheet's grain dealt out over a few lanes, each with its own pace,
  // surge and sway, so the stream isn't one rigid block.
  const lanes = (cover: number, colours: [number, number, number][], deep?: [number, number, number]): Lane[] => {
    const paces = [0.55, 0.85, 1.15, 1.5];
    return paces.map((pace) => ({
      // A short tile, repeated down the stage, to keep the memory down.
      sheet: sheet(cover / paces.length, colours, deep, Math.ceil(H / 3)),
      pace: pace * (0.9 + rand() * 0.2),
      drift: 4 + rand() * 10,
      swing: 1 + rand() * 2.5,
      period: 1.8 + rand() * 3.5,
      phase: rand() * Math.PI * 2,
    }));
  };
  const coolSheet = lanes(0.78, cool, cool[3]);
  const warmSheet = lanes(0.3, warm);
  const coolMask = toCanvas(mask);
  const warmMask = toCanvas(warmShape);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;

  // A warm haze on the ground, under the lines, where the building fades.
  c.save();
  c.filter = `blur(${Math.round(drawW * 0.05)}px)`;
  c.fillStyle = 'rgba(255, 150, 80, 0.28)';
  c.beginPath();
  c.ellipse(W / 2 + drawW * 0.08, footEnd - drawH * 0.12, drawW * 0.38, drawH * 0.1, -0.12, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(150, 150, 255, 0.16)';
  c.beginPath();
  c.ellipse(W / 2 - drawW * 0.1, footEnd - drawH * 0.06, drawW * 0.45, drawH * 0.09, 0.1, 0, Math.PI * 2);
  c.fill();
  c.restore();

  const lines = document.createElement('canvas');
  lines.width = W;
  lines.height = H;
  lines.getContext('2d')!.putImageData(cloud, 0, 0);
  c.drawImage(lines, 0, 0);
  lines.getContext('2d')!.putImageData(out, 0, 0);
  c.drawImage(lines, 0, 0);

  // --- 2c. Grain over the building and on the ground ------------------------
  // A light dusting of pale points across the stone — the building still
  // reads clearly, it only takes the same grain as the rest — and warm and
  // lavender points scattered through the haze at its foot.
  const dust = new ImageData(W, H);
  const dd = dust.data;
  const pale: [number, number, number][] = [[214, 218, 255], [190, 196, 255], [255, 214, 186], [240, 240, 255]];
  const ground: [number, number, number][] = [[255, 150, 100], [255, 185, 150], [170, 165, 245], [200, 190, 250]];
  const dot = (i: number, [r, g, b]: [number, number, number], a: number) => {
    dd[i] = r;
    dd[i + 1] = g;
    dd[i + 2] = b;
    dd[i + 3] = a * 255;
  };
  const groundTop = footEnd - drawH * 0.3;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const onStone = dst[i + 3]! > 150;
      if (onStone) {
        if (rand() < 0.07) dot(i, pale[Math.floor(rand() * pale.length)]!, 0.2 + rand() * 0.35);
      } else if (y > groundTop && y < footEnd + drawH * 0.06 && x > left - drawW * 0.05 && x < left + drawW * 1.05) {
        // Thinner toward the edges of the ground.
        const nx = (x - (left + drawW / 2)) / (drawW * 0.55);
        const ny = (y - (footEnd - drawH * 0.1)) / (drawH * 0.2);
        const near = Math.max(0, 1 - nx * nx - ny * ny);
        if (rand() < 0.1 * near) dot(i, ground[Math.floor(rand() * ground.length)]!, 0.25 + rand() * 0.45);
      }
    }
  }
  lines.getContext('2d')!.putImageData(dust, 0, 0);
  c.drawImage(lines, 0, 0);

  // --- 2d. The lights' own volumes ------------------------------------------
  // Above every lit window, the same build as the blue volume's edge: a
  // column of grain, dense at the light and thinning upward, with a faint
  // line through it on every few columns. The lines are drawn here, once;
  // the grain streams through `lightMask` each frame. These do cross the
  // stone above the windows — that is the light rising off them.
  const lightShape = new ImageData(W, H);
  const ld = lightShape.data;
  const glints = new ImageData(W, H);
  const gl = glints.data;
  const rise = new Map<number, number>();
  for (const [x, y] of lights) {
    for (const lx of [x, x + 1]) {
      if (!rise.has(lx)) rise.set(lx, drawH * (0.14 + rand() * 0.22));
      const reachLight = rise.get(lx)!;
      const isLine = lx % lane === 0;
      for (let k = 0; k < reachLight; k++) {
        const yy = y - k;
        if (yy < 0) break;
        const t = k / reachLight;
        const i = (yy * W + lx) * 4;
        ld[i + 3] = Math.max(ld[i + 3]!, 255 * 0.95 * (1 - t) ** 2.2);
        if (isLine) {
          const a = 255 * 0.32 * (1 - t) ** 1.4;
          if (a > gl[i + 3]!) {
            gl[i] = 255;
            gl[i + 1] = 140;
            gl[i + 2] = 60;
            gl[i + 3] = a;
          }
        }
      }
    }
  }
  lines.getContext('2d')!.putImageData(glints, 0, 0);
  c.drawImage(lines, 0, 0);

  // --- 3. The specks, seeded all over the building ---------------------------
  // Pale ones read over the dark stone, deep blue ones on the page above;
  // the warm ones are the windows' light.
  const specks: Speck[] = [];
  const palette = ['#dfe3ff', '#c4c9ff', '#a8b0ff', '#7d84ec', '#3f4fd8', '#3f4fd8', '#ffc58a', '#ff9a4a'];
  const reach = drawH / dpr;
  for (let i = 0; i < 5000 && seeds.length; i++) {
    const [x, y] = seeds[Math.floor(rand() * seeds.length)]!;
    specks.push({
      x: x / dpr + (rand() - 0.5) * 2,
      base: y / dpr,
      y: reach * (0.3 + rand() * 0.8),
      rise: rand(),
      speed: 0.0005 + rand() * 0.0013,
      // How strong this grain is, so they vary as the still ones do.
      size: 0.45 + rand() * 0.55,
      colour: palette[Math.floor(rand() * palette.length)]!,
      phase: rand() * Math.PI * 2,
      sway: 2 + rand() * 10,
      swayRate: 3 + rand() * 9,
    });
  }

  // Orange grain rising from the window lights, a shorter, brighter drift.
  const amber = ['#ff8a2a', '#ff9a3a', '#ffae4a', '#ff7a1f', '#ffc060'];
  for (let i = 0; i < 4500 && lights.length; i++) {
    const [x, y] = lights[Math.floor(rand() * lights.length)]!;
    specks.push({
      x: x / dpr + (rand() - 0.5) * 3,
      base: y / dpr,
      y: reach * (0.12 + rand() * 0.6),
      rise: rand(),
      speed: 0.0006 + rand() * 0.0014,
      size: 1,
      colour: amber[Math.floor(rand() * amber.length)]!,
      phase: rand() * Math.PI * 2,
      sway: 1 + rand() * 6,
      swayRate: 4 + rand() * 10,
    });
  }

  // The windows' glow: the lit pixels alone, blurred wide, to be laid over
  // the picture each frame with a slow pulse.
  const glow = document.createElement('canvas');
  glow.width = W;
  glow.height = H;
  const gx = glow.getContext('2d')!;
  gx.filter = `blur(${Math.round(drawW * 0.018)}px)`;
  gx.drawImage(toCanvas(glowImg), 0, 0);
  gx.filter = `blur(${Math.round(drawW * 0.006)}px)`;
  gx.drawImage(toCanvas(glowImg), 0, 0);

  const amberSheet = lanes(0.7, [[255, 138, 42], [255, 154, 58], [255, 174, 74], [255, 122, 31], [255, 192, 96]], [255, 110, 30]);
  const lightMask = toCanvas(lightShape);

  return { canvas, specks, coolSheet, warmSheet, coolMask, warmMask, glow, amberSheet, lightMask };
}

function toCanvas(img: ImageData) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d')!.putImageData(img, 0, 0);
  return c;
}

function clamp(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
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
