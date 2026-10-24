import { createDial } from './dial';

/**
 * The menu as a full-screen dial (lib/dial), its wheel coming in from the
 * left. With nothing behind it to scroll, scrolling turns it a page at a
 * time, as do the arrow keys and dragging. Clicking a
 * page (or Enter) turns to it, closes the menu and goes there.
 * It opens turned to the section being read.
 *
 * Opening and closing belong to nav.ts ([data-menu-open] on the root).
 */
export function initDialMenu() {
  const root = document.documentElement;
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
  if (!menu || !toggle) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Wheel and touch turn the dial, not the page behind it.
  menu.setAttribute('data-lenis-prevent', '');

  const isOpen = () => root.hasAttribute('data-menu-open');
  const dial = createDial(menu, {
    side: 'left',
    turnByWheel: true,
    mouseDrag: true,
    size: (w, h) =>
      w < 861
        ? { radius: Math.max(360, h * 0.62), inset: 34 }
        : { radius: Math.min(Math.max(420, h * 0.78), 760), inset: Math.max(96, Math.min(w * 0.14, 220)) },
    onChoose: (_i, link) =>
      window.setTimeout(() => {
        if (isOpen()) toggle.click();
        dial.follow(link);
      }, reduced ? 0 : 120),
  });

  const setTabbable = () => dial.links.forEach((l) => (l.tabIndex = isOpen() ? 0 : -1));

  // Opening: turned to where the reader is.
  new MutationObserver(() => {
    setTabbable();
    if (!isOpen()) return;
    dial.layout();
    dial.set(Math.max(0, dial.links.findIndex((l) => l.hasAttribute('data-current'))));
    dial.links[dial.nearest()]!.focus({ preventScroll: true });
  }).observe(root, { attributes: true, attributeFilter: ['data-menu-open'] });

  // Up and down turn it; Enter on the focused page goes (as its click).
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    const by = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!by) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(dial.links.length - 1, dial.nearest() + by));
    dial.links[next]!.focus({ preventScroll: true });
  });

  window.addEventListener('resize', () => isOpen() && dial.layout());
  setTabbable();
  dial.layout();
}
