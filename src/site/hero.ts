import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { coursesFolder } from './courses-folder';

/**
 * The landing screen: a hairline strip, then — between the rules — the
 * statement with three credential lines under it, and the way into the
 * work along the foot. The right side holds the courses folder
 * (site/courses-folder).
 * Set aside, ready to swap back in: the interaction loop (site/interaction),
 * the vine (site/vine) and the WebGL scenes (components/ribbon,
 * components/console, via data-scene).
 * Copy comes from `content/site.ts`.
 */
export function hero() {
  const { eyebrow, lines, credentials } = site.hero;

  return html`
    <section class="hero shell" id="intro" aria-labelledby="hero-title">
      <div class="hero__strip meta" data-reveal>
        <span>${eyebrow}</span>
        <span class="hero__strip-role">${site.meta.role}</span>
      </div>

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

        <ul class="hero__creds" data-reveal>
          ${credentials.map((line) => html`<li>${raw(emphasise(line))}</li>`)}
        </ul>
      </div>

      ${coursesFolder()}

      <div class="hero__foot" data-reveal>
        <a class="hero__cta meta" href="#warp-work">
          <span>Featured projects</span><span class="hero__cta-arrow" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  `;
}

/** Escapes a credential line and sets its **names** in <strong>. */
function emphasise(line: string) {
  return html`${line}`.__html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
