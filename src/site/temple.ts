import { html } from '../lib/html';

/**
 * The right of the landing screen: a Greek temple seen from above at an
 * angle, built of fine vertical lines — blue roof, pale columns in front,
 * glowing orange down the side — dissolving upward into drifting specks.
 * The markup is only the stage; the drawing is painted into the canvas by
 * `lib/temple`.
 */
export function temple() {
  return html`
    <div class="temple" data-temple>
      <canvas class="temple__canvas" data-temple-canvas role="img" aria-label="A Greek temple drawn in fine vertical lines, dissolving upward into points of light"></canvas>
    </div>
  `;
}
