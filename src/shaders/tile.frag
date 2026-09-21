precision highp float;

uniform sampler2D uTexture;
uniform vec2  uCover;
uniform float uVelocity;
uniform float uHover;
uniform float uFade;       // 1 at the centre of the room, 0 at the rim

varying vec2  vUv;
varying float vBow;

/* signed distance to a rounded box — gives the tiles soft corners
   without a mask texture */
float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;

  // a whisper of RGB split with speed — enough to feel the motion, never
  // enough to read as an effect
  float amt = clamp(uVelocity * 0.00018, 0.0, 0.009);
  float r = texture2D(uTexture, uv + vec2(amt, 0.0)).r;
  vec4  g = texture2D(uTexture, uv);
  float b = texture2D(uTexture, uv - vec2(amt, 0.0)).b;

  vec3 col = vec3(r, g.g, b);

  col *= 1.0 - abs(vBow) * 0.0022;      // shading off the bow
  col += uHover * 0.04;                 // lifts a touch under the cursor

  // soft corners, antialiased against the plane's own footprint
  float d = roundedBox(vUv - 0.5, vec2(0.5), 0.035);
  float mask = 1.0 - smoothstep(-0.004, 0.004, d);

  // tiles at the rim simply dissolve — no darkening, so the room reads
  // the same in light and dark
  gl_FragColor = vec4(col, uFade * mask);
}
