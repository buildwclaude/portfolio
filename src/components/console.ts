import * as THREE from 'three';

/**
 * The hero's console, drawn like the shelf: a technical line drawing in the
 * page's own ink and paper. A monitor plays a little side-scroller, a
 * vented console slab sits in front of it, and a gamepad lies cabled to
 * the slab. The pad's button lights whenever the runner on screen jumps,
 * and the slab's power light breathes.
 *
 * Faces are flat paper; hidden edges are dashed and faint, drawn through
 * them; visible edges are ink on top. The game is a 2D canvas drawn in the
 * same ink, used as the screen's texture. The loop only runs while the hero
 * is on screen; with reduced motion it draws one still frame.
 */
const FOV = 26;
/** The runner is the avatar doodle, so the game is plainly mine. */
const RUNNER_SRC = `${import.meta.env.BASE_URL}avatar.png`;

type Palette = { paper: THREE.Color; ink: THREE.Color; faint: THREE.Color; accent: THREE.Color; pen: THREE.Color };

export function createConsole(host: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(6.2, 4.4, 11.5);
  const target = new THREE.Vector3(-0.7, 1.8, 0.2);
  camera.lookAt(target);

  /* ------------------------------------------------------------------ ink */
  const inkLine = new THREE.LineBasicMaterial();
  const hiddenLine = new THREE.LineDashedMaterial({ dashSize: 0.06, gapSize: 0.06, depthTest: false });
  const ruleLine = new THREE.LineBasicMaterial();
  const paper = new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const lit = new THREE.MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const led = new THREE.MeshBasicMaterial();
  const pal: Palette = {
    paper: new THREE.Color(),
    ink: new THREE.Color(),
    faint: new THREE.Color(),
    accent: new THREE.Color(),
    pen: new THREE.Color(),
  };

  function readPalette() {
    const css = getComputedStyle(document.documentElement);
    const token = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    pal.paper.set(token('--paper', '#F3F1E9'));
    pal.ink.set(token('--ink', '#111111'));
    pal.accent.set(token('--accent', '#d94f38'));
    pal.pen.set(document.documentElement.dataset.theme === 'dark' ? '#8f94ff' : '#3d42c8');
    pal.faint.copy(pal.paper).lerp(pal.ink, 0.25);
    inkLine.color.copy(pal.ink);
    hiddenLine.color.copy(pal.faint);
    ruleLine.color.copy(pal.paper).lerp(pal.ink, 0.14);
    paper.color.copy(pal.paper);
    lit.color.copy(pal.paper);
    led.color.copy(pal.accent);
    drawGame(true);
    if (!running) draw();
  }

  /** A solid in the drawing's manner: paper faces, dashed hidden edges, ink outline. */
  function drafted(geometry: THREE.BufferGeometry, fill: THREE.Material = paper, crease = 24) {
    const mesh = new THREE.Mesh(geometry, fill);
    const outline = new THREE.EdgesGeometry(geometry, crease);
    const hidden = new THREE.LineSegments(outline, hiddenLine);
    hidden.computeLineDistances();
    hidden.renderOrder = 1;
    const edges = new THREE.LineSegments(outline, inkLine);
    edges.renderOrder = 2;
    mesh.add(hidden, edges);
    return mesh;
  }

  const rig = new THREE.Group();
  scene.add(rig);

  /* -------------------------------------------------------------- floor */
  // A faint square of ruled floor under everything, like a drawing's ground line.
  {
    const pts: THREE.Vector3[] = [];
    const n = 8;
    const half = 2.8;
    for (let i = 0; i <= n; i++) {
      const k = -half + (i / n) * 2 * half;
      pts.push(new THREE.Vector3(k, 0, -half), new THREE.Vector3(k, 0, half));
      pts.push(new THREE.Vector3(-half, 0, k), new THREE.Vector3(half, 0, k));
    }
    const floor = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), ruleLine);
    floor.position.set(0, 0, 0.4);
    rig.add(floor);
  }

  /* ------------------------------------------------------------ monitor */
  const GAME_W = 480;
  const GAME_H = 300;
  const gameCanvas = document.createElement('canvas');
  gameCanvas.width = GAME_W;
  gameCanvas.height = GAME_H;
  const gtx = gameCanvas.getContext('2d')!;
  const screenTex = new THREE.CanvasTexture(gameCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const monitor = new THREE.Group();
  monitor.position.set(-0.5, 0, -1.1);
  rig.add(monitor);
  {
    const W = 3.6;
    const H = 2.35;
    const D = 0.32;
    const body = drafted(new THREE.BoxGeometry(W, H, D));
    body.position.y = 1.55 + H / 2;
    monitor.add(body);
    // The bezel's inner frame, drawn as a slightly smaller box just proud of the face.
    const bezel = drafted(new THREE.BoxGeometry(W - 0.28, H - 0.28, 0.02));
    bezel.position.set(0, body.position.y, D / 2 + 0.011);
    monitor.add(bezel);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 0.42, (W - 0.42) * (GAME_H / GAME_W)),
      new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
    );
    screen.position.set(0, body.position.y + 0.02, D / 2 + 0.026);
    // Over the dashed lines of whatever is behind it.
    screen.renderOrder = 1.5;
    monitor.add(screen);
    // Neck and foot.
    const neck = drafted(new THREE.BoxGeometry(0.34, 1.2, 0.22));
    neck.position.set(0, 0.95, -0.02);
    monitor.add(neck);
    const foot = drafted(new THREE.BoxGeometry(1.7, 0.1, 1.0));
    foot.position.set(0, 0.05, 0);
    monitor.add(foot);
  }

  /* --------------------------------------------------------- console slab */
  const slab = new THREE.Group();
  slab.position.set(-0.7, 0, 1.25);
  slab.rotation.y = 0.12;
  rig.add(slab);
  const SLAB = { w: 2.7, h: 0.34, d: 1.35 };
  {
    const body = drafted(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d));
    body.position.y = SLAB.h / 2;
    slab.add(body);
    // Vents: a run of shallow slots across the top.
    const vents: THREE.Vector3[] = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const x = -SLAB.w / 2 + 0.55 + (i / (n - 1)) * (SLAB.w - 1.1);
      vents.push(new THREE.Vector3(x, SLAB.h + 0.002, -SLAB.d / 2 + 0.22), new THREE.Vector3(x, SLAB.h + 0.002, SLAB.d / 2 - 0.3));
    }
    const ventLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(vents), inkLine);
    ventLines.renderOrder = 2;
    slab.add(ventLines);
    // A disc slot along the front, and the power light beside it.
    const slot = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.8, SLAB.h * 0.55, SLAB.d / 2 + 0.002),
        new THREE.Vector3(0.5, SLAB.h * 0.55, SLAB.d / 2 + 0.002),
      ]),
      inkLine,
    );
    slot.renderOrder = 2;
    slab.add(slot);
    const light = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), led);
    light.position.set(1.05, SLAB.h * 0.55, SLAB.d / 2 + 0.003);
    light.renderOrder = 2;
    slab.add(light);
  }

  /* ------------------------------------------------------------- gamepad */
  const pad = new THREE.Group();
  pad.position.set(1.75, 0, 1.9);
  pad.rotation.y = -0.45;
  rig.add(pad);
  const buttons: THREE.Mesh[] = [];
  {
    // The body: a rounded slab with two grips, extruded and bevelled.
    const s = new THREE.Shape();
    const w = 0.78;
    const h = 0.38;
    s.moveTo(-w + 0.25, h);
    s.lineTo(w - 0.25, h);
    s.quadraticCurveTo(w, h, w + 0.05, h - 0.3);
    s.quadraticCurveTo(w + 0.12, -h - 0.2, w - 0.12, -h - 0.28);
    s.quadraticCurveTo(w - 0.32, -h - 0.3, w - 0.42, -h + 0.02);
    s.lineTo(-w + 0.42, -h + 0.02);
    s.quadraticCurveTo(-w + 0.32, -h - 0.3, -w + 0.12, -h - 0.28);
    s.quadraticCurveTo(-w - 0.12, -h - 0.2, -w - 0.05, h - 0.3);
    s.quadraticCurveTo(-w, h, -w + 0.25, h);
    const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 16 });
    bodyGeo.rotateX(-Math.PI / 2);
    const body = drafted(bodyGeo, paper, 30);
    body.position.y = 0.04;
    pad.add(body);
    const top = 0.2;
    // D-pad on the left.
    for (const [x, z, bw, bd] of [
      [-0.5, 0, 0.26, 0.08],
      [-0.5, 0, 0.08, 0.26],
    ] as const) {
      const bar = drafted(new THREE.BoxGeometry(bw, 0.04, bd));
      bar.position.set(x, top + 0.02, z);
      pad.add(bar);
    }
    // Four face buttons on the right; these light up.
    for (const [x, z] of [
      [0.5, -0.11],
      [0.61, 0],
      [0.5, 0.11],
      [0.39, 0],
    ] as const) {
      const b = drafted(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 20), lit, 40);
      b.position.set(x, top + 0.025, z);
      pad.add(b);
      buttons.push(b);
    }
  }

  /* ---------------------------------------------------------------- cable */
  {
    const from = new THREE.Vector3(0.9, 0.12, 0.62).applyEuler(slab.rotation).add(slab.position);
    const to = new THREE.Vector3(0, 0.12, -0.42).applyEuler(pad.rotation).add(pad.position);
    const curve = new THREE.CatmullRomCurve3([
      from,
      new THREE.Vector3(from.x + 0.3, 0.02, from.z + 0.5),
      new THREE.Vector3(to.x - 0.6, 0.02, to.z + 0.25),
      new THREE.Vector3(to.x - 0.1, 0.03, to.z - 0.25),
      to,
    ]);
    const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), inkLine);
    cable.renderOrder = 2;
    rig.add(cable);
  }

  /* ================================================================ game */
  const runnerImg = new Image();
  runnerImg.src = RUNNER_SRC;
  runnerImg.onload = () => {
    drawGame(true);
    if (!running) draw();
  };

  const game = {
    x: 0, // distance travelled, px
    y: 0, // runner height above ground, px
    vy: 0,
    obstacles: [] as { x: number; w: number; h: number }[],
    next: 260,
    score: 0,
    jumpGlow: 0,
  };
  const GROUND = GAME_H - 58;
  const SPEED = 150; // px/s
  const RUNNER_X = 90;

  function stepGame(dt: number) {
    game.x += SPEED * dt;
    game.score += dt * 10;
    // Obstacles come in from the right.
    game.next -= SPEED * dt;
    if (game.next <= 0) {
      const h = 22 + Math.random() * 26;
      game.obstacles.push({ x: GAME_W + 20, w: 16 + Math.random() * 18, h });
      game.next = 170 + Math.random() * 190;
    }
    game.obstacles.forEach((o) => (o.x -= SPEED * dt));
    game.obstacles = game.obstacles.filter((o) => o.x + o.w > -10);
    // The runner jumps on its own when something is close.
    const ahead = game.obstacles.find((o) => o.x > RUNNER_X - 6 && o.x < RUNNER_X + 58);
    if (ahead && game.y === 0) {
      game.vy = 330;
      game.jumpGlow = 1;
    }
    game.vy -= 900 * dt;
    game.y = Math.max(0, game.y + game.vy * dt);
    if (game.y === 0) game.vy = 0;
    game.jumpGlow = Math.max(0, game.jumpGlow - dt * 2.2);
  }

  function drawGame(force = false) {
    if (!force && reduced) return;
    const c = gtx;
    const ink = `#${pal.ink.getHexString()}`;
    const faint = `#${pal.faint.getHexString()}`;
    const pen = `#${pal.pen.getHexString()}`;
    c.fillStyle = `#${pal.paper.getHexString()}`;
    c.fillRect(0, 0, GAME_W, GAME_H);

    // A drafting grid behind the level.
    c.strokeStyle = faint;
    c.globalAlpha = 0.35;
    c.lineWidth = 1;
    c.beginPath();
    const off = -(game.x * 0.2) % 24;
    for (let x = off; x < GAME_W; x += 24) {
      c.moveTo(x + 0.5, 0);
      c.lineTo(x + 0.5, GROUND);
    }
    for (let y = 12; y < GROUND; y += 24) {
      c.moveTo(0, y + 0.5);
      c.lineTo(GAME_W, y + 0.5);
    }
    c.stroke();
    c.globalAlpha = 1;

    // Far hills, a slow dashed skyline.
    c.strokeStyle = faint;
    c.setLineDash([6, 5]);
    c.beginPath();
    for (let x = 0; x <= GAME_W; x += 8) {
      const wx = x + game.x * 0.35;
      const y = GROUND - 60 - 24 * Math.sin(wx / 70) - 12 * Math.sin(wx / 23);
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.setLineDash([]);

    // Ground, with distance ticks.
    c.strokeStyle = ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, GROUND + 0.5);
    c.lineTo(GAME_W, GROUND + 0.5);
    c.stroke();
    c.lineWidth = 1;
    c.beginPath();
    const tick = -(game.x % 40);
    for (let x = tick; x < GAME_W; x += 40) {
      c.moveTo(x + 0.5, GROUND + 6);
      c.lineTo(x + 0.5, GROUND + 14);
    }
    c.stroke();

    // Obstacles: hatched blocks.
    c.lineWidth = 1.5;
    for (const o of game.obstacles) {
      c.strokeRect(o.x + 0.5, GROUND - o.h + 0.5, o.w, o.h);
      c.save();
      c.beginPath();
      c.rect(o.x, GROUND - o.h, o.w, o.h);
      c.clip();
      c.lineWidth = 1;
      c.beginPath();
      for (let k = -o.h; k < o.w; k += 6) {
        c.moveTo(o.x + k, GROUND);
        c.lineTo(o.x + k + o.h, GROUND - o.h);
      }
      c.stroke();
      c.restore();
    }

    // The runner: the avatar doodle, bobbing as it runs.
    const bob = game.y === 0 ? Math.abs(Math.sin(game.x / 14)) * 3 : 0;
    const size = 46;
    const ry = GROUND - size - game.y - bob;
    if (runnerImg.complete && runnerImg.naturalWidth) {
      c.drawImage(runnerImg, RUNNER_X - size / 2, ry, size, size * (runnerImg.naturalHeight / runnerImg.naturalWidth));
    } else {
      c.strokeStyle = pen;
      c.strokeRect(RUNNER_X - 12, ry + 10, 24, 30);
    }
    // Its shadow on the ground shrinks as it jumps.
    c.strokeStyle = faint;
    c.beginPath();
    const sw = 16 * (1 - Math.min(0.7, game.y / 120));
    c.ellipse(RUNNER_X, GROUND + 3, sw, 2.5, 0, 0, Math.PI * 2);
    c.stroke();

    // HUD, in the site's mono.
    c.fillStyle = ink;
    c.font = '600 13px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    c.textBaseline = 'top';
    c.fillText('LVL 1-1', 16, 14);
    const score = `SCORE ${String(Math.floor(game.score)).padStart(5, '0')}`;
    c.fillText(score, GAME_W - 16 - c.measureText(score).width, 14);
    c.fillStyle = pen;
    c.fillText('▶ SONY', 16, GAME_H - 34);

    screenTex.needsUpdate = true;
  }

  /* --------------------------------------------------------------- sizing */
  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Frame the whole set whatever the box's shape: widen the lens on tall boxes.
    const fit = 6.3;
    const dist = camera.position.distanceTo(target);
    const needH = fit / Math.min(1, camera.aspect / 1.05);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(needH / 2 / dist));
    camera.updateProjectionMatrix();
    if (!running) draw();
  }

  /* ---------------------------------------------------------------- loop */
  const lean = { x: 0, y: 0, tx: 0, ty: 0 };
  let running = false;
  let visible = true;
  let raf = 0;
  let clock = 0;

  function draw() {
    lean.x += (lean.tx - lean.x) * 0.05;
    lean.y += (lean.ty - lean.y) * 0.05;
    // A slow idle sway, and a lean toward the pointer.
    const sway = reduced ? 0 : Math.sin(clock * 0.35) * 0.06;
    rig.rotation.set(lean.y * 0.03, sway + lean.x * 0.12, 0);
    // The pad's buttons light as the runner jumps; the power light breathes.
    const glow = game.jumpGlow;
    lit.color.copy(pal.paper).lerp(pal.pen, glow);
    led.color.copy(pal.paper).lerp(pal.accent, reduced ? 1 : 0.55 + 0.45 * Math.sin(clock * 2.4));
    renderer.render(scene, camera);
  }

  let last = performance.now();
  function frame(now: number) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    stepGame(dt);
    drawGame();
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
  const themeWatch = new MutationObserver(readPalette);
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // A still frame to start from: a block or two already on the way.
  game.obstacles.push({ x: 250, w: 20, h: 30 }, { x: 420, w: 28, h: 44 });
  readPalette();
  resize();
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
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) o.geometry.dispose();
      });
      [inkLine, hiddenLine, ruleLine, paper, lit, led].forEach((m) => m.dispose());
      screenTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
