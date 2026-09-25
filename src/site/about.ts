import { html } from '../lib/html';
import { site } from '../content/site';
import { shelf } from './shelf';

/**
 * About: everything about me in one section, kept short. A card introduces
 * me — portrait, the opening paragraph, what I focus on and where I am now —
 * beside a card of what I practise, the tools I use, what I do beyond design
 * and what drives the work. Under them, one card per chapter opens the
 * reader (#me), where the whole story lives.
 */
export function about() {
  const { title, paragraphs, columns } = site.about;
  const { portrait } = site.me;
  const facts = site.hero.notes.filter((n) => n.value);
  const first = site.meta.name.split(' ')[0];

  return html`
    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="about-title">${title}</h2>
          <span class="section__index meta">02</span>
        </div>

        <article class="about__intro" data-reveal>
          <img class="about__portrait" src="${portrait.src.replace(/^\//, '')}" alt="${portrait.alt}" width="1000" height="1000" loading="lazy" decoding="async" />
          <div class="about__body">
            <h3 class="about__hello"><span class="about__hi">Hello,</span> I’m ${first}.</h3>
            <p class="about__lead">${paragraphs[0]}</p>
            ${facts.length > 0 &&
            html`
              <dl class="about__facts">
                ${facts.map((f) => html`<div class="about__fact"><dt>${f.label.trim()}</dt><dd>${f.value}</dd></div>`)}
              </dl>
            `}
            <div class="about__actions">
              <a class="about__cta" href="#me" data-sketchbook>Read my story <span aria-hidden="true">→</span></a>
              <a class="about__ghost" href="#me" data-chapter="Say hello">Say hello</a>
            </div>
          </div>
        </article>

        <dl class="about__skills" data-reveal>
          ${columns.map(
            (column) => html`
              <div class="about__group">
                <dt class="about__label">${column.label}</dt>
                <dd>
                  <ul class="about__chips">
                    ${column.items.map((item) => html`<li class="about__chip">${item}</li>`)}
                  </ul>
                </dd>
              </div>
            `,
          )}
          ${paragraphs[1] &&
          html`
            <div class="about__group about__group--note">
              <dt class="about__label">What drives me</dt>
              <dd><p class="about__note">${paragraphs[1]}</p></dd>
            </div>
          `}
        </dl>

        ${shelf()}
      </div>
    </section>
  `;
}
