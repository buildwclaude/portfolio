import { html, raw } from '../lib/html';
import { site } from '../content/site';

/**
 * The hero is a grid of four blocks — eyebrow, statement, introduction and
 * margin notes. Copy comes from `content/site.ts`; adding or removing a
 * line or a note needs no change here.
 */
export function hero() {
  const { eyebrow, lines, intro } = site.hero;

  return html`
    <section class="hero shell grid" aria-labelledby="hero-title">
      <div class="hero-spline" aria-hidden="true" data-reveal>
        <script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.3/build/spline-viewer.js"></script>
        <spline-viewer url="https://prod.spline.design/qgOVv8VbJCdHQsjX/scene.splinecode"></spline-viewer>
      </div>
      <p class="hero__eyebrow meta" data-reveal>${eyebrow}</p>

      <h1 class="hero__display display" id="hero-title">
        ${lines.map(
          (line, i) => html`
            <span class="hero__line" data-reveal-line style="--line-index:${i}">
              <span class="hero__line-inner">${line}</span>
            </span>
          `,
        )}
      </h1>

      <div class="hero__intro lead" data-reveal>
        <div class="hero__intro-corner hero__intro-corner--tr" aria-hidden="true"></div>
        <div class="hero__intro-corner hero__intro-corner--bl" aria-hidden="true"></div>
        <p>${raw(intro)}</p>
      </div>

      <div class="hero__image-wrapper" data-reveal>
        <img class="hero__image" src="/sofa.jpg" alt="Editorial interior" />
      </div>

      <a class="hero__scroll meta" href="#work">
        <span>${site.work.title}</span>
        <span class="hero__scroll-rule" aria-hidden="true"></span>
      </a>
    </section>
  `;
}
