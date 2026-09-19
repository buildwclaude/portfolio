import { html, raw } from '../lib/html';
import { site } from '../content/site';

/**
 * The companion.
 *
 * A tiny muted video, fixed below the header on the right. No container,
 * no border, no label — it is simply there. If the file is missing the
 * script removes the element, so an empty /public/kodama/ folder costs
 * nothing.
 */
export function kodama() {
  const { webm, mp4, poster, label } = site.kodama;

  // Decorative unless the owner has written a label for it.
  const describedAttrs = label
    ? raw(`aria-label="${label}" role="img"`)
    : raw('aria-hidden="true"');

  return html`
    <div class="kodama" data-kodama>
      <video
        class="kodama__video"
        ${poster ? raw(`poster="${poster}"`) : ''}
        ${describedAttrs}
        width="174"
        height="256"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        disablepictureinpicture
        tabindex="-1"
      >
        <source src="${webm}" type="video/webm" />
        <source src="${mp4}" type="video/mp4" />
      </video>
    </div>
  `;
}
