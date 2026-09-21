uniform float uVelocity;   // magnitude of drag/scroll velocity
uniform vec2  uDir;        // normalised direction of travel
uniform float uHover;
uniform float uFade;       // 1 at the centre of the room, 0 at the rim

varying vec2  vUv;
varying float vBow;

const float PI = 3.14159265;

void main() {
  vUv = uv;
  vec3 pos = position;                 // unit plane, -0.5..0.5

  float bowX = sin(uv.x * PI);         // 0 at edges, 1 at centre
  float bowY = sin(uv.y * PI);
  float v = min(uVelocity, 90.0);

  // The tile bows AWAY from the direction of travel — drag right and the
  // tiles trail behind, like sheets in water.
  pos.z -= bowX * v * uDir.x * 1.4;
  pos.z += bowY * v * uDir.y * 1.4;

  // and squashes along the axis it's moving on
  pos.x *= 1.0 + abs(uDir.x) * v * 0.0016;
  pos.y *= 1.0 + abs(uDir.y) * v * 0.0016;

  // lean out of the wall and grow a hair on hover
  pos.z  += uHover * 55.0;
  pos.xy *= 1.0 + uHover * 0.03;

  vBow = (bowX * uDir.x + bowY * uDir.y) * v;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
