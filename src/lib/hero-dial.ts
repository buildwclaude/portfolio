import { createDial } from './dial';

/**
 * The landing screen's dial (lib/dial), its wheel coming in from the right:
 * the same pages as the menu, turned the same way. Scrolling over it turns
 * it a page at a time once the mouse has been brought onto it — and then
 * only the dial, even past its first or last page — while scrolling the page
 * past it keeps scrolling the page. Dragging and the arrow keys turn it, and
 * clicking a page turns to it and goes there. It holds still under a resting
 * cursor.
 *
 * While it's in view it is the menu: [data-hero-dial-in-view] on the root
 * keeps the header's Menu button out of the way until it scrolls off.
 */
export function initHeroDial() {
  const root = document.querySelector<HTMLElement>('[data-hero-dial]');
  if (!root) return;
  const dial = createDial(root, {
    side: 'right',
    turnByWheel: true,
    mouseDrag: true,
    inPage: true,
    // Small enough that the first and last pages, tilted, stay on screen.
    size: (w, h) => ({ radius: Math.max(320, h * 0.58), inset: Math.min(72, w * 0.12) }),
    onChoose: (_i, link) => dial.follow(link),
  });
  // Up and down, with a page in it focused, turn it (focus turns it there).
  root.addEventListener('keydown', (e) => {
    const by = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!by) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(dial.links.length - 1, dial.nearest() + by));
    dial.links[next]!.focus({ preventScroll: true });
  });

  let resizing = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizing);
    resizing = window.setTimeout(dial.layout, 120);
  });
  new IntersectionObserver(([entry]) =>
    document.documentElement.toggleAttribute('data-hero-dial-in-view', entry!.isIntersecting),
  { threshold: 0.35 }).observe(root);

  document.fonts.ready.then(dial.layout).catch(dial.layout);
  dial.layout();
  // Rest on the middle page, so the rim shows pages above and below.
  dial.set(Math.floor((dial.links.length - 1) / 2));
}
