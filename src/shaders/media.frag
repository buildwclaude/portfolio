#version 300 es
precision highp float;

/* ---------------------------------------------------------------------------
   Project media under motion.

   The same idea as the carousel's focus pull, calibrated down for paper: while
   the page is moving the image goes very slightly soft and splits a hair at its
   edges, and the moment you stop it resolves. Nothing happens at rest — the
   frame is the photograph, unaltered.

   Deliberately *not* carried over from the carousel: the tonal inversion, the
   film grain and the vignette. Those belong to a graphite drawing on a
   near-black stage; here they would fight the paper and dirty someone's
   actual screenshots.
   --------------------------------------------------------------------------- */

uniform sampler2D uTexture;
uniform vec2 uCover;      // uv scale that reproduces CSS `object-fit: cover`
uniform float uVelocity;  // damped scroll velocity, signed, about -1..1

in vec2 vUv;
out vec4 outColor;

const int TAPS = 5;
const float TAU_OVER_TAPS = 1.2566371;
const float CENTRE_WEIGHT = 3.0;

vec2 cover(vec2 uv) {
  return clamp((uv - 0.5) * uCover + 0.5, 0.0, 1.0);
}

void main() {
  float speed = abs(uVelocity);

  // The split belongs at the edges of the frame, never in the middle of it.
  float edge = pow(clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0), 2.2);
  vec2 offset = vUv - 0.5;
  vec2 dir = length(offset) > 1e-5 ? normalize(offset) : vec2(0.0);
  vec2 split = dir * speed * 0.0022 * (0.25 + edge);

  float radius = speed * 0.003;

  // Below a pixel of travel there is nothing to see, so take the cheap path.
  if (radius < 0.0004) {
    outColor = vec4(texture(uTexture, cover(vUv)).rgb, 1.0);
    return;
  }

  /* A rotated ring of taps around a weighted centre. The centre is what
     keeps this reading as defocus: a bare ring doubles crisp edges into a
     ghost, which a graphite drawing can absorb and a screenshot of real UI
     text cannot. */
  vec3 sum = texture(uTexture, cover(vUv)).rgb * CENTRE_WEIGHT;
  for (int i = 0; i < TAPS; i++) {
    float a = float(i) * TAU_OVER_TAPS + 0.7;
    vec2 ring = vec2(cos(a), sin(a)) * radius;
    sum.r += texture(uTexture, cover(vUv + ring + split)).r;
    sum.g += texture(uTexture, cover(vUv + ring)).g;
    sum.b += texture(uTexture, cover(vUv + ring - split)).b;
  }

  outColor = vec4(sum / (CENTRE_WEIGHT + float(TAPS)), 1.0);
}
