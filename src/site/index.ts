import { html } from '../lib/html';
import { site } from '../content/site';
import { header } from './header';
import { kodama } from './kodama';
import { hero } from './hero';
import { work } from './work';
import { about } from './about';
import { experiments } from './experiments';
import { footer } from './footer';

/**
 * The whole page, assembled once at build time and written into
 * index.html. Nothing here runs in the browser.
 */
export function renderPage(): string {
  const cards = site.hero.cards;
  const notes = site.hero.notes;
  const shown = notes.filter((note) => note.value);

  return html`
    <a class="skip-link" href="#main">Skip to content</a>

    <span id="top" class="visually-hidden"></span>
    ${header()} ${kodama()}

    <main class="page" id="main" tabindex="-1">
      ${hero()}
      <div class="plant-wrapper shell grid" aria-hidden="true">
        <div class="hero-cards plant-cards" aria-hidden="true" data-mounted="false">
          ${cards.map((c, i) => html`
            <div class="hero-card" style="--i:${i}; --delay:${i}">
              <div class="hero-card__shadow"></div>
              <img class="hero-card__img" src="${c.src}" width="${c.width}" height="${c.height}"
                   alt="" draggable="false" loading="eager" decoding="async"
                   ${i === 0 ? 'fetchpriority="high"' : ''}>
            </div>
          `)}
        </div>
        <img src="/plant.png" alt="Plant" class="plant-image" />
        
        ${shown.length > 0 && html`
          <dl class="plant-notes">
            ${shown.map((note) => html`
              <div class="hero__note">
                <dt class="meta">${note.label}</dt>
                <dd>${note.value}</dd>
              </div>
            `)}
          </dl>
        `}
      </div>
      ${work()}
      ${about()}
      ${experiments()}
    </main>

    ${footer()}
  `.__html;
}
