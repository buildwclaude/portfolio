import * as THREE from 'three';
import vertexShader from '../shaders/plane.vert?raw';
import fragmentShader from '../shaders/plane.frag?raw';

// One shared geometry for every tile. 1x1 unit plane, heavily
// subdivided so the vertex shader has vertices to bend.
const GEOMETRY = new THREE.PlaneGeometry(1, 1, 40, 40);

export default class Plane {
  /**
   * @param {HTMLElement} el      the <figure data-gl> that defines the layout
   * @param {THREE.Texture} texture
   * @param {number} speed        parallax drift, px per px scrolled
   */
  constructor(el, texture, speed = 0) {
    this.el = el;
    this.speed = speed;
    this.enter = 0;
    this.hover = 0;
    this.hoverTarget = 0;

    const img = texture.image;
    this.imgAspect = (img.width || 1) / (img.height || 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTexture:  { value: texture },
        uCover:    { value: new THREE.Vector2(1, 1) },
        uVelocity: { value: 0 },
        uEnter:    { value: 0 },
        uHover:    { value: 0 }
      }
    });

    this.mesh = new THREE.Mesh(GEOMETRY, this.material);

    const card = el.closest('.card') || el;
    card.addEventListener('mouseenter', () => (this.hoverTarget = 1));
    card.addEventListener('mouseleave', () => (this.hoverTarget = 0));

    this.resize();
  }

  /** recompute the cached rect; call on resize */
  resize() {
    this.rect = this.el.getBoundingClientRect();
    this.bounds = {
      width:  this.rect.width,
      height: this.rect.height
    };
    this.mesh.scale.set(this.bounds.width, this.bounds.height, 1);

    // object-fit: cover maths
    const planeAspect = this.bounds.width / this.bounds.height;
    const cover = this.material.uniforms.uCover.value;
    if (this.imgAspect > planeAspect) {
      cover.set(planeAspect / this.imgAspect, 1);
    } else {
      cover.set(1, this.imgAspect / planeAspect);
    }
  }

  /**
   * @param {number} velocity  smoothed scroll velocity (px/frame)
   * @param {number} scroll    current smoothed scroll position (px)
   * @param {{w:number,h:number}} viewport
   */
  update(velocity, scroll, viewport) {
    // Live rect. Lenis moves the real scroll position, so
    // getBoundingClientRect() already includes the smoothed scroll.
    const rect = this.el.getBoundingClientRect();

    // extra per-column parallax
    const drift = scroll * this.speed;

    // DOM coords (top-left origin, y down) → WebGL coords (centre origin, y up)
    this.mesh.position.x = rect.left - viewport.w / 2 + rect.width / 2;
    this.mesh.position.y = -rect.top + viewport.h / 2 - rect.height / 2 + drift;

    // reveal once it crosses into view
    const visible = rect.top < viewport.h * 0.92 && rect.bottom > 0;
    this.enter += ((visible ? 1 : 0) - this.enter) * 0.06;
    this.hover += (this.hoverTarget - this.hover) * 0.12;

    const u = this.material.uniforms;
    u.uVelocity.value = velocity;
    u.uEnter.value = this.enter;
    u.uHover.value = this.hover;

    // cull offscreen tiles
    this.mesh.visible = rect.bottom > -200 && rect.top < viewport.h + 200;
  }
}
