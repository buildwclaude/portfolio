import { html, raw } from '../lib/html';
import { site } from '../content/site';

/**
 * The hero, laid out like a printed index page: a top strip, the statement
 * with its doodles drawn over it, an introduction beside the margin notes,
 * and a numbered index of the page along the bottom. Copy comes from
 * `content/site.ts`.
 */
export function hero() {
  const { eyebrow, lines, scribble, intro, notes, index, cards } = site.hero;

  return html`
    <section class="hero shell" id="intro" aria-labelledby="hero-title">
      <div class="hero__strip meta" data-reveal>
        <span>${eyebrow}</span>
        <span class="hero__strip-role">${site.meta.role}</span>
      </div>

      <div class="hero__stage">
        <h1 class="hero__display display" id="hero-title">
          ${lines.map(
            (line, i) => html`
              <span class="hero__line hero__line--${i === 0 ? 'light' : 'bold'}" data-reveal-line style="--line-index:${i}">
                <span class="hero__line-inner">
                  ${line}
                  ${i === 0 ? html`<img class="hero__avatar" src="/avatar.png" alt="" aria-hidden="true" />` : ''}
                  ${i === 1 ? html`<img class="hero__vines" src="/vines.png?v=2" alt="" aria-hidden="true" />` : ''}
                </span>
              </span>
            `,
          )}
        </h1>

        <p class="hero__scribble" aria-hidden="true">
          <svg class="hero__scribble-arrow" viewBox="0 0 64 48" fill="none">
            <path d="M58 40 C 44 44, 22 38, 12 14" />
            <path d="M4 20 L 12 12 L 19 21" />
          </svg>
          <span>${scribble}</span>
        </p>

        <div class="hero-cards" aria-hidden="true" data-reveal data-mounted="true">
          ${cards.map(
            (card, i) => html`
              <div class="hero-card" style="--delay:${i}">
                <div class="hero-card__shadow"></div>
                <img class="hero-card__img" src="${card.src}" width="${card.width}" height="${card.height}" alt="" />
              </div>
            `,
          )}
        </div>
      </div>

      <div class="hero__lower">
        <p class="hero__label meta" data-reveal>(About)</p>

        <div class="hero__intro" data-reveal>
          <p>${raw(intro)}</p>
        </div>

        <dl class="hero__notes" data-reveal>
          ${notes.map(
            (n) =>
              n.value &&
              html`
                <div class="hero__note">
                  <dt class="meta">${n.label.trim()}</dt>
                  <dd>${n.value}</dd>
                </div>
              `,
          )}
        </dl>
      </div>

      <nav class="hero__index" aria-label="On this page">
        <ol>
          ${index.map(
            (item, i) => html`
              <li>
                <a href="${item.href}">
                  <span class="hero__index-num">${raw(String(i + 1).padStart(2, '0'))}</span>
                  <span class="hero__index-label">${item.label}</span>
                </a>
              </li>
            `,
          )}
        </ol>
        <a class="hero__scroll meta" href="#warp-work">
          <span>Scroll</span>
          <span class="hero__scroll-rule" aria-hidden="true"></span>
        </a>
      </nav>
    </section>
  `;
}
