import { html } from '../lib/html';

/**
 * The right of the landing screen: a five-by-five grid of frosted glass
 * tiles over a soft green glow. The glass only reads because of what is
 * behind it, so the glow is the point — deep green through lime, in a shape
 * that slowly turns from a circle to a triangle to a square (the stylesheet),
 * over a pale wash that fades to clear glass at the rim. Its lean toward the
 * pointer lives in `lib/glass-grid`.
 */
export function glassGrid() {
  const tiles = Array.from({ length: 25 }, () => html`<span class="glass__tile"></span>`);

  return html`
    <div class="glass" data-glass aria-hidden="true">
      <div class="glass__stage">
        <div class="glass__glow">
          <span class="glass__blob glass__blob--halo"></span>
          <span class="glass__shape"></span>
        </div>
        <div class="glass__tiles">${tiles}</div>
      </div>
    </div>
  `;
}
