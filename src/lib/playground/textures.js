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
    // Root-relative paths have to include the site's base (/portfolio/).
    const src = item.src?.startsWith('/') ? import.meta.env.BASE_URL + item.src.slice(1) : item.src;
    loader.load(src, done, undefined, () =>
      done(new THREE.CanvasTexture(generate(item.fallback, item.title)))
    );
  });
}
