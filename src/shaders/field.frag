#version 300 es
precision highp float;

/* ---------------------------------------------------------------------------
   Isoline field.

   A slow, domain-warped noise field drawn as contour lines — the same
   family of marks as the page grid, but organic instead of orthogonal.
   It sits behind the layout at a few percent opacity: felt, not watched.

   Everything here is chosen to stay cheap: three octaves, one warp, one
   pass, premultiplied alpha straight onto the paper.
   --------------------------------------------------------------------------- */

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;    // field-space, smoothed in JS
uniform float uScroll;    // field-space drift
uniform float uIntensity; // master opacity

out vec4 outColor;

const vec3 INK = vec3(0.086, 0.082, 0.059);
const float LINES = 10.0; // contour density

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y * 2.1;

  p.y += uScroll;

  float t = uTime * 0.013;

  // The pointer eases the field aside — a gentle, local displacement.
  vec2 toPointer = p - uPointer;
  float fall = exp(-dot(toPointer, toPointer) * 2.2);
  p += normalize(toPointer + 1e-4) * fall * 0.14;

  // One domain warp is enough to break the grid-like regularity of fbm.
  vec2 warp = vec2(
    fbm(p + vec2(0.0, t)),
    fbm(p + vec2(3.7, -t * 0.72))
  );
  float field = fbm(p + 0.8 * warp);

  // Contours, antialiased against the screen-space gradient.
  float v = field * LINES;
  float dist = abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4);
  float line = 1.0 - smoothstep(0.0, 1.25, dist);

  // Keep the top-left quiet: that is where the type and navigation live.
  float clearance = smoothstep(0.08, 0.9, length(uv - vec2(0.0, 1.0)));

  // Fade at the edges so the layer never announces its own bounding box.
  float edge =
    smoothstep(0.0, 0.14, uv.x) * smoothstep(0.0, 0.14, 1.0 - uv.x) *
    smoothstep(0.0, 0.10, uv.y) * smoothstep(0.0, 0.10, 1.0 - uv.y);

  float alpha = line * clearance * edge * uIntensity;

  outColor = vec4(INK * alpha, alpha); // premultiplied
}
