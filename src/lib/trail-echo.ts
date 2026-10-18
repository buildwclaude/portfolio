/**
 * The trail's echo (site/index): faint warp streaks rising up the page
 * behind everything, so the trail at the foot is felt before it is seen.
 *
 *   - The trail's own light, broken loose, in whichever look the trail has
 *     (lib/trail's TRAIL_STYLE): for the aurora, soft, slow rays of teal,
 *     green and violet; for the warp, short fast dashes of electric blue to
 *     indigo with a white-hot head; for the flare, tongues of orange to
 *     deep red with a yellow-white tip, or of cobalt to navy with an
 *     ice-blue tip for the Cobalt Flare. Rising, and strongest low in the
 *     window, as if thrown up from the trail below.
 *   - Only over the trail's own stream, where it narrows at its top — the
 *     middle third of the page — so they rise straight on from it.
 *   - Barely there at the top of the page; they gather and brighten as the
 *     page is scrolled toward the trail.
 *   - Scrolling quickens them for a moment.
 * Not drawn at all under reduced motion; paused while the tab is hidden.
 */

import { TRAIL_STYLE } from './trail';

// How the echo's light looks, for each of the trail's looks: lane width,
// speed, gap and length (in CSS pixels), how soft a ray is across, how
// strong, and its three colours (body, second body, head).
const LOOKS = {
  aurora: {
    lane: 8, speed: [120, 180], period: [380, 900], len: [70, 150], soft: 1.2, strength: 0.75,
    colours: ['0.12, 0.78, 0.68', '0.56, 0.38, 0.95', '0.86, 1.0, 0.93'],
  },
  warp: {
    lane: 5, speed: [480, 620], period: [260, 760], len: [18, 46], soft: 2.0, strength: 1.0,
    colours: ['0.22, 0.38, 1.0', '0.27, 0.16, 0.62', '0.92, 0.95, 1.0'],
  },
  flare: {
    lane: 6, speed: [300, 380], period: [300, 800], len: [30, 70], soft: 1.5, strength: 1.0,
    colours: ['1.0, 0.45, 0.1', '0.82, 0.14, 0.07', '1.0, 0.93, 0.7'],
  },
  'cobalt-flare': {
    lane: 6, speed: [300, 380], period: [300, 800], len: [30, 70], soft: 1.5, strength: 1.0,
    colours: ['0.16, 0.4, 0.96', '0.08, 0.14, 0.48', '0.86, 0.93, 1.0'],
  },
} as const;
const look = LOOKS[TRAIL_STYLE];
const f = (n: number) => n.toFixed(2);

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
uniform float u_progress;
uniform float u_dpr;

// A hash that stays even for whole-number inputs (a sine-based one returns
// exactly 0 for some lanes, which would slip past the density cut).
float hash(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float xn = frag.x / u_size.x;
  float yn = frag.y / u_size.y;
  float p = u_progress;

  // Lanes a few pixels wide across the page — about as fine as the trail's
  // own — and only some carry streaks.
  float laneW = ${f(look.lane)} * u_dpr;
  float lane = floor(frag.x / laneW);
  float laneU = fract(frag.x / laneW);

  // Only over the trail's own stream: where it narrows to at its top — the
  // middle third of the page (lib/trail: a half-width of 0.17 of the page
  // there) — thinning toward that stream's sides, so the streaks rise
  // straight on from it.
  float fromCentre = abs(xn - 0.5) / 0.17;
  float reach = 1.0 - smoothstep(0.55, 1.0, fromCentre);
  float density = (0.035 + 0.3 * p) * reach;
  if (density <= 0.0 || hash(lane * 1.37 + 4.0) > density) discard;

  // The trail's streaks, broken loose: short dashes at the trail's own pace
  // and size, in pixels, so they read as the same light.
  float speed = (${f(look.speed[0])} + ${f(look.speed[1])} * hash(lane + 9.0)) * u_dpr;
  float period = (${f(look.period[0])} + ${f(look.period[1])} * hash(lane + 21.0)) * u_dpr;
  float len = (${f(look.len[0])} + ${f(look.len[1])} * hash(lane + 33.0)) * u_dpr;
  float q = fract((frag.y - u_time * speed) / period + hash(lane + 47.0));
  // How far below the dash's head, in pixels.
  float behind = (1.0 - q) * period;
  float dash = pow(clamp(1.0 - behind / len, 0.0, 1.0), 1.3);
  float across = pow(sin(laneU * 3.14159), ${f(look.soft)});
  float streak = dash * across;
  if (streak < 0.003) discard;

  // The trail's colours, paler at the head.
  vec3 col = mix(vec3(${look.colours[0]}), vec3(${look.colours[1]}), hash(lane + 59.0));
  col = mix(col, vec3(${look.colours[2]}), smoothstep(0.55, 1.0, dash) * 0.85);
  // Thrown up from below: strongest low in the window, fading toward the top.
  float rise = 1.0 - 0.55 * yn;
  float alpha = streak * (0.3 + 0.55 * p) * rise * ${f(look.strength)};
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

export function initTrailEcho(reducedMotion: boolean) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-trail-echo]');
  if (!canvas) return;
  if (reducedMotion) {
    canvas.remove();
    return;
  }
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: true });
  if (!gl) {
    canvas.remove();
    return;
  }

  const program = link(gl, VERTEX, FRAGMENT);
  if (!program) {
    canvas.remove();
    return;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const uSize = gl.getUniformLocation(program, 'u_size');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uProgress = gl.getUniformLocation(program, 'u_progress');
  const uDpr = gl.getUniformLocation(program, 'u_dpr');
  gl.clearColor(0, 0, 0, 0);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uSize, canvas.width, canvas.height);
    gl.uniform1f(uDpr, dpr);
  };

  // How far down the page, 0 to 1, eased so the streaks stay sparse for
  // most of it and gather toward the end.
  const progress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const raw = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    return raw * raw;
  };

  // Scrolling quickens the streaks for a moment; the boost eases away.
  let lastY = window.scrollY;
  let boost = 0;
  window.addEventListener(
    'scroll',
    () => {
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      boost = Math.min(3, boost + dy / 120);
    },
    { passive: true },
  );

  let frame = 0;
  let clock = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    boost *= 0.92;
    clock += dt * (1 + boost);
    gl.uniform1f(uTime, clock);
    gl.uniform1f(uProgress, progress());
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frame = document.hidden ? 0 : requestAnimationFrame(loop);
  };
  const play = () => {
    if (!frame && !document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
  };

  resize();
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', play);
  play();
  canvas.classList.add('is-drawn');
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
