/**
 * Stream behind glass (site/about's pull quote): the trail's Stream, in
 * Cobalt Flare's blues, flowing behind a frosted pane. Lanes of sky blue,
 * cobalt and a little navy ripple sideways as they rise, like water, with
 * flickering pale streaks racing up them, like light glinting off it — slower
 * and calmer than on the trail, and blurred to a soft wash by the glass over
 * it (the stylesheet). Drawn at half resolution, since it is blurred anyway;
 * only while on screen; once, still, under reduced motion.
 */

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

const vec3 ICE = vec3(0.94, 0.97, 1.0);
const vec3 SKY = vec3(0.55, 0.75, 1.0);
const vec3 COBALT = vec3(0.16, 0.4, 0.96);
const vec3 NAVY = vec3(0.08, 0.14, 0.48);
const vec3 GLINT = vec3(0.86, 0.93, 1.0);

float hash(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  float aspect = u_size.x / u_size.y;
  float x = uv.x * aspect;
  float y = uv.y;
  float t = u_time * 0.6;

  // The ripple: the lanes pushed sideways by two waves as they rise.
  float sw = x + 0.05 * sin(y * 5.0 - t * 1.3 + x * 6.0)
               + 0.025 * sin(y * 13.0 - t * 2.2 + x * 15.0);

  // Broad bands of colour drifting across: sky, cobalt, a touch of navy,
  // and icy light between them.
  float b = 0.5 + 0.5 * sin(sw * 4.0 + 0.6 * sin(sw * 1.7 + t * 0.15));
  vec3 col = mix(SKY, COBALT, smoothstep(0.2, 0.8, b));
  col = mix(col, NAVY, smoothstep(0.75, 1.0, b) * 0.6);
  col = mix(col, ICE, smoothstep(0.25, 0.0, b) * 0.8);

  // Glints: pale streaks racing up the lanes, each at its own pace,
  // flickering.
  float lane = floor(sw * 26.0);
  float laneU = fract(sw * 26.0);
  float speed = 0.25 + 0.45 * hash(lane * 1.3 + 2.0);
  float freq = 0.8 + 1.2 * hash(lane + 5.0);
  float len = 0.3 + 0.4 * hash(lane + 11.0);
  float p = fract(y * freq - t * speed + hash(lane + 17.0));
  float streak = smoothstep(1.0 - len, 1.0, p) * (1.0 - smoothstep(0.985, 1.0, p));
  float flicker = 0.75 + 0.25 * sin(t * 6.0 + lane * 2.1);
  streak *= pow(sin(laneU * 3.14159), 1.2) * flicker;
  col = mix(col, GLINT, streak * 0.8);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function initStream(reducedMotion: boolean) {
  document.querySelectorAll<HTMLCanvasElement>('[data-stream]').forEach((canvas) => {
    const gl = canvas.getContext('webgl', { antialias: false });
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

    let frame = 0;
    let onScreen = false;
    let visible = false;

    const resize = () => {
      // Half resolution: the glass blurs it to a wash anyway.
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * 0.5));
      canvas.height = Math.max(1, Math.round(rect.height * 0.5));
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
