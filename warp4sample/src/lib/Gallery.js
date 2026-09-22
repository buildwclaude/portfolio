import * as THREE from 'three';
import Plane from './Plane.js';
import { loadTexture } from './textures.js';

// Distance from camera to the z=0 plane. Bigger = flatter perspective,
// smaller = more dramatic bow. 1000 is the usual sweet spot.
const PERSPECTIVE = 1000;

export default class Gallery {
  constructor(canvas) {
    this.canvas = canvas;
    this.planes = [];
    this.viewport = { w: innerWidth, h: innerHeight };

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(this.viewport.w, this.viewport.h);

    this.scene = new THREE.Scene();

    // Camera calibrated so 1 world unit === 1 CSS pixel at z = 0.
    this.camera = new THREE.PerspectiveCamera(
      50, this.viewport.w / this.viewport.h, 10, 4000
    );
    this.camera.position.z = PERSPECTIVE;
    this.setCameraFov();
  }

  setCameraFov() {
    this.camera.fov =
      2 * Math.atan(this.viewport.h / 2 / PERSPECTIVE) * (180 / Math.PI);
    this.camera.aspect = this.viewport.w / this.viewport.h;
    this.camera.updateProjectionMatrix();
  }

  /** Build one plane per <figure data-gl> in the DOM. */
  async init() {
    const els = [...document.querySelectorAll('[data-gl]')];

    await Promise.all(
      els.map(async (el) => {
        const img = el.querySelector('img');
        const texture = await loadTexture(img);
        const speed = parseFloat(el.closest('.card')?.dataset.speed || 0);
        const plane = new Plane(el, texture, speed);
        this.planes.push(plane);
        this.scene.add(plane.mesh);
      })
    );

    document.body.classList.add('gl-ready'); // fades the DOM <img> placeholders out
  }

  resize() {
    this.viewport = { w: innerWidth, h: innerHeight };
    this.renderer.setSize(this.viewport.w, this.viewport.h);
    this.setCameraFov();
    this.planes.forEach((p) => p.resize());
  }

  render(velocity, scroll) {
    this.planes.forEach((p) => p.update(velocity, scroll, this.viewport));
    this.renderer.render(this.scene, this.camera);
  }
}
