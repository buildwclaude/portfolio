import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { workedWith } from './worked-with';
import { tiles } from './tiles';

/**
 * The landing screen, set the way Areal opens: everything small and in the
 * middle — a portrait, the name over the role, one quiet line, the address
 * (a click copies it) and the places worked with. Under it, four small tiles (site/tiles).
 * Copy comes from `content/site.ts`.
 *
 * Set aside, ready to swap back in: the dial (site/dial, lib/hero-dial), the
 * arm (site/arm, lib/arm), the tunnel (site/tunnel, lib/tunnel), the orbit
 * (site/orbit, lib/orbit), the palace (site/palace, lib/palace), the temple
 * (site/temple), the glass grid (site/glass-grid), the courses folder
 * (site/courses-folder), the interaction loop (site/interaction), the vine
 * (site/vine) and the WebGL scenes (components/ribbon, components/console,
 * via data-scene).
 */
export function hero() {
  const { intro } = site.hero;
  const { portrait } = site.me;

  return html`
    <section class="hero" id="intro" aria-labelledby="hero-title">
      <div class="hero__center">
        <img class="hero__avatar" src="${portrait.src}" alt="${portrait.alt}" width="1000" height="1000" decoding="async" data-reveal />
        <h1 class="hero__title" id="hero-title" data-reveal>
          <span>${site.meta.name}</span>
          <span class="hero__role">${site.meta.role}</span>
        </h1>
        <p class="hero__intro" data-reveal>${intro}</p>
        <p class="hero__actions" data-reveal>
          <button class="copy-mail" type="button" data-copy="${site.contact.email}">
            <span class="copy-mail__dot" aria-hidden="true"></span>
            <span class="copy-mail__text" data-copy-label>${site.contact.email}</span>
            <svg class="copy-mail__icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" /><path d="M3 10.5V4a1.5 1.5 0 0 1 1.5-1.5H10" /></svg>
          </button>
        </p>
        ${workedWith()}
      </div>

      ${tiles()}
    </section>
  `;
}

/**
 * The portfolio description (site.hero.portfolioDescription): credential
 * lines, set aside for now. Drop `${portfolioDescription()}` back under the
 * statement to show them.
 */
export function portfolioDescription() {
  return html`
    <ul class="hero__creds" data-reveal>
      ${site.hero.portfolioDescription.map((line) => html`<li>${raw(emphasise(line))}</li>`)}
    </ul>
  `;
}

/** Escapes a credential line and sets its **names** in <strong>. */
function emphasise(line: string) {
  return html`${line}`.__html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
