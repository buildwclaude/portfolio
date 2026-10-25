/**
 * The ring in the hero (site/orbit): eight glass app tiles strung like a
 * bracelet around a point of light, tilted toward the viewer and turning.
 *
 *   - Each tile is a rounded slab of dark, clear-coated glass, mirrored by a
 *     studio environment and lit cobalt from a light inside the ring, so its
 *     edges catch blue, and a thin back-faced shell around it glows as a
 *     cobalt rim, the way the reference's tiles are edge-lit.
 *   - Its face carries a tool's logo (Figma, Illustrator, Slack…) in a
 *     single pale blue, drawn once to a canvas, glowing.
 *   - A soft cobalt haze sits behind each tile, and a four-point flare marks
 *     the centre, where the reference holds a hand.
 *   - The pointer leans the ring a little toward itself. Drawing stops while
 *     the hero is off screen. Under reduced motion the ring holds still.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TILES = 8;
const RADIUS = 2.55;
// How far the camera stands back: enough that the ring and its haze clear the stage's edges.
const DISTANCE = 12.5;
const COBALT = new THREE.Color('#2F5BEA');
const SKY = '#8CB4FF';
const INK = '#EEF3FF';

type Glyph = (c: CanvasRenderingContext2D, s: number) => void;

/**
 * The tools on the tiles — the same set the About section lists. A logo is
 * either a drawing (for marks that sit on a solid square, which would tint
 * to a blank tile) or the brand SVG in /logos, tinted to one colour.
 */
const LOGOS: { name: string; draw?: Glyph; svg?: string }[] = [
  { name: 'Figma', draw: figma },
  { name: 'Illustrator', draw: (c, s) => lettered(c, s, 'Ai') },
  { name: 'Slack', svg: 'logos/slack.svg' },
  { name: 'FigJam', draw: figjam },
  { name: 'Creative Cloud', svg: 'logos/adobe-creative-cloud.svg' },
  { name: 'Jira', svg: 'logos/jira.svg' },
  { name: 'TouchDesigner', draw: (c, s) => lettered(c, s, 'TD') },
  { name: 'Google AI Studio', svg: 'logos/google-ai-studio.svg' },
];

/** Figma's five pieces — two columns of pills and a dot — with small gaps between. */
function figma(c: CanvasRenderingContext2D, s: number) {
  const u = s * 0.16, g = s * 0.014;
  const x0 = -u, y0 = -u * 1.5;
  c.beginPath(); c.roundRect(x0 + g, y0 + g, u - g * 2, u - g * 2, [u / 2, 0, 0, u / 2]); c.fill();
  c.beginPath(); c.roundRect(x0 + u + g, y0 + g, u - g * 2, u - g * 2, [0, u / 2, u / 2, 0]); c.fill();
  c.beginPath(); c.roundRect(x0 + g, y0 + u + g, u - g * 2, u - g * 2, [u / 2, 0, 0, u / 2]); c.fill();
  c.beginPath(); c.arc(x0 + u * 1.5, y0 + u * 1.5, u / 2 - g, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.roundRect(x0 + g, y0 + u * 2 + g, u - g * 2, u - g * 2, [u / 2, 0, u / 2, u / 2]); c.fill();
}

/** FigJam: a sticky note with a turned corner, and a stamp. */
function figjam(c: CanvasRenderingContext2D, s: number) {
  const a = s * 0.27, f = s * 0.11;
  c.lineWidth = s * 0.045;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-a, -a); c.lineTo(a - f, -a); c.lineTo(a, -a + f); c.lineTo(a, a * 0.35); c.moveTo(a * 0.2, a); c.lineTo(-a, a); c.closePath();
  c.stroke();
  c.beginPath(); c.moveTo(a - f, -a); c.lineTo(a - f, -a + f); c.lineTo(a, -a + f); c.stroke();
  c.beginPath(); c.arc(a * 0.75, a * 0.8, s * 0.075, 0, Math.PI * 2); c.fill();
}

/** A rounded square outline with letters in it, as Adobe's and Derivative's marks are. */
function lettered(c: CanvasRenderingContext2D, s: number, letters: string) {
  const a = s * 0.31;
  c.lineWidth = s * 0.045;
  c.beginPath(); c.roundRect(-a, -a, a * 2, a * 2, a * 0.35); c.stroke();
  c.font = `700 ${s * 0.26}px "Helvetica Neue", Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(letters, 0, s * 0.012);
}

/** A tool's mark on a transparent square, in one pale blue with a glow. */
function logoTexture(logo: (typeof LOGOS)[number]) {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d')!;
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;

  const paint = (draw: Glyph) => {
    c.save();
    c.translate(size / 2, size / 2);
    c.fillStyle = c.strokeStyle = INK;
    c.shadowColor = SKY;
    c.shadowBlur = size * 0.07;
    draw(c, size);
    draw(c, size); // twice, for a fuller glow
    c.restore();
    t.needsUpdate = true;
  };

  if (logo.draw) {
    paint(logo.draw);
  } else if (logo.svg) {
    // The brand file, flattened to its silhouette in the theme's ink.
    const img = new Image();
    img.onload = () => {
      const box = size * 0.62;
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      const w = ratio >= 1 ? box : box * ratio;
      const h = ratio >= 1 ? box / ratio : box;
      const mark = document.createElement('canvas');
      mark.width = mark.height = size;
      const m = mark.getContext('2d')!;
      m.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      m.globalCompositeOperation = 'source-in';
      m.fillStyle = INK;
      m.fillRect(0, 0, size, size);
      paint((cc) => cc.drawImage(mark, -size / 2, -size / 2));
    };
    img.src = import.meta.env.BASE_URL + logo.svg;
  }
  return t;
}

/** A soft round haze, for the light behind each tile. */
function hazeTexture() {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(47, 91, 234, 0.55)');
  g.addColorStop(0.4, 'rgba(47, 91, 234, 0.18)');
  g.addColorStop(1, 'rgba(47, 91, 234, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A four-point flare: a bright core with long thin rays. */
function flareTexture() {
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d')!;
  const m = size / 2;
  const core = c.createRadialGradient(m, m, 0, m, m, m * 0.5);
  core.addColorStop(0, 'rgba(255, 255, 255, 1)');
  core.addColorStop(0.08, 'rgba(200, 220, 255, 0.95)');
  core.addColorStop(0.3, 'rgba(47, 91, 234, 0.35)');
  core.addColorStop(1, 'rgba(47, 91, 234, 0)');
  c.fillStyle = core;
  c.fillRect(0, 0, size, size);
  for (const [w, h] of [[size, size * 0.012], [size * 0.012, size * 0.75]] as const) {
    const ray = c.createRadialGradient(m, m, 0, m, m, Math.max(w, h) / 2);
    ray.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    ray.addColorStop(1, 'rgba(140, 180, 255, 0)');
    c.fillStyle = ray;
    c.fillRect(m - w / 2, m - h / 2, w, h);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function initOrbit() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-orbit-canvas]');
  if (!canvas) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return; // No WebGL: the hero reads fine without the ring.
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, DISTANCE);

  // Light: cobalt from inside the ring, a cool key from the upper left.
  const inner = new THREE.PointLight(COBALT, 26, 8, 1.6);
  scene.add(inner);
  const key = new THREE.DirectionalLight('#ffffff', 1.2);
  key.position.set(-4, 5, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight('#AFC4FF', 0.25));

  // The ring leans back and to the side, like a bracelet held up.
  const tilt = new THREE.Group();
  tilt.rotation.set(0.42, 0, -0.32);
  scene.add(tilt);
  const ring = new THREE.Group();
  tilt.add(ring);

  const slab = new RoundedBoxGeometry(1.15, 1.15, 0.3, 5, 0.22);
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#05081A',
    metalness: 0.15,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
    emissive: COBALT,
    emissiveIntensity: 0.02,
  });
  const rim = new THREE.MeshBasicMaterial({ color: '#6F8FFF', side: THREE.BackSide, toneMapped: false });
  const face = new THREE.PlaneGeometry(0.9, 0.9);
  const haze = hazeTexture();

  for (let i = 0; i < TILES; i++) {
    const angle = (i / TILES) * Math.PI * 2;
    const tile = new THREE.Group();
    tile.position.set(Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS);
    tile.rotation.y = angle; // its face looks out from the ring
    tile.rotation.z = (i % 2 ? 1 : -1) * 0.12; // a little loose, like links

    tile.add(new THREE.Mesh(slab, glass));
    // The lit edge: a slightly larger slab seen from inside, so only its rim shows.
    const edge = new THREE.Mesh(slab, rim);
    edge.scale.setScalar(1.045);
    tile.add(edge);
    // The logo on both faces, so the tiles across the ring show theirs too.
    const ink = new THREE.MeshBasicMaterial({ map: logoTexture(LOGOS[i % LOGOS.length]!), transparent: true, depthWrite: false, toneMapped: false });
    for (const side of [1, -1]) {
      const icon = new THREE.Mesh(face, ink);
      icon.position.z = 0.152 * side;
      if (side < 0) icon.rotation.y = Math.PI;
      tile.add(icon);
    }

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haze, depthWrite: false, opacity: 0.9 }));
    glow.scale.setScalar(2.1);
    glow.renderOrder = -1;
    tile.add(glow);

    ring.add(tile);
  }

  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTexture(), depthWrite: false, depthTest: false }));
  flare.scale.setScalar(3.4);
  scene.add(flare);

  // Fit the ring to the stage, whatever its proportions.
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the ring's width inside the stage when it is tall and narrow.
    camera.position.z = camera.aspect < 1.1 ? DISTANCE / Math.max(camera.aspect / 1.1, 0.55) : DISTANCE;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        lean.tx = (e.clientX / innerWidth - 0.5) * 0.35;
        lean.ty = (e.clientY / innerHeight - 0.5) * 0.25;
      },
      { passive: true },
    );
  }

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  }).observe(canvas);

  const clock = new THREE.Clock();
  const draw = () => {
    const t = clock.getElapsedTime();
    if (!reducedMotion) {
      ring.rotation.y = t * 0.18;
      lean.x += (lean.tx - lean.x) * 0.05;
      lean.y += (lean.ty - lean.y) * 0.05;
      tilt.rotation.x = 0.42 + lean.y;
      tilt.rotation.y = lean.x;
      flare.material.rotation = Math.sin(t * 0.4) * 0.08;
      flare.scale.setScalar(3.4 + Math.sin(t * 1.3) * 0.15);
    }
    renderer.render(scene, camera);
  };

  draw();
  canvas.classList.add('is-drawn');
  if (reducedMotion) return;

  const loop = () => {
    if (visible) draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
