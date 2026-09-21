import { html, raw } from '../lib/html';
import { site } from '../content/site';

/**
 * The hero is a grid of four blocks — eyebrow, statement, introduction and
 * margin notes. Copy comes from `content/site.ts`; adding or removing a
 * line or a note needs no change here.
 */
export function hero() {
  const { eyebrow, lines, intro, notes, cards } = site.hero;

  return html`
    <section class="hero shell grid" aria-labelledby="hero-title">
      <div class="hero-cards" aria-hidden="true" data-reveal data-mounted="true" style="transform: translateX(20%) !important;">
        ${cards.map(
          (card, i) => html`
            <div class="hero-card" style="--delay:${i}">
              <div class="hero-card__shadow"></div>
              <img class="hero-card__img" src="${card.src}" width="${card.width}" height="${card.height}" alt="" />
            </div>
          `
        )}
      </div>
      
      <p class="hero__eyebrow" data-reveal>${eyebrow}</p>

      <h1 class="hero__display display" id="hero-title">
        ${lines.map(
          (line, i) => html`
            <span class="hero__line" data-reveal-line style="--line-index:${i}">
              <span class="hero__line-inner" style="display: inline-block; position: relative;">
                ${line}
                ${i === 0 ? html`<img class="hero__avatar" src="/avatar.png" alt="" aria-hidden="true" style="position: absolute; left: 100%; top: 50%; transform: translateY(-50%); margin-left: 20px;" />` : ''}
                ${i === 1 ? html`<img class="hero__doodles" src="/vines.png?v=2" alt="" aria-hidden="true" style="position: absolute; left: 0; top: 60.2%; transform: translateY(-50%) scaleX(1.05); transform-origin: left center; z-index: 10; pointer-events: none; width: 100%;" />` : ''}
              </span>
            </span>
          `,
        )}
      </h1>

      <div class="hero__intro lead" data-reveal>
        <div class="hero__intro-corner hero__intro-corner--tr" aria-hidden="true"></div>
        <div class="hero__intro-corner hero__intro-corner--bl" aria-hidden="true"></div>
        <p>${raw(intro)}</p>
      </div>
      
      <dl class="hero__notes" data-reveal>
        ${notes.map(
          (note) =>
            note.value &&
            html`
              <div class="hero__note">
                <dt>${note.label}</dt>
                <dd>${note.value}</dd>
              </div>
            `,
        )}
      </dl>



      <a class="hero__scroll meta" href="#work">
        <span>${site.work.title}</span>
        <span class="hero__scroll-rule" aria-hidden="true"></span>
      </a>
    </section>
  `;
}
