import * as THREE from 'three';
import Tile from './Tile.js';
import { loadTexture } from './textures.js';
import { ITEMS } from './items.js';

const PERSPECTIVE = 1100;

// The grid you actually build. It is then tiled infinitely by the wrap
// in Tile.js — so 4 columns of work fills an endless room.
const COLS = 4;
const CELL_W = 560;
const CELL_H = 700;

export default class Playground {
  constructor(canvas) {
    this.canvas = canvas;
    this.tiles = [];
    this.vp = { w: innerWidth, h: innerHeight };

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(this.vp.w, this.vp.h);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.vp.w / this.vp.h, 10, 6000);
    this.camera.position.z = PERSPECTIVE;
    this.setFov();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-2, -2);
    this.hovered = null;
    this.pointerDirty = true;

    // scratch objects — the render loop must not allocate
    this._dir = new THREE.Vector2(0, 0);
    this._visible = [];
    this._hits = [];

    const rows = Math.ceil(ITEMS.length / COLS);
    this.world = { w: COLS * CELL_W, h: rows * CELL_H };
    this.radius = Math.max(this.world.w, this.world.h) * 0.62;
  }

  setFov() {
    this.camera.fov = 2 * Math.atan(this.vp.h / 2 / PERSPECTIVE) * (180 / Math.PI);
    this.camera.aspect = this.vp.w / this.vp.h;
    this.camera.updateProjectionMatrix();
  }

  async init() {
    const rows = Math.ceil(ITEMS.length / COLS);
    const rand = seeded(9);
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // lay the grid out first (synchronously, so the seeded jitter is stable
    // regardless of which texture resolves first), then fill in the art
    const bases = ITEMS.map((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      // varied sizes + jitter inside the cell → a scattered wall,
      // not a spreadsheet
      const w = CELL_W * (0.52 + rand() * 0.26);
      return {
        x: (col - (COLS - 1) / 2) * CELL_W + (rand() - 0.5) * 90,
        // stagger every other column so rows don't line up
        y: ((rows - 1) / 2 - row) * CELL_H
           + (col % 2 ? CELL_H * 0.22 : -CELL_H * 0.1)
           + (rand() - 0.5) * 70,
        w,
        h: w / (item.ratio ?? 0.78)
      };
    });

    this.tiles = await Promise.all(
      ITEMS.map(async (item, i) => {
        const texture = await loadTexture(item);
        texture.anisotropy = maxAniso;
        const tile = new Tile(item, texture, bases[i]);
        this.scene.add(tile.mesh);
        return tile;
      })
    );
  }

  resize() {
    this.vp = { w: innerWidth, h: innerHeight };
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(this.vp.w, this.vp.h);
    this.setFov();
  }

  /** Which project (if any) sits under the cursor? For clicks. */
  pickAt() {
    return this.hovered ? this.hovered.item : null;
  }

  /** The scroll target that brings a given project to the centre of the room. */
  centerOn(item) {
    const t = this.tiles.find((t) => t.item === item);
    return t ? { x: -t.base.x, y: -t.base.y } : null;
  }

  /** @param {{x:number,y:number}} scroll  @param {THREE.Vector2} velocity */
  render(scroll, velocity) {
    const speed = velocity.length();
    const dir = this._dir.copy(velocity);
    if (speed > 0.001) dir.divideScalar(speed);

    const visible = this._visible;
    visible.length = 0;

    for (const t of this.tiles) {
      t.update(scroll, this.world, speed, dir, this.radius);
      t.hoverTarget = 0;
      if (t.mesh.visible) visible.push(t.mesh);
    }

    // Raycasting is the expensive part, so only redo it when something
    // could actually have changed under the cursor.
    if (this.pointerDirty || speed > 0.01) {
      this.pointerDirty = false;
      let tile = null;

      // a ray fired from outside the viewport can still hit a tile parked
      // off-screen — so don't fire one at all until the cursor is on the page
      if (Math.abs(this.pointer.x) <= 1 && Math.abs(this.pointer.y) <= 1) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        this._hits.length = 0;
        this.raycaster.intersectObjects(visible, false, this._hits);
        const hit = this._hits[0];
        tile = hit ? hit.object.userData.tile : null;
      }

      if (tile !== this.hovered) {
        this.hovered = tile;
        this.onHover?.(tile ? tile.item : null);
      }
    }

    if (this.hovered) this.hovered.hoverTarget = 1;

    this.renderer.render(this.scene, this.camera);
  }

  /** True while anything is still easing — lets the loop idle when it isn't. */
  get settling() {
    for (const t of this.tiles) {
      if (Math.abs(t.hoverTarget - t.hover) > 0.001) return true;
    }
    return false;
  }
}

const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
