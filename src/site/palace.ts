import { html } from '../lib/html';

/**
 * The right of the landing screen: a palace seen from above at an angle,
 * remade in fine vertical lines — navy stone, lit windows — dissolving
 * upward into drifting specks. The markup is only the stage; the drawing is
 * painted into the canvas by `lib/palace`, from /hero/palace.jpg.
 */
export function palace() {
  return html`
    <div class="palace" data-palace>
      <canvas class="palace__canvas" data-palace-canvas role="img" aria-label="A palace with a central dome and lit windows, drawn in fine vertical lines, dissolving upward into points of light"></canvas>
    </div>
  `;
}
