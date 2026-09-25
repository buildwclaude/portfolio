import * as THREE from 'three';
import type { Book, Entry } from '../../content/site';
import { motif } from '../../lib/motif';

/** A volume and the chapter it holds. */
export type ShelfBook = Book & { items: readonly Entry[] };

/**
 * A WebGL bookshelf, after componentry.dev's Newsletter Bookshelf — here,
 * one volume per chapter of the About page.
 *
 * Every volume is built like the landing page's folder: frosted glass with
 * a solid core of the chapter's colour blurred inside it, a bright rim and a
 * glow beneath, the type set in white on the glass. The blur is painted onto
 * each face's canvas (no image files, and no refraction pass to go wrong). Hover lifts a book off the shelf, a click pulls it out,
 * turns its cover to you and lists the chapter on a card, a second click
 * opens it. The shelf sways on
 * its own and can be turned by dragging. Arrow keys step through the
 * volumes, Enter opens, Escape puts the book back.
 */

export type BookshelfOptions = {
  books: ShelfBook[];
  /** Printed at the foot of every cover. */
  brand: string;
  onOpen: (book: ShelfBook) => void;
};

type Volume = {
  book: ShelfBook;
  index: number;
  mesh: THREE.Mesh;
  /** The glass's rim, brightened while the book is picked. */
  edges: THREE.LineSegments;
  rim: THREE.LineBasicMaterial;
  rimHot: THREE.LineBasicMaterial;
  h: number;
  t: number;
  /** The painted faces, kept so a theme change can repaint them in place. */
  faces: Record<'cover' | 'back' | 'top' | 'bottom' | 'spine' | 'fore', HTMLCanvasElement>;
  home: THREE.Vector3;
  pos: THREE.Vector3;
  rot: THREE.Euler;
};

const DEPTH = 1.6;
const GAP = 0.03;
const FOV = 28;
const LOOK_Y = 1.25;

export async function createBookshelf(stage: HTMLElement, options: BookshelfOptions) {
  const { books, brand } = options;
  // The About page covers the shelf, so the book goes back behind it.
  const onOpen = (book: ShelfBook) => {
    options.onOpen(book);
    focus(null);
  };
  if (!supportsWebGL()) return null;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const index = stage.parentElement?.querySelector<HTMLElement>('.shelf__index') ?? null;
  const card = stage.querySelector<HTMLElement>('.shelf__card')!;
  const hint = stage.querySelector<HTMLElement>('.shelf__hint');

  // Canvas text needs the faces to be ready before a single spine is drawn.
  await Promise.race([
    Promise.all([
      document.fonts.load('64px "Instrument Serif"'),
      document.fonts.load('500 20px Inter'),
    ]),
    new Promise((r) => setTimeout(r, 1500)),
  ]).catch(() => undefined);

  /* ------------------------------------------------------------ renderer */
  const wrap = document.createElement('div');
  wrap.className = 'shelf__canvas';
  const tip = document.createElement('span');
  tip.className = 'shelf__tip meta';
  tip.setAttribute('aria-hidden', 'true');
  wrap.appendChild(tip);
  stage.prepend(wrap);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // No tone mapping and no lights: the shelf is a line drawing in the page's
  // own ink and paper, and should come out as exactly those colours.
  renderer.toneMapping = THREE.NoToneMapping;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute(
    'aria-label',
    'More about me, as a bookshelf. Use the left and right arrow keys to pull out a volume, Enter to open it, Escape to put it back.',
  );
  wrap.prepend(canvas);
  stage.classList.add('is-live');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  /* --------------------------------------------------------------- shelf */
  const shelf = new THREE.Group();
  scene.add(shelf);

  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const glass = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, transparent: true });
  const glowMap = canvasTexture(paintGlow(document.createElement('canvas')), anisotropy);

  // Deterministic variety: a fuller chapter makes a thicker book.
  const rand = mulberry(7);
  let x = 0;
  const volumes: Volume[] = books.map((book, i) => {
    const h = 2.1 + rand() * 0.5;
    const t = 0.34 + heft(book) * 0.07 + rand() * 0.08;
    const tint = new THREE.Color(book.color);
    const canvas = () => document.createElement('canvas');
    const faces = { cover: canvas(), back: canvas(), top: canvas(), bottom: canvas(), spine: canvas(), fore: canvas() };
    const geometry = new THREE.BoxGeometry(t, h, DEPTH);
    geometry.translate(0, h / 2, 0);
    // Faces: +x front cover, -x back cover, +y top, -y bottom, +z spine, -z fore-edge.
    const mesh = new THREE.Mesh(
      geometry,
      (['cover', 'back', 'top', 'bottom', 'spine', 'fore'] as const).map((f) =>
        glass(canvasTexture(faces[f], anisotropy)),
      ),
    );

    // A glow of its colour on the ledge beneath it.
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(t + 0.9, DEPTH + 0.7),
      new THREE.MeshBasicMaterial({ map: glowMap, color: tint, transparent: true, depthWrite: false, opacity: 0.5 }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.004;

    // The rim: a bright edge of the chapter's colour, full strength when picked.
    const rim = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ffffff').lerp(tint, 0.45),
      transparent: true,
      opacity: 0.9,
    });
    const rimHot = new THREE.LineBasicMaterial({ color: tint });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), rim);
    edges.renderOrder = 2;

    mesh.add(glow, edges);
    mesh.userData.index = i;
    x += t / 2;
    const home = new THREE.Vector3(x, 0, 0);
    x += t / 2 + GAP;
    shelf.add(mesh);
    return { book, index: i, mesh, edges, rim, rimHot, h, t, faces, home, pos: home.clone(), rot: new THREE.Euler() };
  });

  const width = x - GAP;
  for (const v of volumes) {
    v.home.x -= width / 2;
    v.pos.copy(v.home);
    v.mesh.position.copy(v.home);
  }

  // The ledge: a plank of frosted white glass with a bright edge, and a soft
  // shadow on the page beneath it — the same light as the landing page's folder.
  const ledgeW = width + 1.4;
  const ledgeD = DEPTH + 0.3;
  const ledgeGeo = new THREE.BoxGeometry(ledgeW, 0.1, ledgeD);
  const ledgeFace = new THREE.Mesh(
    ledgeGeo,
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.78,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  );
  ledgeFace.position.y = -0.05;
  const ledgeEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(ledgeGeo),
    new THREE.LineBasicMaterial({ color: '#cfdaf0', transparent: true, opacity: 0.9 }),
  );
  ledgeEdges.renderOrder = 2;
  ledgeFace.add(ledgeEdges);
  shelf.add(ledgeFace);

  const ledgeShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(ledgeW + 1.2, ledgeD + 1.4),
    new THREE.MeshBasicMaterial({ map: glowMap, color: '#5a6f9e', transparent: true, depthWrite: false, opacity: 0.22 }),
  );
  ledgeShadow.rotation.x = -Math.PI / 2;
  ledgeShadow.position.y = -0.32;
  shelf.add(ledgeShadow);

  /** Every surface and line is repainted from the page's tokens when the theme flips. */
  const applyTheme = () => {
    const pal = readPalette();
    for (const v of volumes) {
      const { color } = v.book;
      paintSpine(v.faces.spine, v.book, v.index, v.h, v.t);
      paintCover(v.faces.cover, v.book, v.index, v.h, brand, pal);
      paintGlass(v.faces.back, 320, Math.round((320 * v.h) / DEPTH), color);
      paintGlass(v.faces.fore, 200, Math.round((200 * v.h) / v.t), color);
      paintGlass(v.faces.top, 256, Math.round((256 * DEPTH) / v.t), color);
      paintGlass(v.faces.bottom, 256, Math.round((256 * DEPTH) / v.t), color);
      for (const m of v.mesh.material as THREE.MeshBasicMaterial[]) if (m.map) m.map.needsUpdate = true;
    }
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  /* -------------------------------------------------------------- layout */
  let camDist = 10;
  let narrow = false;

  const resize = () => {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w < 700;
    const fitWidth = (width / 2 + 0.7) / (tanHalf * camera.aspect);
    const fitHeight = 2.3 / tanHalf;
    camDist = Math.max(fitWidth, fitHeight);
    camera.position.set(0, LOOK_Y + 0.55, camDist);
    camera.lookAt(0, LOOK_Y, 0);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(wrap);
  resize();

  /** Where a pulled-out book floats: near the camera, cover towards you. */
  function focusPose(v: Volume) {
    const fill = narrow ? 0.8 : 0.66;
    const dist = v.h / fill / 2 / tanHalf;
    // Always clear of the shelf's front edge, so it never cuts through a neighbour.
    const z = Math.max(DEPTH + 0.5, camDist - dist);
    const halfW = (camDist - z) * tanHalf * camera.aspect;
    // On wide stages the card sits on the right, so the book moves left.
    const xOff = narrow ? 0 : -halfW * 0.38;
    return {
      pos: new THREE.Vector3(xOff, LOOK_Y + 0.25 - v.h / 2, z),
      rot: new THREE.Euler(0.04, -Math.PI / 2 + 0.38, 0.02),
    };
  }

  /* --------------------------------------------------------- interaction */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let hovered: Volume | null = null;
  let focused: Volume | null = null;
  let indexHover: Volume | null = null;

  let yaw = 0;
  let yawVel = 0;
  let tilt = 0;
  let dragging = false;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let moved = false;
  let lastInteraction = -Infinity;

  const pick = (): Volume | null => {
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(volumes.map((v) => v.mesh), false)[0];
    return hit ? volumes[hit.object.userData.index as number] ?? null : null;
  };

  const setNdc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
  };

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = false;
    downX = lastX = e.clientX;
    downY = e.clientY;
    yawVel = 0;
    lastInteraction = performance.now();
  });

  window.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) moved = true;
      if (moved && !focused) {
        yawVel = dx * 0.006;
        yaw = THREE.MathUtils.clamp(yaw + yawVel, -0.75, 0.75);
        canvas.classList.add('is-dragging');
      }
      lastInteraction = performance.now();
    }
    if (e.target !== canvas) return;
    setNdc(e);
    tilt = ndc.y;
    const next = dragging && moved ? null : pick();
    if (next !== hovered) {
      hovered = next;
      canvas.style.cursor = hovered ? 'pointer' : dragging ? 'grabbing' : 'grab';
      tip.textContent = hovered
        ? hovered === focused
          ? `Open ${hovered.book.group}`
          : hovered.book.group
        : '';
      tip.classList.toggle('is-on', !!hovered);
    }
  });

  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    ndc.set(9, 9);
    tip.classList.remove('is-on');
  });

  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    if (moved || e.target !== canvas) return;
    setNdc(e);
    const target = pick();
    if (!target) focus(null);
    else if (target === focused) onOpen(target.book);
    else focus(target);
  });

  canvas.addEventListener('keydown', (e) => {
    const i = focused ? focused.index : -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const n = i < 0 ? (step > 0 ? 0 : volumes.length - 1) : (i + step + volumes.length) % volumes.length;
      focus(volumes[n]!);
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      onOpen(focused.book);
    } else if (e.key === 'Escape' && focused) {
      e.preventDefault();
      focus(null);
    }
  });

  // The index below the shelf points at its volume.
  index?.querySelectorAll<HTMLElement>('.shelf__vol').forEach((li) => {
    const v = volumes[Number(li.dataset.index)];
    if (!v) return;
    const on = () => (indexHover = v);
    const off = () => indexHover === v && (indexHover = null);
    li.addEventListener('pointerenter', on);
    li.addEventListener('pointerleave', off);
    li.addEventListener('focusin', on);
    li.addEventListener('focusout', off);
  });

  /* ---------------------------------------------------------------- card */
  const cardKicker = card.querySelector<HTMLElement>('.shelf__card-kicker')!;
  const cardTitle = card.querySelector<HTMLElement>('.shelf__card-title')!;
  const cardMeta = card.querySelector<HTMLElement>('.shelf__card-meta')!;
  const cardList = card.querySelector<HTMLElement>('.shelf__card-list')!;
  const openBtn = card.querySelector<HTMLButtonElement>('.shelf__open')!;
  card.querySelector('.shelf__back')!.addEventListener('click', () => {
    focus(null);
    canvas.focus({ preventScroll: true });
  });
  openBtn.addEventListener('click', () => focused && onOpen(focused.book));

  function focus(v: Volume | null) {
    focused = v;
    lastInteraction = performance.now();
    // The tip's wording depends on focus; let the next move redraw it.
    hovered = null;
    tip.classList.remove('is-on');
    stage.classList.toggle('has-focus', !!v);
    index?.querySelectorAll('.shelf__vol').forEach((li, i) => {
      li.classList.toggle('is-active', v?.index === i);
    });
    if (!v) {
      card.classList.remove('is-on');
      return;
    }
    const b = v.book;
    const pad = (n: number) => String(n).padStart(2, '0');
    cardKicker.textContent = `Vol. ${pad(v.index + 1)} of ${pad(volumes.length)}`;
    cardTitle.textContent = b.group;
    cardMeta.textContent = b.tagline;
    // The chapter's contents page: what it holds, not the whole story.
    cardList.replaceChildren(
      ...b.items.map((item) => {
        const li = document.createElement('li');
        const title = document.createElement('span');
        title.className = 'shelf__card-item';
        title.textContent = item.title;
        const meta = document.createElement('span');
        meta.className = 'shelf__card-sub';
        meta.textContent = [item.meta, item.year].filter(Boolean).join(' · ');
        li.append(title, meta);
        return li;
      }),
    );
    card.hidden = false;
    card.classList.remove('is-on');
    void card.offsetWidth; // restart the entrance
    card.classList.add('is-on');
    if (hint) hint.classList.add('is-gone');
  }


  /* ---------------------------------------------------------------- loop */
  const clock = new THREE.Clock();
  let visible = false;
  let raf = 0;
  const tmpPos = new THREE.Vector3();
  const tmpRot = new THREE.Euler();

  const frame = () => {
    raf = visible ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const k = (rate: number) => (reduced ? 1 : 1 - Math.exp(-dt * rate));

    // The shelf's own slow sway, handed back after a drag goes quiet.
    const idle = performance.now() - lastInteraction > 2600;
    if (!dragging) {
      yaw += yawVel;
      yawVel *= 0.92;
      const rest = focused ? 0 : idle && !reduced ? Math.sin(time * 0.22) * 0.2 : yaw;
      yaw += (rest - yaw) * k(focused ? 5 : 0.8);
      yaw = THREE.MathUtils.clamp(yaw, -0.75, 0.75);
    }
    shelf.rotation.y = yaw;
    shelf.rotation.x += ((focused ? 0 : tilt * 0.035) - shelf.rotation.x) * k(3);

    for (const v of volumes) {
      if (v === focused) {
        const pose = focusPose(v);
        tmpPos.copy(pose.pos);
        tmpRot.copy(pose.rot);
        if (!reduced) {
          tmpPos.y += Math.sin(time * 1.3) * 0.04;
          tmpRot.y += Math.sin(time * 0.7) * 0.05;
        }
      } else {
        tmpPos.copy(v.home);
        tmpRot.set(0, 0, 0);
        if (v === hovered || v === indexHover) {
          tmpPos.y += 0.22;
          tmpPos.z += 0.18;
          tmpRot.x = -0.05;
        }
      }
      const s = k(v === focused ? 6 : 9);
      v.pos.lerp(tmpPos, s);
      v.rot.x += (tmpRot.x - v.rot.x) * s;
      v.rot.y += (tmpRot.y - v.rot.y) * s;
      v.rot.z += (tmpRot.z - v.rot.z) * s;
      v.mesh.position.copy(v.pos);
      v.mesh.rotation.copy(v.rot);
      v.edges.material = v === hovered || v === focused || v === indexHover ? v.rimHot : v.rim;
    }

    renderer.render(scene, camera);
  };

  new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible && !raf) {
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    }
  }).observe(wrap);

  return { focus: (i: number | null) => focus(i === null ? null : volumes[i] ?? null) };
}

/* ======================================================================
   Drawing — every surface is painted on a canvas, in the page's tokens.
   ====================================================================== */

const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

type Palette = { paper: string; ink: string; muted: string; accent: string };

/**
 * The drawing's colours, straight from the design tokens: the page's paper,
 * its ink, and the accent — kept for the picked book and the header's dot.
 */
function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    paper: token('--paper', '#F3F1E9'),
    ink: token('--ink', '#111111'),
    muted: token('--ink-muted', '#888888'),
    accent: token('--accent', '#d94f38'),
  };
}

function canvasTexture(c: HTMLCanvasElement, anisotropy: number) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function size(c: HTMLCanvasElement, w: number, h: number) {
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  return c.getContext('2d')!;
}

/** A soft round glow, white at the centre, tinted by each book's material. */
function paintGlow(c: HTMLCanvasElement) {
  const ctx = size(c, 128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

/**
 * One face of frosted glass, as on the landing page's folder: milky
 * translucent white with the solid core of `color` blurred behind it, a
 * white haze low down and a bright rim along the top. The blur is a
 * shadow cast from off-canvas, which every browser's canvas can draw.
 */
function paintGlass(c: HTMLCanvasElement, W: number, H: number, color: string) {
  const ctx = size(c, W, H);
  ctx.clearRect(0, 0, W, H);
  // Frosted enough that one book never shows through another.
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.fillRect(0, 0, W, H);

  const m = Math.min(W, H);
  const inset = m * 0.2;
  const blur = m * 0.16;
  const light = '#' + new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.4).getHexString();
  const blob = (x: number, y: number, w: number, h: number, fill: string, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = fill;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = W * 4;
    ctx.fillStyle = fill;
    ctx.fillRect(x - W * 4, y, w, h);
    ctx.restore();
  };
  // The core, and a lighter band across its top where it catches the light.
  blob(inset, inset, W - inset * 2, H - inset * 2, color, 0.9);
  blob(inset, inset, W - inset * 2, (H - inset * 2) * 0.35, light, 0.7);

  const haze = ctx.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(1, 'rgba(255,255,255,0.4)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, 0, W, Math.max(3, H * 0.005));
  return ctx;
}

const WHITE = '#ffffff';
const WHITE_SOFT = 'rgba(255,255,255,0.78)';

function paintSpine(c: HTMLCanvasElement, book: ShelfBook, i: number, h: number, t: number) {
  const H = 1024;
  const W = Math.round((H * t) / h);
  const ctx = paintGlass(c, W, H, book.color);
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 6;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = WHITE_SOFT;
  ctx.font = `500 ${Math.round(W * 0.15)}px ${SANS}`;
  ctx.fillText(String(i + 1).padStart(2, '0'), W / 2, 70);

  // Title, set along the spine and read top to bottom.
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = WHITE;
  let px = Math.round(W * 0.42);
  ctx.font = `${px}px ${SERIF}`;
  while (ctx.measureText(book.group).width > H * 0.6 && px > 12) {
    px -= 2;
    ctx.font = `${px}px ${SERIF}`;
  }
  ctx.fillText(book.group, 0, 2);
  ctx.restore();
}

function paintCover(c: HTMLCanvasElement, book: ShelfBook, i: number, h: number, brand: string, pal: Palette) {
  const W = 640;
  const H = Math.round((W * h) / DEPTH);
  const ctx = paintGlass(c, W, H, book.color);
  ctx.shadowColor = 'rgba(0,0,0,0.16)';
  ctx.shadowBlur = 8;

  const left = 72;
  const right = W - 56;
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = WHITE_SOFT;
  ctx.lineWidth = 1.5;

  // Head: the series and the volume number over a rule.
  ctx.fillStyle = WHITE_SOFT;
  ctx.font = `500 20px ${SANS}`;
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText('MORE ABOUT ME', left, 100);
  ctx.textAlign = 'right';
  ctx.fillText(`VOL. ${String(i + 1).padStart(2, '0')}`, right, 100);
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
  ctx.beginPath();
  ctx.moveTo(left, 124);
  ctx.lineTo(right, 124);
  ctx.stroke();

  // Title and tagline.
  ctx.fillStyle = WHITE;
  ctx.font = `92px ${SERIF}`;
  let y = 236;
  for (const line of wrap(ctx, book.group, right - left)) {
    ctx.fillText(line, left, y);
    y += 88;
  }
  ctx.fillStyle = WHITE_SOFT;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(book.tagline, left, y - 28);

  // The chapter's glyph.
  const cx = W / 2 + 8;
  const cy = H * 0.64;
  const r = Math.min(W, H) * 0.19;
  ctx.save();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  motif(ctx, book.motif, cx, cy, r * 0.9);
  ctx.restore();

  // Foot: the name, with the header's dot beside it.
  ctx.beginPath();
  ctx.moveTo(left, H - 124);
  ctx.lineTo(right, H - 124);
  ctx.stroke();
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(left + 6, H - 84, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText(brand, left + 24, H - 76);
  ctx.fillStyle = WHITE_SOFT;
  ctx.font = `400 20px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${book.items.length} ${book.items.length === 1 ? 'entry' : 'entries'}`, right, H - 76);
  ctx.textAlign = 'left';
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** A fuller chapter makes a thicker book. */
function heft(book: ShelfBook) {
  return Math.min(book.items.length, 5);
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
