/**
 * The well in the hero (site/tunnel): curved screens of my work strung along
 * a spiral that narrows as it falls, looked down into from above, with a
 * pool of cobalt light at the bottom and a lone figure standing in it.
 *
 *   - Each screen is a bent plane with rounded corners, turned to face up
 *     out of the well and kept upright to the viewer, so every image reads.
 *   - The screens rise slowly along the spiral, as if the viewer were
 *     sinking past them: they surface out of the dark at the bottom and
 *     leave past the rim at the top.
 *   - The pointer leans the view a little. Drawing stops while the hero is
 *     off screen. Under reduced motion the well holds still.
 */
import * as THREE from 'three';

/** The work on the screens: the featured project cards, then shots from each. */
const IMAGES = [
  'work/cards/yatri-hub.webp',
  'work/cards/ar-hud.webp',
  'work/cards/dashboard.webp',
  'work/cards/eduquest.webp',
  'work/cards/yatri-energy.webp',
  'work/yatrihub/cover.webp',
  'work/dashboard/2153abd9-a54a1e.webp',
  'work/eduquest/0349f306-d87e85.webp',
  'work/yatri-energy/cover.webp',
  'work/yatrihub/38a55d64-d8afd4.webp',
  'work/dashboard/8f0c9249-fb7f81.webp',
  'work/eduquest/4324bdbd-d27da8.webp',
  'work/yatri-energy/3ef2fb74-2ab1ba.webp',
  'work/yatrihub/8f49ae9b-56e08d.webp',
  'art/art-04.webp',
  'art/art-10.webp',
];

const SCREENS = 42;
const TURNS = 3;
// The spiral: from a narrow bottom to a wide rim, and how high it climbs.
const FLOOR_RADIUS = 1.7;
const RIM_RADIUS = 7.6;
const TOP = 10.5;
// A screen's shape, and how tightly it is bent.
const ASPECT = 1.6;
const BEND = 1.15;
const COBALT = '#2F5BEA';
const VOID = '#03040B';

/** A plane bent around its vertical axis, its edges curling toward the viewer. */
function bentPlane() {
  const g = new THREE.PlaneGeometry(ASPECT, 1, 32, 1);
  const p = g.attributes.position!;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    p.setXYZ(i, Math.sin(x / BEND) * BEND, p.getY(i), (1 - Math.cos(x / BEND)) * BEND);
  }
  g.computeVertexNormals();
  return g;
}

/** White inside a rounded rectangle, for the screens' corners. */
function cornerMask() {
  const w = 320, h = 200, r = 18;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#fff';
  c.beginPath();
  c.roundRect(2, 2, w - 4, h - 4, r);
  c.fill();
  return new THREE.CanvasTexture(cv);
}

/** The pool of light on the floor: a cobalt bloom, white at its heart. */
function poolTexture() {
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d')!;
  const m = size / 2;
  const g = c.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(190, 210, 255, 0.95)');
  g.addColorStop(0.12, 'rgba(110, 150, 255, 0.85)');
  g.addColorStop(0.45, 'rgba(47, 91, 234, 0.45)');
  g.addColorStop(0.75, 'rgba(20, 34, 107, 0.15)');
  g.addColorStop(1, 'rgba(20, 34, 107, 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A lone figure in a long coat, in silhouette, standing at the bottom. */
function figureTexture() {
  const w = 128, h = 320;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#05070F';
  // Head and neck.
  c.beginPath(); c.ellipse(64, 34, 15, 18, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(57, 48, 14, 12);
  // The coat: square shoulders, falling to a flared hem.
  c.beginPath();
  c.moveTo(38, 66);
  c.quadraticCurveTo(64, 54, 90, 66);
  c.lineTo(94, 120);
  c.lineTo(88, 128);
  c.lineTo(96, 222);
  c.lineTo(32, 222);
  c.lineTo(40, 128);
  c.lineTo(34, 120);
  c.closePath();
  c.fill();
  // Legs, a little apart, and the feet.
  c.fillRect(46, 218, 13, 86);
  c.fillRect(69, 218, 13, 86);
  c.beginPath(); c.ellipse(52, 306, 11, 6, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(76, 306, 11, 6, 0, 0, Math.PI * 2); c.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Crops an image to the screen's shape, like object-fit: cover. */
function cover(t: THREE.Texture) {
  const img = t.image as { width: number; height: number };
  const ratio = img.width / img.height;
  if (ratio > ASPECT) {
    t.repeat.set(ASPECT / ratio, 1);
    t.offset.set((1 - ASPECT / ratio) / 2, 0);
  } else {
    t.repeat.set(1, ratio / ASPECT);
    t.offset.set(0, (1 - ratio / ASPECT) / 2);
  }
}

export function initTunnel() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-tunnel-canvas]');
  if (!canvas) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    return; // No WebGL: the hero reads fine without the well.
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VOID);
  // The deeper a screen, the further it sinks into the dark.
  scene.fog = new THREE.Fog(VOID, 9, 19);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);
  const eye = new THREE.Vector3(0, 15.5, 4.2);
  const focus = new THREE.Vector3(0, 0.6, 0);

  // The floor: dark, with the pool of light in it.
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  scene.add(pool);

  // The figure, and its shadow thrown toward the viewer by the light.
  const figureMap = figureTexture();
  const figure = new THREE.Sprite(new THREE.SpriteMaterial({ map: figureMap, fog: false }));
  figure.center.set(0.5, 0);
  figure.scale.set(0.56, 1.4, 1);
  figure.position.set(0, 0.05, 0.25);
  scene.add(figure);
  const shadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: figureMap, opacity: 0.45, fog: false, side: THREE.DoubleSide }));
  shadow.center.set(0.5, 0);
  shadow.scale.set(0.56, -2.1, 1);
  shadow.position.copy(figure.position);
  scene.add(shadow);

  // The screens.
  const geometry = bentPlane();
  const mask = cornerMask();
  const loader = new THREE.TextureLoader();
  const maps = IMAGES.map((src) => {
    const t = loader.load(import.meta.env.BASE_URL + src, cover);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  });
  const screens = Array.from({ length: SCREENS }, (_, i) => {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ map: maps[i % maps.length]!, alphaMap: mask, transparent: true, side: THREE.DoubleSide }),
    );
    scene.add(mesh);
    return mesh;
  });

  const deep = new THREE.Color(COBALT).multiplyScalar(0.55);
  const white = new THREE.Color('#ffffff');
  const up = new THREE.Vector3();
  const target = new THREE.Vector3();

  /** Sets each screen at its place on the spiral; `flow` moves them all along it. */
  const place = (flow: number, spin: number) => {
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    screens.forEach((mesh, i) => {
      const s = (i / SCREENS + flow) % 1;
      const angle = s * TURNS * Math.PI * 2 + spin;
      const radius = FLOOR_RADIUS + (RIM_RADIUS - FLOOR_RADIUS) * s ** 1.15;
      const y = 0.35 + TOP * s ** 1.35;
      mesh.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
      mesh.scale.setScalar(0.4 + radius * 0.24);
      // Face somewhere between the well's axis and the viewer, kept upright.
      target.set(0, y, 0).lerp(camera.position, 0.22);
      mesh.up.copy(up);
      mesh.lookAt(target);
      const m = mesh.material as THREE.MeshBasicMaterial;
      // Lit cobalt low down, true colour near the rim; surfacing and leaving softly.
      m.color.copy(deep).lerp(white, Math.min(1, s * 1.6));
      m.opacity = Math.min(1, s / 0.1, (1 - s) / 0.08);
    });
  };

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // A narrow stage widens the view so the spiral still fills it.
    camera.fov = camera.aspect < 0.8 ? 66 : 58;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        lean.tx = (e.clientX / innerWidth - 0.5) * 2.2;
        lean.ty = (e.clientY / innerHeight - 0.5) * 1.6;
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
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    lean.x += (lean.tx - lean.x) * 0.04;
    lean.y += (lean.ty - lean.y) * 0.04;
    camera.position.set(eye.x + lean.x, eye.y, eye.z + lean.y);
    camera.lookAt(focus);
    place(t * 0.011, t * 0.04);
    renderer.render(scene, camera);
  };

  draw();
  canvas.classList.add('is-drawn');
  if (reducedMotion) {
    // Draw again as the images arrive, since nothing else will.
    THREE.DefaultLoadingManager.onLoad = draw;
    return;
  }

  const loop = () => {
    if (visible) draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
