import * as THREE from 'three';
import type { Book, Entry } from '../../content/site';
import { motif } from '../../lib/motif';

/** A volume and the chapter it holds. */
export type ShelfBook = Book & { items: readonly Entry[] };

/**
 * A WebGL bookshelf, after componentry.dev's Newsletter Bookshelf — here,
 * one volume per chapter of the About page.
 *
 * Every volume is a box with a cloth spine and cover drawn onto a canvas
 * (no image files). Hover lifts a book off the shelf, a click pulls it out,
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
  /** The visible outline, re-inked in accent while the book is picked. */
  edges: THREE.LineSegments;
  /** Its hidden edges, dashed, seen through everything in front. */
  hidden: THREE.LineSegments;
  h: number;
  t: number;
  /** The painted faces, kept so a theme change can repaint them in place. */
  faces: { cover: HTMLCanvasElement; back: HTMLCanvasElement; spine: HTMLCanvasElement };
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
  // The drawing's labels, set in the page's type rather than in the canvas.
  const title = stage.parentElement?.querySelector('.shelf__title')?.textContent?.trim() ?? '';
  const pad = (n: number) => String(n).padStart(2, '0');
  for (const [cls, text] of [
    ['shelf__fig--tl', `Fig. 02 — ${title}`],
    ['shelf__fig--tr', `Vol. 01 – ${pad(books.length)}`],
    ['shelf__fig--bl', 'Elevation, not to scale'],
  ]) {
    const label = document.createElement('span');
    label.className = `shelf__fig ${cls} meta`;
    label.setAttribute('aria-hidden', 'true');
    label.textContent = text!;
    wrap.appendChild(label);
  }
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

  /* ---------------------------------------------------------------- ink */
  // Visible edges in ink; the one you are pointing at in accent; hidden
  // edges dashed and faint, drawn through everything as a drawing would.
  const inkLine = new THREE.LineBasicMaterial();
  const accentLine = new THREE.LineBasicMaterial();
  // Faint lines are faint by colour (ink mixed into paper), not by opacity:
  // that keeps them opaque, so draw order alone decides what covers them.
  const ruleLine = new THREE.LineBasicMaterial();
  const hiddenLine = new THREE.LineDashedMaterial({ dashSize: 0.05, gapSize: 0.05, depthTest: false });

  /* --------------------------------------------------------------- shelf */
  const shelf = new THREE.Group();
  scene.add(shelf);

  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  // Faces are flat paper, pushed back a hair so their outlines sit cleanly on top.
  const surface = (map: THREE.Texture) =>
    new THREE.MeshBasicMaterial({ map, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const pageCanvas = document.createElement('canvas');
  const pageMat = surface(canvasTexture(pageCanvas, anisotropy));

  // Deterministic variety: a fuller chapter makes a thicker book.
  const rand = mulberry(7);
  let x = 0;
  const volumes: Volume[] = books.map((book, i) => {
    const h = 2.1 + rand() * 0.5;
    const t = 0.34 + heft(book) * 0.07 + rand() * 0.08;
    const faces = {
      cover: document.createElement('canvas'),
      back: document.createElement('canvas'),
      spine: document.createElement('canvas'),
    };
    const geometry = new THREE.BoxGeometry(t, h, DEPTH);
    geometry.translate(0, h / 2, 0);
    // Faces: +x front cover, -x back cover, +y top, -y bottom, +z spine, -z fore-edge.
    const mesh = new THREE.Mesh(geometry, [
      surface(canvasTexture(faces.cover, anisotropy)),
      surface(canvasTexture(faces.back, anisotropy)),
      pageMat,
      pageMat,
      surface(canvasTexture(faces.spine, anisotropy)),
      pageMat,
    ]);
    const outline = new THREE.EdgesGeometry(geometry);
    // Draw order: faces, then the dashed hidden edges through them, then the
    // solid outlines over the dashes.
    const edges = new THREE.LineSegments(outline, inkLine);
    edges.renderOrder = 2;
    const hidden = new THREE.LineSegments(outline, hiddenLine);
    hidden.computeLineDistances();
    hidden.renderOrder = 1;
    mesh.add(edges, hidden);
    mesh.userData.index = i;
    x += t / 2;
    const home = new THREE.Vector3(x, 0, 0);
    x += t / 2 + GAP;
    shelf.add(mesh);
    return { book, index: i, mesh, edges, hidden, h, t, faces, home, pos: home.clone(), rot: new THREE.Euler() };
  });

  const width = x - GAP;
  for (const v of volumes) {
    v.home.x -= width / 2;
    v.pos.copy(v.home);
    v.mesh.position.copy(v.home);
  }

  // The ledge, in outline, with a scale ruled along the front: a mark at
  // every tenth, a longer one where each book starts and ends — the same
  // language as the ruler down the page's left edge.
  const ledgeW = width + 1.4;
  const ledgeD = DEPTH + 0.3;
  const ledgeGeo = new THREE.BoxGeometry(ledgeW, 0.05, ledgeD);
  const ledgeFace = new THREE.Mesh(
    ledgeGeo,
    new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  );
  ledgeFace.position.y = -0.025;
  const ledgeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(ledgeGeo), inkLine);
  ledgeEdges.renderOrder = 2;
  ledgeFace.add(ledgeEdges);
  shelf.add(ledgeFace);

  const scale: number[] = [];
  const front = ledgeD / 2;
  const rulerY = -0.22;
  const seg = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) =>
    scale.push(ax, ay, az, bx, by, bz);
  seg(-ledgeW / 2, rulerY, front, ledgeW / 2, rulerY, front);
  for (let k = 0, n = Math.round(ledgeW / 0.1); k <= n; k++) {
    const tx = -ledgeW / 2 + k * 0.1;
    seg(tx, rulerY, front, tx, rulerY + (k % 5 === 0 ? 0.07 : 0.035), front);
  }
  const bounds = [...volumes.map((v) => v.home.x - v.t / 2), volumes.at(-1)!.home.x + volumes.at(-1)!.t / 2];
  for (const bx of bounds) seg(bx, rulerY - 0.06, front, bx, rulerY + 0.12, front);
  const ruler = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(scale, 3)),
    ruleLine,
  );
  shelf.add(ruler);

  // Projection lines: each book's edge carried down to the scale.
  const proj: number[] = [];
  for (const bx of bounds) proj.push(bx, -0.05, front, bx, rulerY, front);
  const projection = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(proj, 3)),
    hiddenLine,
  );
  projection.computeLineDistances();
  shelf.add(projection);

  /** Every surface and line is repainted from the page's tokens when the theme flips. */
  const applyTheme = () => {
    const pal = readPalette();
    paintPages(pageCanvas, pal);
    for (const v of volumes) {
      paintSpine(v.faces.spine, v.book, v.index, v.h, v.t, pal);
      paintCover(v.faces.cover, v.book, v.index, v.h, brand, pal);
      paintBack(v.faces.back, v.h, pal);
    }
    for (const m of [pageMat, ...volumes.flatMap((v) => v.mesh.material as THREE.MeshBasicMaterial[])]) {
      if (m.map) m.map.needsUpdate = true;
    }
    (ledgeFace.material as THREE.MeshBasicMaterial).color.set(pal.paper);
    inkLine.color.set(pal.ink);
    accentLine.color.set(pal.accent);
    ruleLine.color.set(pal.paper).lerp(new THREE.Color(pal.muted), 0.6);
    hiddenLine.color.set(pal.paper).lerp(new THREE.Color(pal.ink), 0.28);
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
      v.edges.material = v === hovered || v === focused || v === indexHover ? accentLine : inkLine;
      // A pulled-out book is a sheet in front of the drawing: it is painted
      // after every hidden line, so none of them run across its cover.
      const lifted = v === focused;
      v.mesh.renderOrder = lifted ? 3 : 0;
      v.edges.renderOrder = lifted ? 4 : 2;
      v.hidden.visible = !lifted;
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

/** A registration mark: a small circle with a cross through it. */
function register(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - r * 1.7, y);
  ctx.lineTo(x + r * 1.7, y);
  ctx.moveTo(x, y - r * 1.7);
  ctx.lineTo(x, y + r * 1.7);
  ctx.stroke();
}

function paintSpine(c: HTMLCanvasElement, book: ShelfBook, i: number, h: number, t: number, pal: Palette) {
  const H = 1024;
  const W = Math.round((H * t) / h);
  const ctx = size(c, W, H);
  ctx.fillStyle = pal.paper;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = pal.muted;
  ctx.font = `400 ${Math.round(W * 0.15)}px ${SANS}`;
  ctx.fillText(String(i + 1).padStart(2, '0'), W / 2, 70);

  // Construction lines framing the title, like guides left on a drawing.
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  for (const y of [112, H - 112]) {
    ctx.moveTo(W * 0.18, y);
    ctx.lineTo(W * 0.82, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  register(ctx, W / 2, H - 66, Math.max(6, W * 0.06));

  // Title, set along the spine and read top to bottom.
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = pal.ink;
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
  const ctx = size(c, W, H);
  ctx.fillStyle = pal.paper;
  ctx.fillRect(0, 0, W, H);

  const left = 72;
  const right = W - 56;
  ctx.textBaseline = 'alphabetic';
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;

  // The hinge, as a single ruled line.
  ctx.beginPath();
  ctx.moveTo(36, 0);
  ctx.lineTo(36, H);
  ctx.stroke();

  // Head: the series and the volume number over a rule.
  ctx.fillStyle = pal.muted;
  ctx.font = `400 20px ${SANS}`;
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
  ctx.fillStyle = pal.ink;
  ctx.font = `92px ${SERIF}`;
  let y = 236;
  for (const line of wrap(ctx, book.group, right - left)) {
    ctx.fillText(line, left, y);
    y += 88;
  }
  ctx.fillStyle = pal.muted;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(book.tagline, left, y - 28);

  // The chapter's glyph, set in a dashed construction square with centre lines.
  const cx = W / 2 + 8;
  const cy = H * 0.64;
  const r = Math.min(W, H) * 0.19;
  ctx.save();
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 6]);
  ctx.strokeRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.5, cy);
  ctx.lineTo(cx + r * 1.5, cy);
  ctx.moveTo(cx, cy - r * 1.5);
  ctx.lineTo(cx, cy + r * 1.5);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  motif(ctx, book.motif, cx, cy, r * 0.9);
  ctx.restore();

  // Foot: a title block — the name, with the header's dot beside it.
  ctx.beginPath();
  ctx.moveTo(left, H - 124);
  ctx.lineTo(right, H - 124);
  ctx.stroke();
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(left + 6, H - 84, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.ink;
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText(brand, left + 24, H - 76);
  ctx.fillStyle = pal.muted;
  ctx.font = `400 20px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${book.items.length} ${book.items.length === 1 ? 'entry' : 'entries'}`, right, H - 76);
  ctx.textAlign = 'left';
}

function paintBack(c: HTMLCanvasElement, h: number, pal: Palette) {
  const W = 320;
  const H = Math.round((W * h) / DEPTH);
  const ctx = size(c, W, H);
  ctx.fillStyle = pal.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 1.5;
  register(ctx, W / 2, H - 60, 8);
}

/** Page edges read as a cut section: fine 45° hatching, as on a drawing. */
function paintPages(c: HTMLCanvasElement, pal: Palette) {
  const ctx = size(c, 256, 256);
  ctx.fillStyle = pal.paper;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = pal.muted;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = -256; k < 256; k += 14) {
    ctx.moveTo(k, 256);
    ctx.lineTo(k + 256, 0);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
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
