precision highp float;

uniform sampler2D uTexture;
uniform vec2  uCover;      // uv scale so the image "object-fit: cover"s the plane
uniform float uVelocity;
uniform float uEnter;
uniform float uHover;

varying vec2  vUv;
varying float vBow;

void main() {
  // object-fit: cover, in uv space
  vec2 uv = (vUv - 0.5) * uCover + 0.5;

  // chromatic aberration scales with speed — the channels tear apart
  float amt = clamp(abs(uVelocity) * 0.00035, 0.0, 0.018);

  float r = texture2D(uTexture, uv + vec2(amt, 0.0)).r;
  vec4  g = texture2D(uTexture, uv);
  float b = texture2D(uTexture, uv - vec2(amt, 0.0)).b;

  vec3 col = vec3(r, g.g, b);

  // fake lighting off the bow: the curved part catches less light
  col *= 1.0 - abs(vBow) * 0.004;

  // hover lift
  col += uHover * 0.05;

  // reveal
  float alpha = uEnter * g.a;
  col *= mix(0.15, 1.0, uEnter);

  gl_FragColor = vec4(col, alpha);
}
