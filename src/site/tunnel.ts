import { html } from '../lib/html';

/**
 * The right of the landing screen: a well of curved screens, each showing a
 * piece of work, spiralling down to a pool of cobalt light where a figure
 * stands. The scene is built and drawn by `lib/tunnel`.
 */
export function tunnel() {
  return html`
    <div class="tunnel" data-tunnel>
      <canvas class="tunnel__canvas" data-tunnel-canvas role="img" aria-label="A spiral of curved screens showing project work, descending into a pool of blue light where a lone figure stands"></canvas>
    </div>
  `;
}
