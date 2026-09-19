# Portfolio

A small editorial portfolio: warm paper, a quiet dot field, light grotesk type
and a Kodama that lives in the corner.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck, then build to dist/
npm run preview  # serve the built site
```

## Where things are

```
src/
  content/site.ts        all copy and links — the only file most edits touch
  site/                  components; each returns HTML, rendered at build time
  styles/
    tokens.css           every colour, type size, space and timing value
    base.css             reset, type roles, focus, links
    layout.css           the shell, the column grid, section rhythm
    components/*.css     one file per component
    motion.css           reveal states and the reduced-motion rules
  lib/
    nav.ts               header state, current section, mobile menu
    kodama.ts            the companion
    motion.ts            reveals (CSS + observer) and the GSAP scroll layer
    media-gl.ts          the project images, drawn through WebGL
  shaders/media.*        the GLSL for the focus pull
  components/
    helix-carousel/      standalone 3D spiral carousel (not used on the page)
examples/helix.html      a page that mounts the carousel
assets-source/           originals and retired work — nothing here ships
public/
  fonts/                 Public Sans, self-hosted, one 27 KB file
  kodama/                the companion loop (see its README)
  work/                  project images
CONTENT.md               the full content extraction and its provenance
```

## How it is built

The page is assembled from the components in `src/site` **at build time** by a
small Vite plugin (`vite.config.ts`) and written into `index.html`. The browser
receives finished markup, so the content needs no JavaScript at all — the
bundle only carries behaviour. Editing `content/site.ts` reloads the dev
server.

## The design system

Everything visual comes from `styles/tokens.css`. The three decisions that
hold the rest together:

**Paper.** `#F3F1E9` throughout, with warm near-black ink. No pure white, no
pure black, and exactly one accent (`--accent`), used three times: the mark in
the header, and hover/current states.

**The grid.** `.shell` sets the max width and margins; `.grid` sets twelve
columns, dropping to six below 860px and four below 520px. Nothing draws the
columns — alignment comes from every section sharing those two classes.

**The dot field.** One rule on the root element: a `radial-gradient` dot on a
24px pitch, at `rgba(22,21,15,0.07)`. That lands each dot about 15/255 darker
than the paper — present when you look for it, invisible when you are reading.
It sits on the root because the root's background paints the whole canvas, so
it needs no element, no stacking, no JavaScript and no repaint on scroll; it
cannot affect layout, create a scrollbar, or interfere with selection. The
pitch is fixed rather than relative: a measure that resized with the viewport
would stop being a measure.

**Type.** One family — **Public Sans**, an open, evenly-fitted grotesk. Nothing
on the page is bold: 400 carries everything, 450 is the heaviest weight in use
(section labels, the header mark, experiment titles), and hierarchy comes from
size, placement and colour instead. Because the face fits evenly, tracking is
near-zero at text sizes and only slightly negative on display type.

## Motion

Three layers, cheapest first:

1. **CSS** — hover, focus and the hero's masked line entrance.
2. **IntersectionObserver + CSS** — one-shot section reveals. Ships in the
   main bundle (~2.3 KB gzipped).
3. **Lenis + GSAP + ScrollTrigger** — loaded on demand, desktop only, after
   first paint, and sharing one clock so scrubbed motion never lags the
   scroll. Lenis damps the wheel so a flick settles over about a second
   instead of landing in one step; touch is left native, because inertia on
   top of inertia feels wrong and costs battery. GSAP does the two things CSS
   cannot do portably yet: the featured project images drifting inside their
   frames, and the section rules drawing themselves across.

Entrances use one long, flat-landing curve (`--ease-reveal`) and siblings that
arrive together are dealt out one after another rather than popping at once —
see `data-reveal-stagger`.

Anchor clearance under the fixed header is set once, as `scroll-padding-top` in
`base.css`; Lenis reads it too, so smooth and native jumps land identically.
Sections carry a negative `scroll-margin-top` so a jump lands on the section's
rule rather than in the middle of its top padding.

Under `prefers-reduced-motion: reduce` none of it runs and GSAP is never
downloaded; the page simply arrives finished. With JavaScript off, everything
is visible and readable — the hidden starting state is added by a script in
the head, so a browser that is not running scripts never applies it.

## The WebGL layer

WebGL draws the two featured project images (`src/lib/media-gl.ts`,
`src/shaders/media.*`). While the page is moving, each image goes slightly
soft and splits a hair at its edges; the moment the scroll settles it resolves
and the loop stops, so reading costs nothing at all.

Velocity comes from Lenis, through the same GSAP ticker that drives the
scrubbed motion, damped in two stages so a flick blooms and releases instead
of snapping. The technique is the focus pull from the carousel project,
calibrated down for paper: the tonal inversion, the film grain and the
vignette are deliberately left out — they belong to a graphite drawing on a
near-black stage and would dirty someone's actual screenshots.

One small context per frame, so the canvas *is* the element: no DOM to follow,
no layout to stay in sync with, no stacking to reason about. The `<img>` stays
underneath as the texture source and as the fallback — it is what shows on
mobile, under reduced motion, without WebGL2, and if a context is ever lost.

An earlier version of this layer drew the page background as an isoline field.
Those were the "scribbles" the dot field replaced; it is kept, with
instructions for putting it back, in `assets-source/retired-webgl-field/`.

## Helix Carousel

`src/components/helix-carousel/` — a standalone 3D spiral of image cards,
unrelated to the portfolio itself and not mounted on it. CSS 3D transforms and
one `requestAnimationFrame` loop; no 3D library. 1.4 KB of JavaScript.

```ts
import { createHelixCarousel } from './components/helix-carousel';

const helix = createHelixCarousel({ images: ['/a.jpg', '/b.jpg'] });
document.querySelector('#mount')?.appendChild(helix.element);
// helix.destroy();   removes every frame, listener and observer
```

A working page is at `examples/helix.html` (`npm run dev`, then
`/examples/helix.html`). It is a separate build entry, so it costs the
portfolio nothing; delete the `helix` line in `vite.config.ts` to stop
shipping it.

**Tuning.** `angleStep` is the turn — lower for a longer, gentler spiral (more
cards visible at once), higher for a tight corkscrew. `rise` is the climb, and
`radius` the width. `speed` is card positions per second; 1 is a slow drift.
Cards past 90° are hidden backfaces, so `angleStep` is what really decides how
much of the helix you ever see.

## The Kodama

`public/kodama/` holds a 5-second loop cut from `assets-source/`. The source
clip does not loop — it begins with the head turned and ends facing forward —
so the shipped files are the span of the original animation that *does* meet
itself (2.583s → 7.667s), cropped to the creature and stripped of audio. Nothing
about the animation itself was changed. Full details and the ffmpeg commands
are in `assets-source/README.md`.

It renders 68px tall, fixed below the navigation on the right margin, with no
container, no label and no motion of its own.

## Content

All of it is real, transcribed from **sony-thakuri.xyz**. `CONTENT.md` is the
full extraction — every line with its source page, the links that were verified,
the one place the source site contradicts itself, and what the source does not
state (location and education, which is why the site has neither).

`src/content/site.ts` is the subset the site renders. To change anything:

- **Copy, projects, experiments, experience, links** — all in that one file.
- **Project images** — put a file in `public/work/`, then set `image` and
  `imageAlt` on the project. The drawn plate is used for any project without
  one, which is how the three archive entries render.
- **Two links could not be machine-verified**, because both hosts block
  automated requests: LinkedIn (HTTP 999) and Behance (HTTP 403). Both are
  first-party links taken from her own site. Worth opening once by hand.
- `read.cv/sonythakuri` appears on the source site but now returns *Deployment
  Paused*, so it was left out.

## Payload

| | gzipped |
|---|---|
| HTML | 5.8 KB |
| CSS | 4.8 KB |
| JS (critical) | 2.8 KB |
| Font | 27 KB |
| Kodama loop + poster | 33 KB |
| Two project images (WebP, lazy) | 113 KB |
| Media WebGL (deferred, desktop) | 3.0 KB |
| Lenis (deferred, desktop) | 5.6 KB |
| GSAP + ScrollTrigger (deferred, desktop) | 46 KB |

## Checked

Desktop (1440), tablet (768) and mobile (390); keyboard order and focus
states; the mobile menu with Escape; `prefers-reduced-motion`; JavaScript
disabled; no horizontal overflow; no console errors.
