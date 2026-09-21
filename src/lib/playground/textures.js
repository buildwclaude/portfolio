import * as THREE from 'three';
import { generate } from './patterns.js';

const loader = new THREE.TextureLoader();

/** Real image if it exists, generated sketch if it doesn't. */
export function loadTexture(item) {
  return new Promise((resolve) => {
    const done = (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      resolve(t);
    };
    loader.load(item.src, done, undefined, () =>
      done(new THREE.CanvasTexture(generate(item.fallback, item.title)))
    );
  });
}
