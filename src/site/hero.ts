import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { dialParts } from './dial';
import { workedWith } from './worked-with';

/**
 * The landing screen: the statement with the places worked with under it
 * (site/worked-with), and the way into the work along the foot. The right
 * side holds a dial of the pages, its wheel coming in from the right edge
 * (site/dial, lib/hero-dial). The portfolio description (credential lines)
 * and the overgrown walker (site/overgrown) are set aside.
 * Set aside, ready to swap back in: the palace (site/palace, lib/palace),
 * the temple (site/temple), the glass
 * grid (site/glass-grid), the
 * courses folder (site/courses-folder),
 * the interaction loop (site/interaction),
 * the vine (site/vine) and the WebGL scenes (components/ribbon,
 * components/console, via data-scene).
 * Copy comes from `content/site.ts`.
 */
export function hero() {
  const { lines } = site.hero;

  return html`
    <section class="hero shell" id="intro" aria-labelledby="hero-title">

      <div class="hero__body">
        <h1 class="hero__display" id="hero-title">
          ${lines.map(
            (line, i) => html`
              <span class="hero__line hero__line--${i === 0 ? 'light' : 'bold'}" data-reveal-line style="--line-index:${i}">
                <span class="hero__line-inner">${line}</span>
              </span>
            `,
          )}
        </h1>

        ${workedWith()}
      </div>

      <div class="hero-dial dial" data-hero-dial>
        ${dialParts()}
        <p class="dial__hint" aria-hidden="true">Scroll to turn · click to go</p>
      </div>

      <div class="hero__foot" data-reveal>
        <a class="hero__cta meta" href="#warp-work">
          <span>Featured projects</span><span class="hero__cta-arrow" aria-hidden="true">↓</span>
        </a>
      </div>
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
