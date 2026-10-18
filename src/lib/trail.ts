/**
 * The trail at the foot of the page (site/footer): a stream of light rising
 * out of the bottom edge, wide there and drawn in to a narrow stream as it
 * climbs, fading into the paper at the top. Its look is set by TRAIL_STYLE:
 *
 *   - 'aurora': the northern lights — soft teal, green and violet curtains,
 *     swaying gently, with soft rays and light rising slowly up them.
 *   - 'warp': a jump to hyperspace — a white-blue core, electric blue out
 *     to indigo at the flanks, with fast, short white streaks racing up it.
 *   - 'flare': fire rising — a white-yellow core through orange to deep
 *     red, its flames licking sideways, and flickering tongues racing up.
 *   - 'cobalt-flare' (Cobalt Flare): the same flames in blue — an icy white
 *     core through sky blue and cobalt to navy, with pale ice-blue tongues.
 *
 * Both flares move with the animation called Stream: the lanes ripple
 * sideways as they rise, like water, and flickering pale streaks race up
 * them, like light glinting off it.
 *
 * Drawn only while on screen; under reduced motion it is drawn once, still.
 */

export type TrailStyle = 'aurora' | 'warp' | 'flare' | 'cobalt-flare';
export const TRAIL_STYLE: TrailStyle = 'cobalt-flare';

// The flare's colours, for each flare style: core, inner, body and edge of
// the flame, then its tongues and glow.
const FLARE_COLOURS: Record<'flare' | 'cobalt-flare', number[][]> = {
  flare: [
    [1.0, 0.97, 0.82], [1.0, 0.78, 0.28], [1.0, 0.45, 0.1], [0.82, 0.14, 0.07],
    [1.0, 0.93, 0.7], [1.0, 0.45, 0.18],
  ],
  'cobalt-flare': [
    [0.94, 0.97, 1.0], [0.55, 0.75, 1.0], [0.16, 0.4, 0.96], [0.08, 0.14, 0.48],
    [0.86, 0.93, 1.0], [0.35, 0.55, 1.0],
  ],
};

const VERTEX = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
uniform vec2 u_size;
uniform float u_time;
// 0: aurora, 1: warp, 2: flare (either colouring).
// The flare's colours (FLARE_COLOURS).
uniform vec3 u_flare[6];
uniform float u_style;

// Lanes of streaks across each half of the stream (warp).
const float LANES = 90.0;

float hash(float n) {
  return fract(sin(n * 91.3458) * 47453.5453);
}


// Light rushing up a lane: a bright head with a tail fading below it.
// p runs 0 to 1 up each repeat; len is how much of it the tail fills.
float streakAt(float p, float len) {
  return smoothstep(1.0 - len, 1.0, p) * (1.0 - smoothstep(0.985, 1.0, p));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  float aspect = u_size.x / u_size.y;
  // x across the page, centred; y up from the bottom edge; one unit is the
  // canvas height either way.
  float x = (uv.x - 0.5) * aspect;
  float y = uv.y;
  float t = u_time;
  float px = 1.0 / u_size.y;

  // Half-width of the stream at this height: flared at the foot, narrow above.
  float spread = 0.17 * aspect + 0.62 * aspect * pow(1.0 - y, 2.6);
  float s = abs(x) / spread;
  float ds = px / spread;
  // How far up the stream, roughly along its curve (in canvas heights).
  float along = y + s * (0.79 * aspect - spread);

  vec3 col;
  vec3 glow;
  // How far across, for the edge: the flare's own flames move it.
  float edge = s;
  if (u_style > 1.5) {
    // --- Flare, in either colouring (FLARE_COLOURS), moving with Stream:
    // the lanes ripple sideways as they rise, like water, and flickering
    // pale streaks race up them, like light glinting off it.
    float sw = s + 0.025 * sin(along * 7.0 - t * 2.6 + s * 9.0)
                 + 0.012 * sin(along * 19.0 - t * 4.3 + s * 21.0);
    edge = sw;
    col = mix(u_flare[0], u_flare[1], smoothstep(0.0, 0.3, sw));
    col = mix(col, u_flare[2], smoothstep(0.3, 0.65, sw));
    col = mix(col, u_flare[3], smoothstep(0.65, 1.0, sw));
    // Flickering tongues of brighter flame racing up.
    float lane = floor(sw * 40.0);
    float laneU = fract(sw * 40.0);
    float id = lane + (x < 0.0 ? 0.0 : 500.0);
    float speed = 0.8 + 1.4 * hash(id * 1.3);
    float freq = 0.9 + 1.2 * hash(id + 5.0);
    float len = 0.3 + 0.4 * hash(id + 11.0);
    float p = fract(along * freq - t * speed + hash(id + 17.0));
    float flicker = 0.75 + 0.25 * sin(t * 13.0 + id * 2.1);
    float streak = streakAt(p, len) * pow(sin(laneU * 3.14159), 1.2) * flicker;
    col = mix(col, u_flare[4], streak * 0.85);
    glow = u_flare[5];
  } else if (u_style < 0.5) {
    // --- Aurora: curtains whose colour drifts slowly from teal to green to
    // violet; soft rays through them, swaying, and light rising slowly up.
    vec3 teal = vec3(0.12, 0.78, 0.68);
    vec3 green = vec3(0.38, 0.93, 0.52);
    vec3 violet = vec3(0.56, 0.38, 0.95);
    float drift = s * 1.6 + along * 0.6 - t * 0.08;
    col = mix(teal, green, 0.5 + 0.5 * sin(drift * 4.0));
    col = mix(col, violet, smoothstep(0.3, 0.9, 0.5 + 0.5 * sin(drift * 2.3 + 1.7)));
    float sway = s + 0.03 * sin(along * 5.0 - t * 0.7);
    float rays = pow(0.5 + 0.5 * sin(sway * 38.0 + sin(sway * 7.0) * 2.0), 2.5);
    float rise = 0.5 + 0.5 * sin(along * 6.0 - t * 1.1 + sway * 9.0);
    col = mix(col * 0.82, mix(col, vec3(1.0), 0.55), rays * (0.45 + 0.55 * rise));
    col = mix(col, vec3(1.0), exp(-s * s * 6.0) * 0.35);
    glow = mix(teal, violet, 0.4);
  } else {
    // --- Warp: white-blue at the core, electric blue, out to indigo at the
    // flanks; many thin lanes, each streaking fast with short white dashes.
    col = mix(vec3(0.86, 0.91, 1.0), vec3(0.22, 0.38, 1.0), smoothstep(0.0, 0.45, s));
    col = mix(col, vec3(0.27, 0.16, 0.62), smoothstep(0.5, 1.0, s));
    float lane = floor(s * LANES);
    float laneU = fract(s * LANES);
    float id = lane + (x < 0.0 ? 0.0 : 500.0);
    float speed = 2.0 + 2.5 * hash(id * 1.7);
    float freq = 1.2 + 1.8 * hash(id + 5.0);
    float len = 0.08 + 0.22 * hash(id + 11.0);
    float p = fract(along * freq - t * speed + hash(id + 17.0));
    float streak = streakAt(p, len) * pow(sin(laneU * 3.14159), 2.0);
    col *= 0.9 + 0.1 * hash(id + 3.0);
    col = mix(col, vec3(1.0), streak);
    glow = vec3(0.45, 0.55, 1.0);
  }

  // The edge, with a glow past it, and a fade out at the top, where the
  // stream meets the page.
  float top = 1.0 - smoothstep(0.62, 1.0, y);
  float inside = 1.0 - smoothstep(1.0 - ds * 1.5, 1.0 + ds * 1.5, edge);
  float halo = (1.0 - smoothstep(1.0, 1.16, edge)) * 0.4 * (1.0 - inside);
  // Clear wherever it is only the page; colour premultiplied.
  float a2 = inside * top;
  float a1 = halo * top * (1.0 - a2);
  gl_FragColor = vec4(col * a2 + glow * a1, a2 + a1);
}
`;

export function initTrail(reducedMotion: boolean) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-trail-canvas]');
  const gl = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: true });
  if (!canvas || !gl) {
    canvas?.closest<HTMLElement>('.footer__trail')?.remove();
    return;
  }

  const program = link(gl, VERTEX, FRAGMENT);
  if (!program) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uSize = gl.getUniformLocation(program, 'u_size');
  const uTime = gl.getUniformLocation(program, 'u_time');
  gl.uniform1f(gl.getUniformLocation(program, 'u_style'), TRAIL_STYLE === 'aurora' ? 0 : TRAIL_STYLE === 'warp' ? 1 : 2);
  if (TRAIL_STYLE === 'flare' || TRAIL_STYLE === 'cobalt-flare') {
    gl.uniform3fv(gl.getUniformLocation(program, 'u_flare'), FLARE_COLOURS[TRAIL_STYLE].flat());
  }

  let frame = 0;
  let onScreen = false;
  let visible = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uSize, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    gl.uniform1f(uTime, reducedMotion ? 0 : now / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const loop = (now: number) => {
    draw(now);
    frame = visible ? requestAnimationFrame(loop) : 0;
  };
  const play = () => {
    if (!frame && visible && !reducedMotion) frame = requestAnimationFrame(loop);
  };

  resize();
  draw(0);
  canvas.classList.add('is-drawn');

  new ResizeObserver(() => {
    resize();
    draw(performance.now());
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    onScreen = !!entry?.isIntersecting;
    visible = onScreen && !document.hidden;
    play();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    visible = onScreen && !document.hidden;
    play();
  });
}

function link(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return null;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}
