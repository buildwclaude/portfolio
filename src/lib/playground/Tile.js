import * as THREE from 'three';
import vertexShader from '../../shaders/tile.vert?raw';
import fragmentShader from '../../shaders/tile.frag?raw';

const GEOMETRY = new THREE.PlaneGeometry(1, 1, 32, 32);

// How hard the room curves. Bigger = flatter wall, smaller = tighter dome.
const CURVE = 3400;

export default class Tile {
  /**
   * @param {object} item   { title, year, tag, src, fallback }
   * @param {THREE.Texture} texture
   * @param {object} base   { x, y, w, h }  home position in world px
   */
  constructor(item, texture, base) {
    this.item = item;
    this.base = base;
    this.hover = 0;
    this.hoverTarget = 0;

    const img = texture.image;
    const imgAspect = (img.width || 1) / (img.height || 1);
    const planeAspect = base.w / base.h;

    const cover = new THREE.Vector2(1, 1);
    if (imgAspect > planeAspect) cover.set(planeAspect / imgAspect, 1);
    else cover.set(1, imgAspect / planeAspect);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,   // soft corners + rim fade need painter-order blending
      uniforms: {
        uTexture:  { value: texture },
        uCover:    { value: cover },
        uVelocity: { value: 0 },
        uDir:      { value: new THREE.Vector2(0, 0) },
        uHover:    { value: 0 },
        uFade:     { value: 1 }
      }
    });

    this.mesh = new THREE.Mesh(GEOMETRY, this.material);
    this.mesh.scale.set(base.w, base.h, 1);
    this.mesh.userData.tile = this;
  }

  /**
   * @param {{x:number,y:number}} scroll   camera offset in world px
   * @param {{w:number,h:number}} world    size of one tile of the infinite plane
   * @param {number} speed                 velocity magnitude
   * @param {THREE.Vector2} dir            direction of travel
   * @param {number} radius                fade radius (px)
   */
  update(scroll, world, speed, dir, radius) {
    // ---- INFINITE WRAP -------------------------------------------------
    // Shift by the scroll, then fold back into the [-world/2, world/2]
    // window. A tile that leaves the right edge instantly re-enters on
    // the left. This is the whole trick — the grid never actually ends.
    const x = wrap(this.base.x + scroll.x, world.w);
    const y = wrap(this.base.y + scroll.y, world.h);

    // ---- THE ROOM ------------------------------------------------------
    // Push tiles back in Z the further they are from where you're looking,
    // and turn them to face you. That's what makes it feel like a space
    // rather than a flat wall.
    const d2 = x * x + y * y;
    this.mesh.position.set(x, y, -d2 / CURVE);
    this.mesh.rotation.y = -x * 0.00055;
    this.mesh.rotation.x =  y * 0.00055;

    // dissolve into the page at the rim
    const fade = 1 - smoothstep(radius * 0.45, radius, Math.sqrt(d2));

    this.mesh.visible = fade > 0.01;
    if (!this.mesh.visible) return;   // nothing off-screen needs uniforms

    this.hover += (this.hoverTarget - this.hover) * 0.12;

    const u = this.material.uniforms;
    u.uVelocity.value = speed;
    u.uDir.value.copy(dir);
    u.uHover.value = this.hover;
    u.uFade.value = fade;
  }
}

/** fold v into [-size/2, size/2] */
function wrap(v, size) {
  return ((v + size / 2) % size + size) % size - size / 2;
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
