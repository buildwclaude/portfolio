# WebGL warp portfolio

Velocity-driven 3D warp on top of inertia scroll — the effect from the reference recording.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. It runs with **zero image assets** — missing images
fall back to generated canvas textures. Drop your real work in `public/img/01.jpg …
06.jpg` and they take over automatically.

## Structure

```
.
├── index.html               DOM layout. Each <figure data-gl> is a layout proxy.
├── vite.config.js
├── public/
│   └── img/                 01.jpg … 06.jpg  ← your work goes here
└── src/
    ├── main.js              Lenis inertia scroll → velocity → raf loop
    ├── style.css            The layout the WebGL mirrors
    ├── lib/
    │   ├── Gallery.js       three.js scene, pixel-perfect camera
    │   ├── Plane.js         one textured plane synced to one DOM rect
    │   └── textures.js      texture loader + generative fallbacks
    └── shaders/
        ├── plane.vert       ← THE WARP lives here
        └── plane.frag       ← cover-fit + chromatic aberration
```

## How it actually works

1. **Lenis** eases the real scroll position toward the target (`lerp: 0.075`). That lag
   is the momentum, and it exposes `velocity` in px/frame.
2. `main.js` smooths that velocity (`+= (raw - v) * 0.14`) — unsmoothed velocity makes
   the bend snap and look cheap.
3. Every frame, each `Plane` reads its `<figure>`'s `getBoundingClientRect()` and parks
   its mesh at exactly those pixel coordinates. **Layout stays in CSS; WebGL follows.**
4. The camera is calibrated so 1 world unit = 1 CSS pixel:
   `fov = 2 * atan((viewportHeight / 2) / 1000)`, `camera.z = 1000`.
5. `plane.vert` displaces vertices in **Z** by `sin(uv.x * PI) * velocity`. Edges stay
   put, the centre pushes away from the camera → the tile bows in perspective. That
   perspective bow is the 3D you were missing; no CSS or SVG filter can do it.
6. `plane.frag` tears the R and B channels apart in proportion to `|velocity|`.

## Tuning

| Want | File | Change |
|---|---|---|
| Heavier / longer glide | `src/main.js` | `lerp: 0.075` → lower |
| More bend | `src/shaders/plane.vert` | `pos.z -= bowX * v * 2.2` → raise `2.2` |
| Snappier bend | `src/main.js` | `* 0.14` → raise |
| More dramatic perspective | `src/lib/Gallery.js` | `PERSPECTIVE = 1000` → lower |
| More RGB tearing | `src/shaders/plane.frag` | `0.00035` → raise |
| Column drift | `index.html` | `data-speed` on each `.card` |
| Smoother curve | `src/lib/Plane.js` | `PlaneGeometry(1, 1, 40, 40)` → more segments |

## Notes

- `prefers-reduced-motion` kills the canvas and shows plain `<img>`s.
- Planes outside the viewport are culled in `Plane.update()`.
- Shaders are imported with Vite's `?raw` — no glsl plugin needed.
