import { html, raw } from '../lib/html';
import { site } from '../content/site';

/** Small line glyphs for the `'icon'` wordmarks, drawn in the text's colour. */
const GLYPHS: Record<string, string> = {
  cube: '<path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z"/><path d="M4.5 7.7L12 12l7.5-4.3M12 12v8.5"/>',
  spark: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
};

/**
 * "Experience and recognition": the places worked with and the honours, as
 * quiet grey wordmarks (content: site.hero.workedWith). Under the statement
 * on the landing screen.
 */
export function workedWith() {
  const { label, names } = site.hero.workedWith;
  return html`
    <div class="worked" data-reveal>
      <p class="worked__label meta">${label}</p>
      <ul class="worked__names">
        ${names.map(
          (n) => html`
            <li class="worked__name worked__name--${n.mark}">
              ${n.logo
                ? html`<img src="${n.logo}" alt="${n.name}" height="22" />`
                : html`${n.mark === 'icon' && n.glyph
                    ? raw(`<svg viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[n.glyph] ?? ''}</svg>`)
                    : ''}<span>${n.name}</span>`}
            </li>
          `,
        )}
      </ul>
    </div>
  `;
}
