import vertexSource from '../shaders/media.vert?raw';
import fragmentSource from '../shaders/media.frag?raw';

/**
 * Project media, rendered through WebGL so it can respond to scroll.
 *
 * One small context per featured frame — the canvas *is* the element, so
 * unlike a full-screen layer there is no DOM to follow, nothing to keep in
 * sync with the layout, and no stacking to reason about. The existing GSAP
 * parallax moves the wrapper, and the canvas rides along inside it.
 *
 * It renders only while it is moving. Once the scroll settles and the image
 * resolves, the loop stops and the last frame stays on screen, so reading
 * costs nothing.
 *
 * The <img> stays in the DOM underneath: it is the texture source, and it is
 * what a visitor sees if any of this does not apply.
 */

const MAX_DPR = 1.75;
/** Below this the image is sharp and there is nothing left to draw. */
const SETTLED = 0.0006;

const damp = (current: number, target: number, lambda: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * delta));

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[media] shader failed:', gl.getShaderInfoLog(shader));
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
    console.warn('[media] link failed:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

class MediaPlane {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private uCover: WebGLUniformLocation | null;
  private uVelocity: WebGLUniformLocation | null;

  private width = 0;
  private height = 0;
  private velocity = 0;
  private target = 0;
  private visible = false;
  private frame = 0;
  private last = 0;
  private needsResize = true;
  private dead = false;

  constructor(
    private frameEl: HTMLElement,
    private image: HTMLImageElement,
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
  ) {
    this.gl = gl;
    this.canvas = gl.canvas as HTMLCanvasElement;

    gl.useProgram(program);
    this.uCover = gl.getUniformLocation(program, 'uCover');
    this.uVelocity = gl.getUniformLocation(program, 'uVelocity');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);

    const observer = new ResizeObserver(() => {
      this.needsResize = true;
      this.wake();
    });
    observer.observe(this.canvas);

    new IntersectionObserver(
      ([entry]) => {
        this.visible = entry?.isIntersecting ?? false;
        if (this.visible) this.wake();
      },
      { rootMargin: '10% 0px' },
    ).observe(frameEl);

    this.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.dead = true;
      cancelAnimationFrame(this.frame);
      // Hand the frame back to the <img> underneath, exactly as it was.
      this.frameEl.removeAttribute('data-gl');
      this.canvas.remove();
    });

    this.resize();
    this.draw();
    frameEl.setAttribute('data-gl', '');
  }

  /**
   * Cover fit, measured off the canvas itself rather than the frame — the
   * canvas sits inside the parallax wrapper, which is deliberately taller
   * than the frame, so the frame's box would be the wrong one.
   */
  private resize() {
    this.needsResize = false;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cssWidth = Math.max(1, this.canvas.clientWidth);
    const cssHeight = Math.max(1, this.canvas.clientHeight);
    const w = Math.round(cssWidth * dpr);
    const h = Math.round(cssHeight * dpr);
    if (w === this.width && h === this.height) return;

    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);

    const planeAspect = cssWidth / cssHeight;
    const texAspect = this.image.naturalWidth / Math.max(this.image.naturalHeight, 1);
    const cover =
      planeAspect > texAspect
        ? [1, texAspect / planeAspect]
        : [planeAspect / texAspect, 1];
    this.gl.uniform2f(this.uCover, cover[0] ?? 1, cover[1] ?? 1);
  }

  private draw() {
    this.gl.uniform1f(this.uVelocity, this.velocity);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private loop = (now: number) => {
    const delta = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;

    /* The target bleeds toward zero on its own and the uniform chases it —
       two stages, so a flick blooms and releases instead of snapping. */
    this.target = damp(this.target, 0, 3.6, delta);
    this.velocity = damp(this.velocity, this.target, 7.5, delta);

    if (this.needsResize) this.resize();
    this.draw();

    if (Math.abs(this.velocity) < SETTLED) {
      // One last sharp frame, then stop until something moves again.
      this.velocity = 0;
      this.target = 0;
      this.draw();
      this.frame = 0;
      return;
    }
    this.frame = requestAnimationFrame(this.loop);
  };

  private wake() {
    if (this.frame || this.dead || document.hidden || !this.visible) return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  setVelocity(value: number) {
    if (this.dead) return;
    if (Math.abs(value) > Math.abs(this.target)) this.target = value;
    this.wake();
  }
}

/**
 * Attaches a plane to every featured project frame that has a loaded image.
 * Returns a velocity sink for the scroll layer to feed, or null when nothing
 * could be set up — in which case the plain images simply stay as they are.
 */
export async function initMediaGl(root: ParentNode = document) {
  const frames = Array.from(root.querySelectorAll<HTMLElement>('.piece__media'));
  if (frames.length === 0) return null;

  const planes: MediaPlane[] = [];

  for (const frameEl of frames) {
    const image = frameEl.querySelector('img');
    if (!image) continue;

    try {
      if (!image.complete) await image.decode();
    } catch {
      continue; // a broken image is not worth a GL context
    }
    if (!image.naturalWidth) continue;

    const canvas = document.createElement('canvas');
    canvas.className = 'piece__gl';
    canvas.setAttribute('aria-hidden', 'true');

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return null;

    const program = createProgram(gl);
    if (!program) return null;

    (image.parentElement ?? frameEl).appendChild(canvas);
    planes.push(new MediaPlane(frameEl, image, gl, program));
  }

  if (planes.length === 0) return null;

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) for (const plane of planes) plane.setVelocity(0);
  });

  return {
    setVelocity(value: number) {
      for (const plane of planes) plane.setVelocity(value);
    },
  };
}
