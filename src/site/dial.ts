import { html, raw } from '../lib/html';
import { site } from '../content/site';

/** A small line icon for each page, drawn in the text's colour. */
const ICONS: Record<string, string> = {
  '#playground': '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  '#warp-work': '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>',
  '#about': '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>',
  '#experiments': '<path d="M9.5 3.5h5M10.5 3.5v5.2L5.6 17.4A2 2 0 0 0 7.4 20.5h9.2a2 2 0 0 0 1.8-3.1l-4.9-8.7V3.5"/><path d="M7.8 14h8.4"/>',
  '#contact': '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
};

/** A line under each page's name on the dial. */
const NOTES: Record<string, string> = {
  '#playground': 'Toys, sketches and things to poke at',
  '#warp-work': 'Selected case studies',
  '#about': 'Who I am and how I work',
  '#experiments': 'Personal projects and craft',
  '#contact': 'Say hello',
};

/**
 * A dial's insides: the ticked rim, the pages around it and the pointer
 * (turned by lib/dial). Used by the menu (site/header) and the landing
 * screen (site/hero). `navLinks` marks the menu's links, the ones nav.ts
 * watches for the current section.
 */
export function dialParts({ navLinks = false } = {}) {
  return html`
    <div class="dial__wheel" data-dial>
      <div class="dial__ring" aria-hidden="true" data-dial-ring><svg class="dial__ticks" data-dial-ticks></svg></div>
      <ul class="dial__items">
        ${site.nav.map(
          (item, i) => html`
            <li class="dial__item" data-dial-item>
              <a class="dial__link" href="${item.href}" ${navLinks ? raw('data-nav-link') : ''}>
                <span class="dial__chip" aria-hidden="true">
                  <svg viewBox="0 0 24 24">${raw(ICONS[item.href] ?? '')}</svg>
                </span>
                <span class="dial__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
                <span class="dial__text">
                  <span class="dial__label">${item.label}</span>
                  <span class="dial__note">${NOTES[item.href] ?? ''}</span>
                </span>
              </a>
            </li>
          `,
        )}
      </ul>
    </div>
    <span class="dial__pointer" aria-hidden="true" data-dial-pointer></span>
  `;
}
