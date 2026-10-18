import { html } from '../lib/html';
import { site } from '../content/site';
import { shelf } from './shelf';

/**
 * About, set like the rest of the page: no cards, only the grid and its
 * hairlines. A spread introduces me — the portrait on the left, the greeting,
 * the opening paragraph and a few facts on the right — then what I practise,
 * the tools and what I do beyond design as three plain lists, what drives
 * the work as a pull quote — on frosted glass, with the trail's Stream
 * flowing behind it (lib/stream) — and an index of chapters that opens the reader
 * (#me), where the whole story lives.
 */
export function about() {
  const { title, paragraphs, columns } = site.about;
  const { portrait } = site.me;
  const facts = site.hero.notes.filter((n) => n.value);
  const first = site.meta.name.split(' ')[0] ?? site.meta.name;

  return html`
    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="shell grid">
        <div class="section__head">
          <h2 class="section__title" id="about-title">${title}</h2>
          <span class="section__index">Profile</span>
        </div>
        <div class="section__rule" aria-hidden="true"></div>

        <figure class="about__figure" data-reveal>
          <img class="about__portrait" src="${portrait.src.replace(/^\//, '')}" alt="${portrait.alt}" width="1000" height="1000" loading="lazy" decoding="async" />
          <figcaption class="about__caption kicker">
            <span>${site.meta.name}</span><span>${site.meta.role}</span>
          </figcaption>
        </figure>

        <div class="about__body" data-reveal>
          <h3 class="about__hello">
            <span class="about__hello-light">hello,</span>
            <span class="about__hello-bold">i’m ${first.toLowerCase()}.</span>
          </h3>
          <p class="about__lead">${paragraphs[0]}</p>

          ${facts.length > 0 &&
          html`
            <dl class="about__facts">
              ${facts.map((f) => html`<div class="about__fact"><dt class="kicker">${f.label.trim()}</dt><dd>${f.value}</dd></div>`)}
            </dl>
          `}

          <p class="about__actions">
            <a class="about__link" href="#me" data-sketchbook><span>Read my story</span><span class="about__arrow" aria-hidden="true">→</span></a>
            <a class="about__link" href="#me" data-chapter="Say hello"><span>Say hello</span><span class="about__arrow" aria-hidden="true">→</span></a>
          </p>
        </div>

        <div class="about__index" data-reveal-stagger>
          ${columns.map(
            (column, i) => html`
              <div class="about__group" data-reveal>
                <h4 class="about__group-label kicker"><span>${String(i + 1).padStart(2, '0')}</span>${column.label}</h4>
                <ul class="about__list">
                  ${column.items.map((item) => html`<li>${item}</li>`)}
                </ul>
              </div>
            `,
          )}
        </div>

        ${paragraphs[1] &&
        html`
          <figure class="about__quote stream-glass" data-reveal>
            <canvas class="stream-glass__flow" data-stream aria-hidden="true"></canvas>
            <figcaption class="kicker">What drives me</figcaption>
            <blockquote><p>${paragraphs[1]}</p></blockquote>
          </figure>
        `}

        ${shelf()}
      </div>
    </section>
  `;
}
