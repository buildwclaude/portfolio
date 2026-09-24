import { html } from '../lib/html';
import { site } from '../content/site';
import { shelf } from './shelf';

export function about() {
  const { title, paragraphs, columns } = site.about;

  return html`
    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="about-title">${title}</h2>
          <span class="section__index meta">02</span>
        </div>

        <div class="about__text" data-reveal>
          <!-- The homepage keeps to the first paragraph; the shelf below opens the rest. -->
          <p class="lead prose">${paragraphs[0]}</p>
        </div>

        <dl class="about__columns" data-reveal>
          ${columns.map(
            (column) => html`
              <div class="about__column">
                <dt class="meta">${column.label}</dt>
                <dd>
                  <ul class="about__list">
                    ${column.items.map((item) => html`<li>${item}</li>`)}
                  </ul>
                </dd>
              </div>
            `,
          )}
        </dl>

        ${shelf()}
      </div>
    </section>
  `;
}
