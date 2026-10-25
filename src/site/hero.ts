import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { pageHref } from './paths';
import { workedWith } from './worked-with';
import { frames } from './frames';

/**
 * The landing screen, set the way Areal opens: everything small and in the
 * middle — a portrait, the name over the role, one quiet line, two buttons
 * and the places worked with. Under it, the fan of frames (site/frames).
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
          <a class="pill pill--dark" href="${pageHref.contact}">Get in touch</a>
          <a class="pill" href="#warp-work">Works</a>
        </p>
        ${workedWith()}
      </div>

      ${frames()}
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
