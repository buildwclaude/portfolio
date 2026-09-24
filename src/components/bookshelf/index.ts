import * as THREE from 'three';
import type { Book, Entry } from '../../content/site';

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
  h: number;
  t: number;
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
  monogram = brand
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
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
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute(
    'aria-label',
    'Bookshelf of projects. Use the left and right arrow keys to pull out a volume, Enter to open it, Escape to put it back.',
  );
  wrap.prepend(canvas);
  stage.classList.add('is-live');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  scene.add(new THREE.HemisphereLight(0xfff8ee, 0x3a3226, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-3.5, 6, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 5, bottom: -2, near: 1, far: 20 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe6c4, 0.6);
  rim.position.set(5, 3, -2);
  scene.add(rim);

  /* --------------------------------------------------------------- shelf */
  const shelf = new THREE.Group();
  scene.add(shelf);

  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const weave = weaveTexture();
  const pages = pagesTexture(anisotropy);
  const pageMat = new THREE.MeshStandardMaterial({ map: pages, roughness: 0.95 });

  // Deterministic variety: heights and thicknesses read as a real shelf.
  const rand = mulberry(7);
  let x = 0;
  const volumes: Volume[] = books.map((book, i) => {
    const h = 2.1 + rand() * 0.5;
    const t = 0.34 + heft(book) * 0.07 + rand() * 0.08;
    const cloth = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({ map, bumpMap: weave, bumpScale: 1.4, roughness: 0.82 });
    const geometry = new THREE.BoxGeometry(t, h, DEPTH);
    geometry.translate(0, h / 2, 0);
    // Faces: +x front cover, -x back cover, +y top, -y bottom, +z spine, -z fore-edge.
    const mesh = new THREE.Mesh(geometry, [
      cloth(canvasTexture(coverCanvas(book, i, h, brand), anisotropy)),
      cloth(canvasTexture(backCanvas(book, h), anisotropy)),
      pageMat,
      pageMat,
      cloth(canvasTexture(spineCanvas(book, i, h, t), anisotropy)),
      pageMat,
    ]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.index = i;
    x += t / 2;
    const home = new THREE.Vector3(x, 0, 0);
    x += t / 2 + GAP;
    shelf.add(mesh);
    return { book, index: i, mesh, h, t, home, pos: home.clone(), rot: new THREE.Euler() };
  });

  const width = x - GAP;
  for (const v of volumes) {
    v.home.x -= width / 2;
    v.pos.copy(v.home);
    v.mesh.position.copy(v.home);
  }

  const plankMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  const plank = new THREE.Mesh(new THREE.BoxGeometry(width + 1.1, 0.16, DEPTH + 0.5), plankMat);
  plank.position.set(0, -0.08, 0.05);
  plank.receiveShadow = true;
  plank.castShadow = true;
  shelf.add(plank);

  // An invisible wall behind the books that only shows their shadow.
  const wallMat = new THREE.ShadowMaterial({ opacity: 0.12 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), wallMat);
  wall.position.set(0, 4, -DEPTH / 2 - 0.3);
  wall.receiveShadow = true;
  scene.add(wall);

  const applyTheme = () => {
    const styles = getComputedStyle(document.documentElement);
    const dark = document.documentElement.dataset.theme === 'dark';
    plankMat.color.set(styles.getPropertyValue('--paper-sunk').trim() || '#e9e6dc');
    if (dark) plankMat.color.offsetHSL(0, 0, 0.06);
    wallMat.opacity = dark ? 0.35 : 0.06;
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
   Drawing — every surface is painted on a canvas.
   ====================================================================== */

/** Stamped at the foot of every spine, where a publisher's mark would go. */
let monogram = '';

const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

function canvasTexture(c: HTMLCanvasElement, anisotropy: number) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

/** Light cloth takes a dark stamp; dark cloth takes gold foil. */
function foil(color: string) {
  // Measured in sRGB, as the eye sees the cloth, not in linear light.
  const n = parseInt(color.slice(1), 16);
  const lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.45 ? '#2a2016' : '#e2c27a';
}

/** Cloth: the colour, a fine weave, a little mottling. */
function paintCloth(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, seed: number) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const rand = mulberry(seed);
  for (let i = 0; i < (w * h) / 90; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1 + rand() * 3);
  }
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.fillStyle = '#fff';
  for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h);
  ctx.globalAlpha = 1;
}

function spineCanvas(book: ShelfBook, i: number, h: number, t: number) {
  const H = 1024;
  const W = Math.round((H * t) / h);
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = c.getContext('2d')!;
  paintCloth(ctx, W, H, book.color, i + 11);
  const ink = foil(book.color);

  // Rounded-spine shading.
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.28)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.06)');
  g.addColorStop(0.65, 'rgba(255,255,255,0.03)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Headband and tailband rules.
  ctx.fillStyle = ink;
  for (const y of [34, 44, H - 48, H - 38]) ctx.fillRect(8, y, W - 16, 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${Math.round(W * 0.17)}px ${SANS}`;
  ctx.fillText(String(i + 1).padStart(2, '0'), W / 2, 84);
  ctx.fillText(monogram, W / 2, H - 86);

  // Title, set along the spine and read top to bottom.
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2);
  let size = Math.round(W * 0.5);
  ctx.font = `${size}px ${SERIF}`;
  while (ctx.measureText(book.group).width > H * 0.62 && size > 12) {
    size -= 2;
    ctx.font = `${size}px ${SERIF}`;
  }
  ctx.fillText(book.group, 0, 2);
  ctx.restore();
  return c;
}

function coverCanvas(book: ShelfBook, i: number, h: number, brand: string) {
  const W = 640;
  const H = Math.round((W * h) / DEPTH);
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = c.getContext('2d')!;
  paintCloth(ctx, W, H, book.color, i + 101);
  const ink = foil(book.color);

  // Hinge shadow along the spine edge (left).
  const hinge = ctx.createLinearGradient(0, 0, 56, 0);
  hinge.addColorStop(0, 'rgba(0,0,0,0.3)');
  hinge.addColorStop(0.6, 'rgba(0,0,0,0.05)');
  hinge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hinge;
  ctx.fillRect(0, 0, 56, H);

  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 40, W - 98, H - 80);
  ctx.lineWidth = 1;
  ctx.strokeRect(66, 48, W - 114, H - 96);

  const left = 104;
  const right = W - 76;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `500 22px ${SANS}`;
  ctx.letterSpacing = '4px';
  ctx.fillText(`MORE ABOUT ME  ·  VOL. ${String(i + 1).padStart(2, '0')}`, left, 118);
  ctx.letterSpacing = '0px';

  // Title, wrapped to the frame.
  ctx.font = `96px ${SERIF}`;
  const lines = wrap(ctx, book.group, right - left);
  let y = 230;
  for (const line of lines) {
    ctx.fillText(line, left, y);
    y += 92;
  }
  ctx.fillRect(left, y - 40, 64, 2);
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(book.tagline, left, y + 6);

  // A motif per series.
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  motif(ctx, book.motif, W / 2 + 10, H * 0.68, Math.min(W, H) * 0.19);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = `500 20px ${SANS}`;
  ctx.letterSpacing = '6px';
  ctx.fillText(brand.toUpperCase(), W / 2 + 10, H - 84);
  ctx.letterSpacing = '0px';
  return c;
}

function backCanvas(book: ShelfBook, h: number) {
  const W = 320;
  const H = Math.round((W * h) / DEPTH);
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = c.getContext('2d')!;
  paintCloth(ctx, W, H, book.color, 7);
  ctx.strokeStyle = foil(book.color);
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(24, 20, W - 48, H - 40);
  return c;
}

function motif(ctx: CanvasRenderingContext2D, kind: Book['motif'], cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (kind === 'steps') {
    // A staircase: one role, then the next.
    const n = 5;
    const w = (2 * r) / n;
    ctx.moveTo(cx - r, cy + r * 0.8);
    for (let k = 0; k < n; k++) {
      const y = cy + r * 0.8 - ((k + 1) * 1.6 * r) / n;
      ctx.lineTo(cx - r + k * w, y);
      ctx.lineTo(cx - r + (k + 1) * w, y);
    }
    ctx.lineTo(cx + r, cy + r * 0.8);
    ctx.closePath();
  } else if (kind === 'rosette') {
    // An award rosette: a ring of petals round a medal, two ribbons below.
    const petals = 16;
    for (let k = 0; k < petals; k++) {
      const a = (k / petals) * Math.PI * 2;
      const px = cx + Math.cos(a) * r * 0.62;
      const py = cy - r * 0.2 + Math.sin(a) * r * 0.62;
      ctx.moveTo(px + r * 0.2, py);
      ctx.arc(px, py, r * 0.2, 0, Math.PI * 2);
    }
    ctx.moveTo(cx + r * 0.42, cy - r * 0.2);
    ctx.arc(cx, cy - r * 0.2, r * 0.42, 0, Math.PI * 2);
    for (const s of [-1, 1]) {
      ctx.moveTo(cx + s * r * 0.15, cy + r * 0.3);
      ctx.lineTo(cx + s * r * 0.4, cy + r * 1.05);
      ctx.lineTo(cx + s * r * 0.22, cy + r * 0.92);
      ctx.lineTo(cx + s * r * 0.05, cy + r * 1.05);
      ctx.lineTo(cx + s * r * 0.03, cy + r * 0.34);
    }
  } else if (kind === 'circles') {
    // People in overlapping circles.
    const ring = 5;
    for (let k = 0; k < ring; k++) {
      const a = (k / ring) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * r * 0.42;
      const py = cy + Math.sin(a) * r * 0.42;
      ctx.moveTo(px + r * 0.5, py);
      ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
    }
  } else if (kind === 'waves') {
    // A voice carrying out to a room.
    ctx.moveTo(cx - r * 0.72, cy);
    ctx.arc(cx - r * 0.8, cy, r * 0.08, 0, Math.PI * 2);
    for (let k = 1; k <= 5; k++) {
      const rr = (r * 1.6 * k) / 5;
      ctx.moveTo(cx - r * 0.8 + Math.cos(-0.7) * rr, cy + Math.sin(-0.7) * rr);
      ctx.arc(cx - r * 0.8, cy, rr, -0.7, 0.7);
    }
  } else {
    // A sprout: something started and still growing.
    ctx.moveTo(cx, cy + r);
    ctx.bezierCurveTo(cx, cy + r * 0.3, cx - r * 0.1, cy - r * 0.2, cx + r * 0.05, cy - r * 0.8);
    ctx.moveTo(cx - r * 0.02, cy + r * 0.05);
    ctx.bezierCurveTo(cx - r * 0.3, cy - r * 0.35, cx - r * 0.85, cy - r * 0.2, cx - r * 0.95, cy - r * 0.55);
    ctx.bezierCurveTo(cx - r * 0.55, cy - r * 0.75, cx - r * 0.15, cy - r * 0.45, cx - r * 0.02, cy + r * 0.05);
    ctx.moveTo(cx + r * 0.02, cy - r * 0.35);
    ctx.bezierCurveTo(cx + r * 0.3, cy - r * 0.75, cx + r * 0.75, cy - r * 0.7, cx + r * 0.85, cy - r * 1.0);
    ctx.bezierCurveTo(cx + r * 0.45, cy - r * 1.1, cx + r * 0.1, cy - r * 0.8, cx + r * 0.02, cy - r * 0.35);
    ctx.moveTo(cx - r * 0.9, cy + r);
    ctx.lineTo(cx + r * 0.9, cy + r);
  }
  ctx.stroke();
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

function pagesTexture(anisotropy: number) {
  const c = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#efe7d4';
  ctx.fillRect(0, 0, 256, 256);
  const rand = mulberry(5);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(90,70,40,${0.04 + rand() * 0.08})`;
    ctx.fillRect(0, y, 256, 1);
  }
  return canvasTexture(c, anisotropy);
}

function weaveTexture() {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 });
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) {
    for (let x = 0; x < 128; x += 2) {
      ctx.fillStyle = (x + y) % 4 === 0 ? '#9a9a9a' : '#6a6a6a';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
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
