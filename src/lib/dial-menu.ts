/**
 * The menu as a dial — after a watch-bezel selector: the pages sit around
 * the rim of a large wheel coming in from the left edge, tilting with the
 * curve and fading as they turn away, with fine ticks round the rim. The one
 * at the pointer stands upright and full, its chip filled and a line about it
 * beneath. Scroll, drag or the arrow keys turn the wheel, and it settles on
 * the nearest page; clicking a page (or Enter) turns to it, closes the menu
 * and goes there. It opens turned to the section being read.
 *
 * Opening and closing belong to nav.ts ([data-menu-open] on the root).
 */

/** Angle between pages on the rim, degrees. */
const STEP = 15;
/** Angle between ticks, degrees. */
const TICK = 3;
const SETTLE_MS = 380;

export function initDialMenu() {
  const root = document.documentElement;
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const wheel = menu?.querySelector<HTMLElement>('[data-dial]');
  const ticks = menu?.querySelector<SVGSVGElement>('[data-dial-ticks]');
  const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
  if (!menu || !wheel || !ticks || !toggle) return;
  const items = Array.from(menu.querySelectorAll<HTMLElement>('[data-dial-item]'));
  const links = items.map((item) => item.querySelector<HTMLAnchorElement>('a')!);
  const last = items.length - 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Wheel and touch turn the dial, not the page behind it.
  menu.setAttribute('data-lenis-prevent', '');

  let radius = 0;
  let frac = 0;
  let settling = 0;
  let snapTimer = 0;
  let passThrough = false;

  const isOpen = () => root.hasAttribute('data-menu-open');
  const nearest = () => Math.max(0, Math.min(last, Math.round(frac)));
  const clamp = (v: number) => Math.max(-0.35, Math.min(last + 0.35, v));

  /** Sizes the wheel to the screen and draws its ticks. */
  function layout() {
    const w = innerWidth;
    const h = innerHeight;
    const narrow = w < 861;
    radius = narrow ? Math.max(360, h * 0.62) : Math.min(Math.max(420, h * 0.78), 760);
    // The pointer sits a little in from the left edge; the wheel's centre is off-screen behind it.
    const pointerX = narrow ? 34 : Math.max(96, Math.min(w * 0.14, 220));
    menu!.style.setProperty('--dial-x', `${pointerX - radius}px`);
    menu!.style.setProperty('--dial-r', `${radius}px`);
    menu!.style.setProperty('--pointer-x', `${pointerX}px`);

    const size = radius * 2 + 40;
    ticks!.setAttribute('viewBox', `${-size / 2} ${-size / 2} ${size} ${size}`);
    ticks!.style.width = ticks!.style.height = `${size}px`;
    let marks = `<circle r="${radius}" class="dial__rim"/>`;
    for (let a = -180; a < 180; a += TICK) {
      const major = a % STEP === 0;
      const r0 = radius - (major ? 14 : 8);
      const t = (a * Math.PI) / 180;
      marks += `<line x1="${(r0 * Math.cos(t)).toFixed(1)}" y1="${(r0 * Math.sin(t)).toFixed(1)}" x2="${(radius * Math.cos(t)).toFixed(1)}" y2="${(radius * Math.sin(t)).toFixed(1)}"${major ? ' class="is-major"' : ''}/>`;
    }
    ticks!.innerHTML = `<g data-dial-spin>${marks}</g>`;
    render();
  }

  function render() {
    const spin = ticks!.querySelector<SVGGElement>('[data-dial-spin]');
    spin?.setAttribute('transform', `rotate(${-frac * STEP})`);
    const at = nearest();
    items.forEach((item, i) => {
      const d = i - frac;
      const angle = d * STEP;
      item.style.transform = `rotate(${angle}deg) translateX(${radius + 18}px) translateY(-50%)`;
      item.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 0.3));
      item.style.visibility = Math.abs(angle) > 80 ? 'hidden' : '';
      item.classList.toggle('is-selected', i === at);
      links[i]!.tabIndex = isOpen() ? 0 : -1;
    });
  }

  /** Turns the dial smoothly to a page. */
  function settleTo(target: number, then?: () => void) {
    cancelAnimationFrame(settling);
    const from = frac;
    if (reduced || Math.abs(from - target) < 0.001) {
      frac = target;
      render();
      then?.();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SETTLE_MS);
      frac = from + (target - from) * (1 - Math.pow(1 - t, 3));
      render();
      if (t < 1) settling = requestAnimationFrame(step);
      else then?.();
    };
    settling = requestAnimationFrame(step);
  }
  const snap = () => settleTo(nearest());

  /** Turns to a page, closes the menu and goes there. */
  function go(i: number) {
    settleTo(i, () => {
      window.setTimeout(() => {
        if (isOpen()) toggle!.click();
        passThrough = true;
        links[i]!.click();
        passThrough = false;
      }, reduced ? 0 : 120);
    });
  }

  // --- Opening: turned to where the reader is ------------------------------
  new MutationObserver(() => {
    if (!isOpen()) return render();
    layout();
    const current = links.findIndex((l) => l.hasAttribute('data-current'));
    frac = Math.max(0, current);
    render();
    links[nearest()]!.focus({ preventScroll: true });
  }).observe(root, { attributes: true, attributeFilter: ['data-menu-open'] });

  // --- Scrolling turns it --------------------------------------------------
  menu.addEventListener(
    'wheel',
    (e) => {
      if (!isOpen()) return;
      e.preventDefault();
      cancelAnimationFrame(settling);
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      frac = clamp(frac + delta / 260);
      render();
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    },
    { passive: false },
  );

  // --- Dragging turns it (up and down, along the rim) ----------------------
  let pointer: number | null = null;
  let startY = 0;
  let startFrac = 0;
  let dragged = false;
  menu.addEventListener('pointerdown', (e) => {
    if (!isOpen() || e.button !== 0) return;
    pointer = e.pointerId;
    startY = e.clientY;
    startFrac = frac;
    dragged = false;
  });
  menu.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointer) return;
    const dy = e.clientY - startY;
    if (!dragged && Math.abs(dy) < 5) return;
    if (!dragged) {
      dragged = true;
      cancelAnimationFrame(settling);
      menu.classList.add('is-turning');
      try {
        menu.setPointerCapture(e.pointerId);
      } catch {
        // Not a tracked pointer; the drag still works without capture.
      }
    }
    // One page per stretch of rim the pointer travels along.
    const perPage = (radius * STEP * Math.PI) / 180;
    frac = clamp(startFrac - dy / perPage);
    render();
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return;
    pointer = null;
    menu.classList.remove('is-turning');
    if (dragged) snap();
  };
  menu.addEventListener('pointerup', end);
  menu.addEventListener('pointercancel', end);

  // --- Clicking a page: turn to it, then go --------------------------------
  links.forEach((link, i) => {
    link.addEventListener('click', (e) => {
      if (passThrough) return;
      e.preventDefault();
      e.stopPropagation(); // nav.ts would close the menu before the turn
      if (dragged) {
        dragged = false;
        return;
      }
      go(i);
    });
    link.addEventListener('focus', () => isOpen() && Math.round(frac) !== i && settleTo(i));
  });

  // --- Keys: up and down turn it, Enter goes --------------------------------
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    const by = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (by) {
      e.preventDefault();
      const next = Math.max(0, Math.min(last, nearest() + by));
      links[next]!.focus({ preventScroll: true });
      settleTo(next);
    }
  });

  window.addEventListener('resize', () => isOpen() && layout());
  layout();
}
