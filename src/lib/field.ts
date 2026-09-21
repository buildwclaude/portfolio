import vertexSource from '../shaders/field.vert?raw';
import fragmentSource from '../shaders/field.frag?raw';

/**
 * The one WebGL experience on the site.
 *
 * A full-screen isoline field behind the layout. It is deliberately
 * boring to run: a single triangle, no buffers, no textures, three
 * octaves of noise, 30fps, and a hard stop whenever it is not needed.
 *
 * The site is designed to look complete without it — if anything here
 * fails, the layer simply never appears.
 */

/* Quality is measured, not assumed: if frames start costing more than this,
   the field renders fewer pixels rather than dropping frames. */
const SLOW_FRAME_MS = 20;
const SAMPLE_FRAMES = 60;
const MIN_SCALE = 0.55;

type Uniforms = {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  scroll: WebGLUniformLocation | null;
  intensity: WebGLUniformLocation | null;
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[field] shader failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vert = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[field] link failed:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

export function initField(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }) {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });

  // No WebGL2 — leave the paper plain. Nothing else depends on this layer.
  if (!context) return;
  const gl: WebGL2RenderingContext = context;

  const program = createProgram(gl);
  if (!program) return;

  const uniforms: Uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    time: gl.getUniformLocation(program, 'uTime'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
    scroll: gl.getUniformLocation(program, 'uScroll'),
    intensity: gl.getUniformLocation(program, 'uIntensity'),
  };

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied
  gl.clearColor(0, 0, 0, 0);

  /* --- Quality ---------------------------------------------------------
     Small screens and weak devices get a single static frame instead of
     an animation loop: the texture is still there, the cost is not. */
  const coarse = matchMedia('(pointer: coarse)').matches;
  const smallViewport = matchMedia('(max-width: 760px)').matches;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  const still = opts.reducedMotion || smallViewport || fewCores || saveData;
  const maxDpr = smallViewport || coarse ? 1 : 1.5;
  let renderScale = 1;

  let width = 0;
  let height = 0;
  let cssWidth = 1;
  let cssHeight = 1;

  const pointer = { x: 0.35, y: 0.1, tx: 0.35, ty: 0.1 };
  let scroll = 0;
  let intensity = 0;
  let start = performance.now();
  let last = 0;
  let frame = 0;
  let running = false;
  let needsResize = true;
  let sampled = 0;
  let sampledMs = 0;
  let degraded = false;

  function resize() {
    needsResize = false;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * renderScale;
    cssWidth = Math.max(1, canvas.clientWidth);
    cssHeight = Math.max(1, canvas.clientHeight);
    const w = Math.round(cssWidth * dpr);
    const h = Math.round(cssHeight * dpr);
    if (w === width && h === height) return false;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    return true;
  }

  /**
   * Exponential smoothing that does not change speed with frame rate —
   * the same easing at 60fps, 120fps and on a struggling laptop.
   */
  function approach(current: number, target: number, rate: number, dt: number) {
    return current + (target - current) * (1 - Math.exp(-rate * dt));
  }

  function draw(now: number, dt: number) {
    const elapsed = (now - start) / 1000;

    // Scroll eases the field down and brings it very slightly forward.
    const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    const targetIntensity = 0.07 + progress * 0.035;

    if (still) {
      scroll = window.scrollY * 0.00022;
      intensity = targetIntensity;
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    } else {
      scroll = approach(scroll, window.scrollY * 0.00022, 5, dt);
      intensity = approach(intensity, targetIntensity, 3, dt);
      pointer.x = approach(pointer.x, pointer.tx, 2.6, dt);
      pointer.y = approach(pointer.y, pointer.ty, 2.6, dt);
    }

    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.time, still ? 12.0 : elapsed);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.uniform1f(uniforms.scroll, scroll);
    gl.uniform1f(uniforms.intensity, intensity);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now: number) {
    frame = requestAnimationFrame(loop);

    // Clamped so a backgrounded tab or a long task cannot jump the field.
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (needsResize) resize();
    draw(now, dt);
    measure(dt);
  }

  /**
   * Watches the frame interval rather than our own cost: the work here is
   * the GPU's, and a slow GPU shows up as time between frames. Resolution
   * goes before frames do, and a still field goes before a stuttering one.
   */
  function measure(dt: number) {
    sampledMs += dt * 1000;
    if (++sampled < SAMPLE_FRAMES) return;

    const average = sampledMs / sampled;
    sampled = 0;
    sampledMs = 0;
    if (average <= SLOW_FRAME_MS) return;

    if (renderScale > MIN_SCALE) {
      renderScale = Math.max(MIN_SCALE, renderScale - 0.25);
      needsResize = true;
    } else {
      degraded = true;
      pause();
    }
  }

  function play() {
    if (running || still || degraded) return;
    running = true;
    start = performance.now() - 12000; // resume mid-field, never from flat
    last = performance.now();
    frame = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(frame);
  }

  /* --- Static path ----------------------------------------------------- */
  function renderStill() {
    resize();
    intensity = 0.085;
    draw(performance.now(), 0);
  }

  /* --- Wiring ---------------------------------------------------------- */
  // A ResizeObserver keeps the animation loop free of layout reads.
  const observer = new ResizeObserver(() => {
    needsResize = true;
    if (still) {
      if (resize()) draw(performance.now(), 0);
    }
  });
  observer.observe(canvas);

  const onPointerMove = (event: PointerEvent) => {
    if (still) return;
    const aspect = cssWidth / cssHeight;
    pointer.tx = (event.clientX / cssWidth - 0.5) * 2.1 * aspect;
    pointer.ty = (0.5 - event.clientY / cssHeight) * 2.1;
  };

  const onVisibility = () => (document.hidden ? pause() : play());

  document.addEventListener('visibilitychange', onVisibility);
  if (!still) window.addEventListener('pointermove', onPointerMove, { passive: true });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    pause();
  });

  if (still) {
    // Wait for layout, then paint once and stop.
    requestAnimationFrame(renderStill);
  } else {
    play();
  }
}
