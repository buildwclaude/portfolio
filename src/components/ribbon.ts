import * as THREE from 'three';

/**
 * The hero's ribbon, drawn like the shelf: a technical line drawing in the
 * page's own ink and paper. A run of thin plates is strung along a curve
 * that crosses the first screen from top left to bottom right, each plate
 * turned a little further round the curve than the last, so together they
 * read as a twisting band. The twist travels along it slowly.
 *
 * Visible edges are ink; edges behind a plate are dashed and faint, drawn
 * through everything as a drafting would; the curve itself is a long-dash
 * centre line. Plates are flat paper, so they hide what is behind them.
 *
 * Every plate is rigid, so each frame is one pass over a few thousand
 * vertices on the CPU into three shared buffers. The loop only runs while
 * the hero is on screen; with reduced motion it draws one still frame.
 */
const PLATES = 64;
/** Plate size as a fraction of the screen's shorter side: across, height, thickness. */
const ACROSS = 0.2;
const HEIGHT = 0.024;
const THICK = 0.012;
const FOV = 30;
const CAMERA_Z = 11;

/** A unit box's 8 corners, its 12 edges and its 12 triangles. */
const CORNERS = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
].map(([x, y, z]) => new THREE.Vector3(x! / 2, y! / 2, z! / 2));
const EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
const FACES = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5];

export function createRibbon(host: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // No lights, no tone mapping: the page's ink and paper, exactly.
  renderer.toneMapping = THREE.NoToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);

  /* ------------------------------------------------------------------ ink */
  const inkLine = new THREE.LineBasicMaterial();
  // Faint by colour (ink mixed into paper), not opacity, as on the shelf.
  const hiddenLine = new THREE.LineDashedMaterial({ dashSize: 0.045, gapSize: 0.045, depthTest: false });
  const centreLine = new THREE.LineDashedMaterial({ dashSize: 0.34, gapSize: 0.1 });
  const paper = new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

  function paint() {
    const css = getComputedStyle(document.documentElement);
    const token = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const ink = new THREE.Color(token('--ink', '#111111'));
    const sheet = new THREE.Color(token('--paper', '#F3F1E9'));
    inkLine.color.copy(ink);
    paper.color.copy(sheet);
    hiddenLine.color.copy(sheet).lerp(ink, 0.22);
    centreLine.color.copy(sheet).lerp(ink, 0.4);
    if (!running) draw();
  }

  /* ------------------------------------------------------------ geometry */
  const edgeVerts = PLATES * EDGES.length;
  const faceVerts = PLATES * FACES.length;
  const edgePos = new Float32Array(edgeVerts * 3);
  const facePos = new Float32Array(faceVerts * 3);

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3).setUsage(THREE.DynamicDrawUsage));
  const faceGeo = new THREE.BufferGeometry();
  faceGeo.setAttribute('position', new THREE.BufferAttribute(facePos, 3).setUsage(THREE.DynamicDrawUsage));

  // Hidden edges go down first and ignore depth; paper covers what it should;
  // visible edges go on last.
  const hidden = new THREE.LineSegments(edgeGeo, hiddenLine);
  hidden.renderOrder = 0;
  const faces = new THREE.Mesh(faceGeo, paper);
  faces.renderOrder = 1;
  const edges = new THREE.LineSegments(edgeGeo, inkLine);
  edges.renderOrder = 2;
  const spine = new THREE.Line(new THREE.BufferGeometry(), centreLine);
  spine.renderOrder = 1;
  [hidden, faces, edges, spine].forEach((o) => (o.frustumCulled = false));

  const group = new THREE.Group();
  group.add(spine, hidden, faces, edges);
  scene.add(group);

  /* ---------------------------------------------------------------- path */
  type Frame = { t: number; pos: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3 };
  let frames: Frame[] = [];
  let size = new THREE.Vector3();

  /** Lays the curve across the screen, corner to corner, for the box's shape. */
  function layPath(w: number, h: number) {
    const s = Math.min(w, h);
    size = new THREE.Vector3(ACROSS * s, HEIGHT * s, THICK * s);
    const curve = new THREE.CatmullRomCurve3(
      [
        // Enters past the top-left corner and leaves off the right edge,
        // above the foot line, so the link there stays clear.
        new THREE.Vector3(-0.6 * w, 0.52 * h, -0.4),
        new THREE.Vector3(-0.3 * w, 0.2 * h, 0.5),
        new THREE.Vector3(0.0 * w, 0.04 * h, -0.2),
        new THREE.Vector3(0.3 * w, -0.14 * h, 0.5),
        new THREE.Vector3(0.62 * w, -0.27 * h, -0.4),
      ],
      false,
      'centripetal',
    );
    frames = Array.from({ length: PLATES }, (_, i) => {
      const t = i / (PLATES - 1);
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      return { t, pos, tangent, normal, binormal };
    });
    spine.geometry.dispose();
    spine.geometry = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(160));
    spine.computeLineDistances();
    hiddenLine.dashSize = hiddenLine.gapSize = size.x * 0.035;
  }

  /* ---------------------------------------------------------------- pose */
  const basis = new THREE.Matrix4();
  const across = new THREE.Vector3();
  const up = new THREE.Vector3();
  const v = new THREE.Vector3();
  const corners = CORNERS.map(() => new THREE.Vector3());

  function pose(time: number, grow: number) {
    for (let i = 0; i < PLATES; i++) {
      const f = frames[i]!;
      // Two and a half turns along the band, walking forward, with a slow swell on top.
      const angle = f.t * Math.PI * 2.5 + time * 0.3 + 0.35 * Math.sin(f.t * 7 - time * 0.8);
      across.copy(f.normal).multiplyScalar(Math.cos(angle)).addScaledVector(f.binormal, Math.sin(angle));
      up.crossVectors(f.tangent, across);
      basis.makeBasis(across, up, f.tangent);
      // Plates are drawn in, one after another, on load.
      const s = THREE.MathUtils.smoothstep(grow * 1.6 - f.t * 0.6, 0, 1);
      for (let c = 0; c < 8; c++) {
        v.set(CORNERS[c]!.x * size.x * s, CORNERS[c]!.y * size.y, CORNERS[c]!.z * size.z);
        corners[c]!.copy(v.applyMatrix4(basis)).add(f.pos);
      }
      let o = i * EDGES.length * 3;
      for (const c of EDGES) {
        corners[c]!.toArray(edgePos, o);
        o += 3;
      }
      o = i * FACES.length * 3;
      for (const c of FACES) {
        corners[c]!.toArray(facePos, o);
        o += 3;
      }
    }
    edgeGeo.attributes.position!.needsUpdate = true;
    faceGeo.attributes.position!.needsUpdate = true;
    hidden.computeLineDistances();
  }

  /* --------------------------------------------------------------- sizing */
  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // The size of the screen at the curve's depth, in world units.
    const viewH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    layPath(viewH * camera.aspect, viewH);
    if (!running) draw();
  }

  /* ---------------------------------------------------------------- loop */
  const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  let running = false;
  let visible = true;
  let raf = 0;
  let start = performance.now();
  let clock = 0;

  function draw() {
    if (!frames.length) return;
    const time = reduced ? 1.5 : clock;
    const grow = reduced ? 1 : Math.min(1, (performance.now() - start) / 2000);
    pose(time, grow);
    lean.x += (lean.tx - lean.x) * 0.05;
    lean.y += (lean.ty - lean.y) * 0.05;
    group.rotation.set(lean.y * 0.06, lean.x * 0.1, 0);
    renderer.render(scene, camera);
  }

  let last = performance.now();
  function frame(now: number) {
    raf = 0;
    if (!running) return;
    clock += Math.min(0.05, (now - last) / 1000);
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (running || reduced || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  const onPointer = (e: PointerEvent) => {
    lean.tx = (e.clientX / innerWidth) * 2 - 1;
    lean.ty = (e.clientY / innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible) play();
    else pause();
  });
  io.observe(host);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const onVisibility = () => (document.hidden ? pause() : play());
  document.addEventListener('visibilitychange', onVisibility);
  // Ink and paper follow the theme toggle.
  const themeWatch = new MutationObserver(paint);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  resize();
  paint();
  start = performance.now();
  if (reduced) draw();
  else play();
  host.classList.add('is-live');

  return {
    destroy() {
      pause();
      io.disconnect();
      ro.disconnect();
      themeWatch.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      [edgeGeo, faceGeo, spine.geometry].forEach((g) => g.dispose());
      [inkLine, hiddenLine, centreLine, paper].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
