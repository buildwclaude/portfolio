// ---------------------------------------------------------------
// THE WARP.
// The plane is a 1x1 grid with many subdivisions. We push its
// vertices in Z as a function of scroll velocity, so the tile
// physically bows away from the camera. Perspective does the rest.
// ---------------------------------------------------------------

uniform float uVelocity;   // smoothed scroll velocity, px/frame (signed)
uniform float uHover;      // 0..1
uniform float uEnter;      // 0..1 reveal

varying vec2  vUv;
varying float vBow;

const float PI = 3.14159265;

void main() {
  vUv = uv;

  vec3 pos = position;                    // -0.5 .. 0.5 on x and y

  // 0 at the left/right edges, 1 in the middle of the plane.
  // This is what makes the EDGES lag behind the CENTER — the bow.
  float bowX = sin(uv.x * PI);
  float bowY = sin(uv.y * PI);

  float v = clamp(uVelocity, -90.0, 90.0);

  // 1. bow in Z  → the 3D curve. Scroll down (v > 0) pushes the
  //    centre away from the camera; scroll up pulls it forward.
  pos.z -= bowX * v * 2.2;

  // 2. a second, softer bow on the other axis so corners round off
  pos.z -= bowY * v * 0.8;

  // 3. stretch along Y with speed — the tile smears while moving
  pos.y *= 1.0 + abs(v) * 0.0022;

  // 4. entrance: rises and unbends into place
  pos.z -= (1.0 - uEnter) * 240.0;
  pos.y -= (1.0 - uEnter) * 0.08;

  // 5. hover: lean toward the camera
  pos.z += uHover * 26.0;

  vBow = bowX * v;                        // pass to fragment for shading

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
