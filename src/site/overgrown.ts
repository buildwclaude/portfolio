import { html } from '../lib/html';

/**
 * The right of the landing screen: a solarpunk walker — a tall machine on
 * splayed legs, long since stilled and taken back by moss and vines. A
 * painted still from /hero/overgrown.webp, cut out of its white ground.
 */
export function overgrown() {
  return html`
    <figure class="overgrown">
      <img
        class="overgrown__img"
        src="hero/overgrown.webp"
        width="1254"
        height="1254"
        alt="A tall walking machine on splayed legs, cream and sky-blue with yellow bands, overgrown with moss and hanging vines"
        decoding="async"
        fetchpriority="high"
      />
    </figure>
  `;
}
