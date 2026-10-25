import { html } from '../lib/html';

/**
 * A paper clip, drawn as one stroke, in a colour. It sits over the top edge
 * of whatever it holds (components/clip.css places and tilts it).
 */
export function clip(color: string, extra = '') {
  return html`
    <svg class="clip ${extra}" viewBox="0 0 22 58" aria-hidden="true" style="--clip:${color}">
      <path d="M15 17v27a4.5 4.5 0 0 1-9 0V10a6.5 6.5 0 0 1 13 0v35a10 10 0 0 1-20 0V19" />
    </svg>
  `;
}
