import { html } from '../lib/html';

/**
 * The right of the landing screen: a workshop arm standing on the page,
 * reaching for the pointer, opening its claw while it is pressed, and
 * holding up a sheet with "hello" on it. The arm is built and moved by
 * `lib/arm`, the sheet by `lib/paper`.
 */
export function arm() {
  return html`
    <div class="arm" data-arm>
      <canvas class="arm__canvas" data-arm-canvas role="img" aria-label="A robotic arm on a turntable that picks up a sheet of paper reading hello and holds it up, then turns to follow the pointer"></canvas>
      <p class="arm__hint meta" aria-hidden="true">Move to guide · hold to open the claw</p>
    </div>
  `;
}
