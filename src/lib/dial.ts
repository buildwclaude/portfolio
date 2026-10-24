/**
 * A dial — after a watch-bezel selector: the pages sit around the rim of a
 * large wheel coming in from one edge, tilting with the curve and fading as
 * they turn away, with fine ticks round the rim. The one at the pointer
 * stands upright and full. Dragging turns it (a finger, or a mouse where
 * asked) and it settles on the nearest page; where asked, scrolling over it
 * turns it a page at a time. Hovering only lights a
 * page up — the dial never moves out from under the cursor. Choosing a page
 * turns to it first.
 *
 * The markup comes from site/dial. Used by the menu (lib/dial-menu) and the
 * landing screen (lib/hero-dial).
 */

/** Angle between pages on the rim, degrees. */
const STEP = 15;
/** Angle between ticks, degrees. */
const TICK = 3;
/** Gap between the rim and the pages on it, px. */
const GAP = 18;
/** Length of the ring's dashes, px. */
const DASH = 18;
/** How briskly the dial glides to where it's headed, per second: it closes
 *  this share of the gap continuously (frame-rate independent), so it
 *  eases in and comes to rest without a seam, like the art room. */
const GLIDE = 11;
/** Under a dragging hand it keeps closer. */
const GLIDE_HELD = 26;

export interface DialOptions {
  /** Which edge the wheel comes in from. */
  side: 'left' | 'right';
  /** The wheel's radius and its pointer's distance in from the edge, for a box this size. */
  size(width: number, height: number): { radius: number; inset: number };
  /** Scrolling over the dial turns it (and so doesn't scroll the page). */
  turnByWheel?: boolean;
  /** A mouse can drag it round too, not just a finger. */
  mouseDrag?: boolean;
  /**
   * The dial sits in a scrolling page, so it answers only within its reach
   * (round the rim and out across its pages), and scrolling turns it only
   * once the mouse has been moved there — not when it slides under a resting
   * cursor as the page scrolls. Each scroll gesture goes wholly to one or
   * the other.
   */
  inPage?: boolean;
  /** A page was chosen; the dial has turned to it. */
  onChoose(index: number, link: HTMLAnchorElement): void;
}

export function createDial(root: HTMLElement, opts: DialOptions) {
  const ring = root.querySelector<HTMLElement>('[data-dial-ring]')!;
  const ticks = root.querySelector<SVGSVGElement>('[data-dial-ticks]')!;
  const pointerMark = root.querySelector<HTMLElement>('[data-dial-pointer]')!;
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-dial-item]'));
  const links = items.map((item) => item.querySelector<HTMLAnchorElement>('a')!);
  const last = items.length - 1;
  const left = opts.side === 'left';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add(`dial--${opts.side}`);

  let radius = 0;
  let cx = 0;
  let cy = 0;
  /** Where the dial is now, in pages, and where it's gliding to. */
  let frac = 0;
  let aimed = 0;
  /** How far past the rim its pages reach, px. */
  let reachOut = 0;

  const nearest = () => Math.max(0, Math.min(last, Math.round(frac)));
  const clamp = (v: number) => Math.max(-0.35, Math.min(last + 0.35, v));

  /** Sizes the wheel to its box and draws its ticks. */
  function layout() {
    const w = root.clientWidth;
    const h = root.clientHeight;
    const { radius: r, inset } = opts.size(w, h);
    radius = r;
    // The pointer sits `inset` in from the edge; the centre is off-box behind it.
    cx = left ? inset - radius : w - inset + radius;
    cy = h / 2;
    pointerMark.style.left = `${left ? inset : w - inset}px`;
    pointerMark.style.top = `${cy}px`;

    const size = radius * 2 + 40;
    ticks.setAttribute('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`);
    ring.style.width = ring.style.height = `${size}px`;
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    // The ring fades out above and below the pointer (a mask on the still
    // ring, so the dashes can turn under it on the compositor).
    ring.style.setProperty('--reach', `${Math.min(radius, h / 2)}px`);
    // A ring of even dashes, no rim line; the ones at the pages a shade darker.
    let marks = '';
    for (let a = -180; a < 180; a += TICK) {
      const major = a % STEP === 0;
      const r0 = radius - DASH;
      const t = (a * Math.PI) / 180;
      const c = Math.cos(t);
      const s = Math.sin(t);
      marks += `<line x1="${(r0 * c).toFixed(1)}" y1="${(r0 * s).toFixed(1)}" x2="${(radius * c).toFixed(1)}" y2="${(radius * s).toFixed(1)}"${major ? ' class="is-major"' : ''}/>`;
    }
    ticks.innerHTML = marks;
    reachOut = GAP + Math.max(...items.map((item) => item.offsetWidth)) + 16;
    render();
  }

  /** Whether a point on screen is within the dial's reach: the band from
   *  just inside the rim out to the far ends of its pages. */
  function inReach(x: number, y: number) {
    const box = root.getBoundingClientRect();
    const d = Math.hypot(x - box.left - cx, y - box.top - cy);
    return d > radius - DASH - 24 && d < radius + reachOut;
  }

  // Transforms and opacity only, so each frame is the compositor's alone.
  let shown = -1;
  function render() {
    ticks.style.transform = `rotate(${(left ? -1 : 1) * frac * STEP}deg)`;
    const at = nearest();
    items.forEach((item, i) => {
      const a = (i - frac) * STEP;
      // On the rim, just outside it; a right-hand wheel's pages sit to its left.
      const phi = ((left ? a : 180 - a) * Math.PI) / 180;
      const x = (cx + (radius + GAP) * Math.cos(phi)).toFixed(2);
      const y = (cy + (radius + GAP) * Math.sin(phi)).toFixed(2);
      // Each page reads along its spoke, toward the rim on the right-hand wheel.
      item.style.transform = left
        ? `translate3d(${x}px, ${y}px, 0) translateY(-50%) rotate(${a}deg)`
        : `translate3d(${x}px, ${y}px, 0) translate(-100%, -50%) rotate(${-a}deg)`;
      item.style.opacity = String(Math.max(0, 1 - Math.abs(i - frac) * 0.3));
      item.style.visibility = Math.abs(a) > 80 ? 'hidden' : '';
    });
    if (at !== shown) {
      shown = at;
      items.forEach((item, i) => item.classList.toggle('is-selected', i === at));
    }
  }

  // --- Motion: always gliding toward `aimed`, a frame at a time -------------
  let frame = 0;
  let lastFrame = 0;
  let glide = GLIDE;
  let arrived: (() => void) | null = null;
  function tick(now: number) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    frac += (aimed - frac) * (1 - Math.exp(-dt * glide));
    const gap = Math.abs(aimed - frac);
    if (gap < 0.0006) frac = aimed;
    render();
    // There to the eye: hand over, and let the last sliver finish on its own.
    if (arrived && gap < 0.02) {
      const then = arrived;
      arrived = null;
      then();
    }
    frame = frac === aimed ? 0 : requestAnimationFrame(tick);
  }
  /** Sends the dial gliding to a turn (in pages); `then` once it's there. */
  function glideTo(target: number, then?: () => void, briskness = GLIDE) {
    aimed = target;
    glide = briskness;
    arrived = then ?? null;
    if (reduced) {
      cancelAnimationFrame(frame);
      frame = 0;
      frac = target;
      render();
      arrived = null;
      then?.();
      return;
    }
    if (!frame) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  /** Turns the dial smoothly to a page. */
  const settleTo = (page: number, then?: () => void) => glideTo(page, then);
  const snap = () => settleTo(Math.max(0, Math.min(last, Math.round(aimed))));

  // --- Scrolling over it turns it, where asked ------------------------------
  // A page at a time, like the clicks of a bezel: a wheel's notch or a
  // trackpad's swipe moves one page, and a swipe's long glide afterwards
  // doesn't carry it on round.
  if (opts.turnByWheel) {
    let travel = 0;
    let lastEvent = 0;
    let lastStep = 0;
    /** Whether the gesture under way turns the dial (or scrolls the page). */
    let turning = true;

    // Intent: the mouse has moved into the dial's reach (a page sliding
    // under a still cursor doesn't count). Moving in starts afresh, so a
    // page scroll's last glide doesn't keep the scroll on the page.
    let intent = !opts.inPage;
    const setIntent = (on: boolean) => {
      if (on === intent) return;
      intent = on;
      root.classList.toggle('is-armed', on);
      if (on) lastEvent = 0;
    };
    if (opts.inPage) {
      root.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' || pointer !== null) return;
        const reach = inReach(e.clientX, e.clientY);
        if (!reach) setIntent(false);
        else if (e.movementX || e.movementY) setIntent(true);
      });
      root.addEventListener('pointerleave', () => setIntent(false));
    }

    root.addEventListener(
      'wheel',
      (e) => {
        const now = performance.now();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (now - lastEvent > 160) {
          // A new gesture: whose is it?
          travel = 0;
          turning = intent;
        }
        lastEvent = now;
        if (!turning) return;
        e.preventDefault();
        e.stopPropagation(); // not the page's smooth scroll, either
        travel += delta;
        if (Math.abs(travel) < 40 || now - lastStep < 420) return;
        lastStep = now;
        const next = Math.max(0, Math.min(last, aimed + Math.sign(travel)));
        travel = 0;
        if (next !== aimed) settleTo(next);
      },
      { passive: false },
    );
  }

  // --- Dragging turns it (up and down, along the rim) ----------------------
  let pointer: number | null = null;
  let startY = 0;
  let startFrac = 0;
  let dragged = false;
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.pointerType === 'mouse' && !opts.mouseDrag)) return;
    if (opts.inPage && !inReach(e.clientX, e.clientY)) return;
    pointer = e.pointerId;
    startY = e.clientY;
    startFrac = aimed;
    dragged = false;
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointer) return;
    // The button came up somewhere we didn't hear it: no drag after all.
    if (e.pointerType === 'mouse' && !e.buttons) return end(e);
    const dy = e.clientY - startY;
    if (!dragged && Math.abs(dy) < 8) return;
    if (!dragged) {
      dragged = true;
      root.classList.add('is-turning');
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        // Not a tracked pointer; the drag still works without capture.
      }
    }
    // One page per stretch of rim the pointer travels along.
    const perPage = (radius * STEP * Math.PI) / 180;
    glideTo(clamp(startFrac - dy / perPage), undefined, GLIDE_HELD);
  });
  function end(e: PointerEvent) {
    if (e.pointerId !== pointer) return;
    pointer = null;
    root.classList.remove('is-turning');
    if (dragged) snap();
  }
  // Wherever it's let go — off the dial too.
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  // --- Choosing a page: turn to it, then hand over --------------------------
  let passThrough = false;
  let choosing = false; // a chosen page's turn isn't to be interrupted
  links.forEach((link, i) => {
    link.addEventListener('click', (e) => {
      if (passThrough) return;
      e.preventDefault();
      e.stopPropagation();
      if (dragged) {
        dragged = false;
        return;
      }
      choosing = true;
      settleTo(i, () => {
        choosing = false;
        opts.onChoose(i, link);
      });
    });
    link.addEventListener('focus', () => !choosing && aimed !== i && settleTo(i));
  });

  return {
    links,
    layout,
    settleTo,
    nearest,
    /** Jumps straight to a page, unanimated. */
    set(i: number) {
      cancelAnimationFrame(frame);
      frame = 0;
      arrived = null;
      frac = aimed = i;
      render();
    },
    /** Follows a link as if clicked, past the dial's own click handling. */
    follow(link: HTMLAnchorElement) {
      passThrough = true;
      link.click();
      passThrough = false;
    },
  };
}
