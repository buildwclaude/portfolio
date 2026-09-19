# Retired: the WebGL isoline field

This was the background layer before the dot field replaced it — a
full-screen fragment shader drawing domain-warped noise as contour lines at
about 7% opacity, in plain WebGL2 (one triangle, no buffers, 2.8 KB gzipped).

It is the "scribbles" the dot pattern was asked to replace, so it is no longer
mounted. Kept here rather than deleted, because it worked.

**To bring it back:**

1. Move `field.ts` to `src/lib/` and `field.vert` / `field.frag` to
   `src/shaders/`.
2. Add the canvas to `src/site/index.ts`, above `${header()}`:
   `<canvas class="field" data-field aria-hidden="true"></canvas>`
3. Restore the layer's CSS in `src/styles/layout.css`:
   ```css
   .field {
     position: fixed;
     inset: 0;
     z-index: -1;
     width: 100%;   /* a canvas is a replaced element — `inset` alone
     height: 100%;     leaves it at its intrinsic 300×150 */
     pointer-events: none;
   }
   ```
4. In `src/main.ts`, inside `enhance()`:
   ```ts
   const canvas = document.querySelector<HTMLCanvasElement>('[data-field]');
   if (canvas) {
     import('./lib/field')
       .then(({ initField }) => initField(canvas, { reducedMotion }))
       .catch(() => undefined);
   }
   ```

It renders at display rate, drops resolution before it drops frames, pauses
with the tab, and falls back to a single static frame on small screens, weak
devices, Save-Data connections and reduced motion.
