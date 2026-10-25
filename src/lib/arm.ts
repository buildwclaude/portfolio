/**
 * The arm in the hero (site/arm): a workshop arm on a turntable, standing
 * on the page itself, seen from a three-quarter view and casting a shadow
 * on an unseen floor.
 *
 *   - The pointer is carried into the room, onto an upright plane through
 *     the base facing the viewer. The turntable swings the arm to face that
 *     point, and shoulder, elbow and wrist are solved so the claw's tips
 *     land on it; past its reach the arm stretches toward it. Every joint
 *     eases to its angle, so a jump of the pointer reads as a swing.
 *   - The claw droops toward the floor as a hand would. It rests closed;
 *     pressing anywhere in the hero holds it open, and letting go closes it.
 *   - On the floor beside it lies a sheet of paper with "hello" on it
 *     (lib/paper). Soon after the page opens, the arm reaches down, pinches
 *     the sheet by its top edge, lifts it and holds it up to the viewer for
 *     a few seconds, swaying a little, then lays it back where it was.
 *   - Left alone, it idles: looking about, around and over itself.
 *   - Drawing stops while the hero is off screen. Under reduced motion it
 *     still follows the pointer but never moves on its own, and the paper
 *     stays on the floor.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createPaper } from './paper';

// Link lengths, from the shoulder out.
const UPPER = 2.7;
const FORE = 2.35;
// From the wrist joint to the tips of the claw.
const HAND = 1.15;
// The shoulder's height above the floor.
const SHOULDER_Y = 2.55;
// Seconds without the pointer before the arm idles.
const IDLE_AFTER = 3.5;
// Showing the paper: when it starts, then each step and its seconds.
const SHOW_AT = 2.2;
const STEPS = [
  ['reach', 1.1], // over the sheet, opening the claw
  ['dip', 0.6], // down to its top edge
  ['pinch', 0.35], // closing on it
  ['lift', 1.4], // up, turning the sheet to face the viewer
  ['show', 3.4], // holding it there
  ['turn', 1.2], // back over the floor, laying the sheet flat
  ['lower', 0.6], // down onto the floor
  ['release', 0.5], // letting go, and up out of the way
] as const;
type Step = (typeof STEPS)[number][0];

/** A round joint housing on the link's pivot axis, with a cobalt cap on each face. */
function hub(radius: number, depth: number, shell: THREE.Material, cap: THREE.Material) {
  const g = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 48), shell);
  drum.rotation.x = Math.PI / 2;
  g.add(drum);
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.78, radius * 0.86, depth * 0.12, 48), cap);
    face.rotation.x = Math.PI / 2;
    face.position.z = side * depth * 0.54;
    g.add(face);
  }
  return g;
}

/** A link between joints: a tapered tube along +Y from the joint, `length` long. */
function link(radius: number, length: number, material: THREE.Material, taper = 1) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius * taper, radius, length, 40), material);
  m.position.y = length / 2;
  return m;
}

/** A drum on the axis of whatever holds it, as the pedestal's tiers and the forearm's sleeves. */
function ring(radius: number, height: number, y: number, material: THREE.Material) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), material);
  m.position.y = y;
  return m;
}

/** The shortest turn from `a` to `b`. */
function turn(a: number, b: number) {
  return Math.atan2(Math.sin(b - a), Math.cos(b - a));
}

export function initArm() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-arm-canvas]');
  const stage = canvas?.closest<HTMLElement>('.hero');
  if (!canvas || !stage) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return; // No WebGL: the hero reads fine without the arm.
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // A three-quarter view from above, so the arm's depth shows as it turns.
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const look = new THREE.Vector3(0, 3.2, 0);
  const eye = new THREE.Vector3(7.5, 8.2, 14.5);

  // A key from above and in front, throwing the shadow back behind the base, and a soft fill.
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(3, 14, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -14;
  key.shadow.camera.right = key.shadow.camera.top = 14;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#8CB4FF', 1.2);
  rim.position.set(6, 4, -8);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#ffffff', '#d8d4cc', 0.6));

  const shell = new THREE.MeshPhysicalMaterial({ color: '#E9E8E4', roughness: 0.32, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: '#2B2E35', roughness: 0.35, metalness: 0.85 });
  const cobalt = new THREE.MeshStandardMaterial({ color: '#2F5BEA', roughness: 0.3, metalness: 0.4 });

  // The floor is the page: only the shadow on it shows.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- The arm, from the floor up ------------------------------------------

  const root = new THREE.Group();
  scene.add(root);

  // The pedestal: a flange on the floor and stacked drums.
  root.add(ring(1.45, 0.08, 0.04, metal));
  root.add(ring(0.95, 0.42, 0.29, shell));
  root.add(ring(0.8, 0.1, 0.55, cobalt));
  root.add(ring(0.72, 0.4, 0.8, shell));

  // The turntable, which faces the arm toward what it reaches for.
  const yaw = new THREE.Group();
  yaw.position.y = 1.0;
  root.add(yaw);
  yaw.add(ring(0.62, 0.12, 0.06, metal));
  yaw.add(ring(0.58, 0.45, 0.35, shell));
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 1.1, 40), shell);
  riser.position.y = 1.0;
  yaw.add(riser);

  const shoulder = new THREE.Group();
  shoulder.position.y = SHOULDER_Y - 1.0;
  yaw.add(shoulder);
  shoulder.add(hub(0.72, 1.05, shell, cobalt));
  shoulder.add(link(0.36, UPPER, shell, 0.9));
  shoulder.add(ring(0.38, 0.08, 0.75, metal));

  const elbow = new THREE.Group();
  elbow.position.y = UPPER;
  shoulder.add(elbow);
  elbow.add(hub(0.56, 0.95, shell, cobalt));
  elbow.add(link(0.29, FORE, shell, 0.85));
  // Ribbed sleeves toward the wrist.
  for (let i = 0; i < 3; i++) elbow.add(ring(0.31 - i * 0.015, 0.14, FORE * 0.6 + i * 0.25, metal));

  const wrist = new THREE.Group();
  wrist.position.y = FORE;
  elbow.add(wrist);
  wrist.add(hub(0.38, 0.75, shell, cobalt));
  wrist.add(link(0.22, 0.5, metal));
  wrist.add(ring(0.26, 0.1, 0.3, cobalt));
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.36), metal);
  palm.position.y = 0.6;
  wrist.add(palm);

  // The claw: two fingers that swing apart and together.
  const fingers = [1, -1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.17, 0.66, 0);
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.22), metal);
    finger.position.y = 0.25;
    pivot.add(finger);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.22), cobalt);
    tip.position.set(-side * 0.04, 0.5, 0);
    tip.rotation.z = side * 0.5;
    pivot.add(tip);
    wrist.add(pivot);
    return { pivot, side };
  });

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  // --- Where the claw is reaching ------------------------------------------

  const goal = new THREE.Vector3(-2.5, 4.6, 2.5);
  const aim = goal.clone();
  const ray = new THREE.Raycaster();
  // An upright plane through the base, square to the viewer.
  const plane = new THREE.Plane();
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  let lastMove = -Infinity;
  // How far open the claw is, 0 to 1, and whether the pointer is holding it open.
  let openness = 0;
  let pressing = false;

  const clock = new THREE.Clock();

  const follow = (x: number, y: number) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return;
    goal.set(hit.x, Math.max(hit.y, 0.4), hit.z);
    lastMove = clock.getElapsedTime();
  };

  window.addEventListener('pointermove', (e) => follow(e.clientX, e.clientY), { passive: true });
  stage.addEventListener('pointerdown', (e) => {
    follow(e.clientX, e.clientY);
    pressing = true;
  });
  window.addEventListener('pointerup', () => (pressing = false));
  window.addEventListener('pointercancel', () => (pressing = false));

  // --- Solving the joints ---------------------------------------------------

  const angles = { yaw: 2.4, shoulder: -0.5, elbow: -1.4, wrist: -0.9 };
  const tmp = new THREE.Vector2();

  /** The joint angles that put the claw's tips on `p`, the hand drooping by `droop`. */
  const solve = (p: THREE.Vector3, droop = 0.6) => {
    // Turn to face the target; the arm then works in its own upright plane,
    // reaching out along the turntable's +X.
    const yawTo = Math.atan2(-p.z, p.x);
    const out = Math.max(Math.hypot(p.x, p.z), 0.3);
    const up = p.y - SHOULDER_Y;
    const toward = Math.atan2(up, out);
    // The claw droops toward the floor, as a hand reaching out does.
    const hand = toward - droop * Math.cos(toward);
    // Back off from the target by the hand to find the wrist.
    tmp.set(out - Math.cos(hand) * HAND, up - Math.sin(hand) * HAND);
    const reach = THREE.MathUtils.clamp(tmp.length(), Math.abs(UPPER - FORE) + 0.2, UPPER + FORE - 0.02);
    const toWrist = Math.atan2(tmp.y, tmp.x);
    // Law of cosines for the bend at the shoulder, with the elbow kept up.
    const bend = Math.acos(THREE.MathUtils.clamp((UPPER ** 2 + reach ** 2 - FORE ** 2) / (2 * UPPER * reach), -1, 1));
    const a1 = toWrist + bend;
    const ex = Math.cos(a1) * UPPER, ey = Math.sin(a1) * UPPER;
    const a2 = Math.atan2(Math.sin(toWrist) * reach - ey, Math.cos(toWrist) * reach - ex);
    // Links lie along +Y, so a link pointing along `a` is turned by a - 90°.
    return {
      yaw: yawTo,
      shoulder: a1 - Math.PI / 2,
      elbow: turn(a1, a2),
      wrist: turn(a2, hand),
    };
  };

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    // On wide screens the canvas runs under the statement so the arm can
    // reach across it, but the arm stands in a stage at the right: the view
    // is centred on that stage and the canvas shows its left side extended.
    const stacked = matchMedia('(max-width: 860px)').matches;
    const stageWidth = stacked ? width : Math.min(width * 0.5, 700);
    const centre = width - stageWidth / 2;
    camera.aspect = (centre * 2) / height;
    camera.setViewOffset(centre * 2, height, 0, 0, width, height);
    // A narrow stage stands further back, so the arm and its reach still fit.
    const ratio = stageWidth / height;
    const back = ratio < 0.9 ? 1 / Math.max(ratio / 0.9, 0.6) : 1;
    camera.position.copy(eye).sub(look).multiplyScalar(back).add(look);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    // Keep the pointer's plane square to the view.
    const facing = new THREE.Vector3().subVectors(camera.position, look).setY(0).normalize();
    plane.setFromNormalAndCoplanarPoint(facing, new THREE.Vector3());
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // The view's direction across the floor, and across the screen.
  const facing = new THREE.Vector3().subVectors(eye, look).setY(0).normalize();
  const across = new THREE.Vector3(facing.z, 0, -facing.x);
  const up = new THREE.Vector3(0, 1, 0);

  // --- The paper ------------------------------------------------------------

  // It lies to the left of the base, a little toward the viewer, its top
  // edge toward the arm; it is shown up and to the left, toward the words.
  // On small screens, where the arm stands alone, both are nearer to it.
  const small = matchMedia('(max-width: 860px)').matches;
  const { paper, height: sheetHeight } = createPaper(small ? 1.9 : 2.3);
  scene.add(paper);

  const restAt = across.clone().multiplyScalar(small ? -2.3 : -3.0).addScaledVector(facing, 0.7).setY(0.015);
  const toBase = restAt.clone().setY(0).negate().normalize();
  const flat = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(toBase, up), toBase, up),
  );
  const upright = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, up, facing));
  paper.position.copy(restAt);
  paper.quaternion.copy(flat);

  // Where the claw goes: the sheet's top edge, a little above it, and the
  // place it holds the sheet up to be read.
  const edgeAt = restAt.clone().addScaledVector(toBase, sheetHeight / 2).setY(0.05);
  const overEdge = edgeAt.clone().setY(1.3);
  const showAt = across.clone().multiplyScalar(small ? -0.8 : -1.5).addScaledVector(facing, 2.2).setY(small ? 5.4 : 4.9);

  /** Which step of showing the paper it is in at `t`, and how far through, if any. */
  const showing = (t: number): { step: Step; k: number } | null => {
    if (reducedMotion) return null;
    let s = t - SHOW_AT;
    if (s < 0) return null;
    for (const [step, length] of STEPS) {
      if (s < length) return { step, k: s / length };
      s -= length;
    }
    return null;
  };

  const tip = new THREE.Vector3();
  const hang = new THREE.Vector3();
  const sway = new THREE.Quaternion();
  const swayAxis = new THREE.Euler();

  /** Puts the sheet where the step has it: on the floor, or hanging from the claw. */
  const carry = (show: { step: Step; k: number } | null, t: number) => {
    const step = show?.step;
    if (!step || step === 'reach' || step === 'dip' || step === 'pinch' || step === 'release') {
      paper.position.copy(restAt);
      paper.quaternion.copy(flat);
      return;
    }
    const k = THREE.MathUtils.smoothstep(show.k, 0, 1);
    // How it turns: flat to upright on the way up, back on the way down.
    if (step === 'lift') paper.quaternion.slerpQuaternions(flat, upright, k);
    else if (step === 'turn') paper.quaternion.slerpQuaternions(upright, flat, k);
    else if (step === 'lower') paper.quaternion.copy(flat);
    else {
      // Held up, it sways a little, as paper does.
      swayAxis.set(Math.sin(t * 1.1) * 0.05, Math.sin(t * 1.6) * 0.08, Math.sin(t * 0.9) * 0.03);
      paper.quaternion.copy(upright).multiply(sway.setFromEuler(swayAxis));
    }
    // It hangs from its top edge, which is in the claw.
    wrist.updateWorldMatrix(true, false);
    wrist.localToWorld(tip.set(0, HAND, 0));
    hang.set(0, -sheetHeight / 2, 0).applyQuaternion(paper.quaternion).add(tip);
    // Leaving the floor and coming back to it, it eases from and to its place.
    if (step === 'lift') paper.position.lerpVectors(restAt, hang, Math.min(1, k * 1.6));
    else if (step === 'lower') paper.position.lerpVectors(hang, restAt, k);
    else paper.position.copy(hang);
  };

  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  }).observe(canvas);

  let last = 0;
  const draw = () => {
    const t = clock.getElapsedTime();
    const dt = Math.min(t - last, 0.05);
    last = t;

    // Left alone, it looks about: around itself, rising and dipping.
    if (!reducedMotion && t - lastMove > IDLE_AFTER && !showing(t)) {
      const a = 2.2 + Math.sin(t * 0.23) * 1.3;
      const r = 3.6 + Math.sin(t * 0.41) * 0.8;
      goal.set(Math.cos(a) * r, 4.4 + Math.sin(t * 0.67) * 1.1, -Math.sin(a) * r);
    }
    // While showing the paper, the steps say where the claw goes; otherwise
    // it goes to the pointer.
    const show = showing(t);
    const to =
      !show ? goal
      : show.step === 'reach' || show.step === 'turn' || show.step === 'release' ? overEdge
      : show.step === 'dip' || show.step === 'pinch' || show.step === 'lower' ? edgeAt
      : showAt;
    aim.lerp(to, 1 - Math.exp(-dt * (show ? 5 : 6)));

    const want = solve(aim);
    const ease = 1 - Math.exp(-dt * 7);
    angles.yaw += turn(angles.yaw, want.yaw) * (1 - Math.exp(-dt * 5));
    angles.shoulder += turn(angles.shoulder, want.shoulder) * ease;
    angles.elbow += turn(angles.elbow, want.elbow) * ease;
    angles.wrist += turn(angles.wrist, want.wrist) * ease;
    yaw.rotation.y = angles.yaw;
    shoulder.rotation.z = angles.shoulder;
    elbow.rotation.z = angles.elbow;
    wrist.rotation.z = angles.wrist;

    // Closed, the fingers meet, or pinch the paper; open, they spread.
    const opened =
      !show ? (pressing ? 1 : 0)
      : show.step === 'reach' || show.step === 'dip' || (show.step === 'release' && show.k < 0.6) ? 0.8
      : 0;
    openness += (opened - openness) * (1 - Math.exp(-dt * 14));
    const holding = !!show && show.step !== 'reach' && show.step !== 'dip' && show.step !== 'release';
    const shut = holding ? -0.08 : 0.04;
    // A positive turn tips a finger in toward the other.
    for (const { pivot, side } of fingers) pivot.rotation.z = side * (shut + (-0.5 - shut) * openness);

    carry(show, t);

    renderer.render(scene, camera);
  };


  draw();
  canvas.classList.add('is-drawn');

  const loop = () => {
    if (visible) draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
