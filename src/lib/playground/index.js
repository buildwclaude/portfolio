/* ══════════════════════════════════════════════════════════════════════
   PLAYGROUND MODE

   Everything WebGL lives behind this module, which is imported on demand.
   Nothing here runs — and Three.js is never downloaded — until someone
   actually asks for the room.
   ══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import Playground from './Playground.js';
import { openDetail, closeDetail, detailOpen } from './panel.js';

const $ = (id) => document.getElementById(id);

const LERP  = 0.075;   // ↓ = heavier glide
const DECAY = 0.93;    // flick momentum after you let go
const NUDGE = 26;      // arrow-key step

export async function createPlayground() {
  const root   = $('pg');
  const canvas = $('gl');
  const label  = $('label');
  const coord  = $('coord');
  const hint   = $('pg-hint');

  const pg = new Playground(canvas);
  await pg.init();
  root.classList.add('ready');

  /* ---- movement ---------------------------------------------------- */
  /* target  = where you've asked to go                                 */
  /* scroll  = where the room actually is (chases target)               */
  /* velocity = the difference → drives every distortion                */
  const target   = { x: 0, y: 0 };
  const scroll   = { x: 0, y: 0 };
  const velocity = new THREE.Vector2(0, 0);

  let flick = { x: 0, y: 0 };
  let dragging = false;
  let last   = { x: 0, y: 0 };
  let downAt = { x: 0, y: 0 };
  let moved  = false;         // did this press turn into a drag?
  let running = false;
  let frame = 0;
  let coordAt = 0;
  const keys = new Set();

  /* ---- hover ------------------------------------------------------- */
  pg.onHover = (item) => {
    document.body.classList.toggle('hovering', !!item);
    label.classList.toggle('on', !!item);
    if (item) {
      label.innerHTML = '<b></b><span></span>';
      label.querySelector('b').textContent = item.title;
      label.querySelector('span').textContent =
        [item.tag, item.year].filter(Boolean).join(' · ');
    }
  };

  let hintGone = false;
  const dismissHint = () => {
    if (hintGone) return;
    hintGone = true;
    hint.classList.add('gone');
  };

  /* ---- input ------------------------------------------------------- */

const onWheel = (e) => {
    if (!running || detailOpen()) return;
    e.preventDefault();
    target.x -= e.deltaX * 1.1;
    target.y += e.deltaY * 1.1;   // wheel-down pulls the room up
    flick = { x: 0, y: 0 };
    dismissHint();
  };

  const onPointerDown = (e) => {

    dragging = true;
    moved = false;
    flick = { x: 0, y: 0 };
    last   = { x: e.clientX, y: e.clientY };
    downAt = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    document.body.classList.add('grabbing');
  };

  const onPointerMove = (e) => {
    if (!running) return;
    pg.pointer.set(
      (e.clientX / innerWidth) * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1
    );
    pg.pointerDirty = true;

    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    target.x += dx * 1.6;
    target.y -= dy * 1.6;
    flick = { x: dx * 1.6, y: -dy * 1.6 };   // remember the throw
    last = { x: e.clientX, y: e.clientY };
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) {
      moved = true;
      dismissHint();
    }
  };

  const onPointerUp = () => {
    const wasDragging = dragging;
    dragging = false;
    document.body.classList.remove('grabbing');

    // a press that didn't turn into a drag = a click → open that piece
    if (wasDragging && !moved) {
      const item = pg.pickAt();
      if (item) openDetail(item);
    }
  };

  const onPointerLeave = () => {          // cursor off the page → no hover
    pg.pointer.set(-2, -2);
    pg.pointerDirty = true;
  };

  const onKeyDown = (e) => {
    if (!running) return;
    if (!e.key.startsWith('Arrow')) return;
    keys.add(e.key);
    dismissHint();
  };
  const onKeyUp = (e) => keys.delete(e.key);

  let resizeQueued = false;
  const onResize = () => {
    if (resizeQueued || !running) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; pg.resize(); });
  };

  addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('pointerup', onPointerUp);
  addEventListener('pointerleave', onPointerLeave);
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  addEventListener('resize', onResize);

  /* ---- loop -------------------------------------------------------- */
  function raf(now) {
    if (!running) return;
    frame = requestAnimationFrame(raf);

    if (keys.size) {
      if (keys.has('ArrowLeft'))  target.x += NUDGE;
      if (keys.has('ArrowRight')) target.x -= NUDGE;
      if (keys.has('ArrowUp'))    target.y -= NUDGE;
      if (keys.has('ArrowDown'))  target.y += NUDGE;
    }

    if (!dragging && (flick.x || flick.y)) {
      target.x += flick.x;
      target.y += flick.y;
      flick.x *= DECAY;
      flick.y *= DECAY;
      if (Math.abs(flick.x) < 0.05) flick.x = 0;
      if (Math.abs(flick.y) < 0.05) flick.y = 0;
    }

    const dx = target.x - scroll.x;
    const dy = target.y - scroll.y;
    const moving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;

    // A parked room with a settled hover has nothing new to draw — skip the
    // whole frame rather than re-rendering an identical image.
    if (!moving && !pg.pointerDirty && !pg.settling) return;

    scroll.x += dx * LERP;
    scroll.y += dy * LERP;
    velocity.set(dx * LERP, dy * LERP);

    pg.render(scroll, velocity);

    // decoration — 10fps is plenty, and it keeps layout off the hot path
    if (moving && now - coordAt > 100) {
      coordAt = now;
      coord.textContent =
        `${Math.abs(scroll.x).toFixed(0).padStart(4, '0')} · ${Math.abs(scroll.y).toFixed(0).padStart(4, '0')}`;
    }
  }

  return {
    /** Fly a given piece to the centre of the room. */
    flyTo(item) {
      const c = pg.centerOn(item);
      if (!c) return;
      target.x = c.x;
      target.y = c.y;
      scroll.x = c.x;              // arrive already there, then settle
      scroll.y = c.y;
      flick = { x: 0, y: 0 };
    },

    start() {
      if (running) return;
      running = true;
      pg.resize();
      pg.pointerDirty = true;
      frame = requestAnimationFrame(raf);
    },

    stop() {
      running = false;
      cancelAnimationFrame(frame);
      keys.clear();
      dragging = false;
      document.body.classList.remove('grabbing', 'hovering');
      label.classList.remove('on');
      closeDetail();
    }
  };
}
