import { html } from '../lib/html';
import { site } from '../content/site';

/**
 * The Contact page (contact/), in the minimal style (components/minimal.css):
 * the sign-off and the address, then where else to find me, and what I'm
 * doing now.
 */
export function contactPage() {
  const { title, line, email, links } = site.contact;
  const now = site.hero.notes.find((n) => n.label.trim() === 'Currently')?.value;

  return html`
    <div class="m-page">
      <header class="m-intro m-col" data-reveal>
        <div class="m-body">
          <h1 class="m-label m-label--page">${title}</h1>
          <p class="m-lead">${line}</p>
          <p class="m-actions"><a class="m-chip" href="mailto:${email}">${email}</a></p>
        </div>
      </header>

      <div class="m-blocks">
        <section class="m-block" data-reveal>
          <h2 class="m-label">Elsewhere</h2>
          <div class="m-body">
            <ul class="m-rows">
              ${links.map(
                (link) => html`
                  <li class="m-row">
                    <a class="m-row__link" href="${link.href}" rel="me noreferrer" target="_blank">
                      <span class="m-row__head">
                        <span class="m-row__title">${link.label}</span>
                        <span class="m-row__meta" aria-hidden="true">↗</span>
                      </span>
                    </a>
                  </li>
                `,
              )}
            </ul>
          </div>
        </section>

        ${now &&
        html`
          <section class="m-block" data-reveal>
            <h2 class="m-label">Currently</h2>
            <div class="m-body"><p class="m-text">${now}</p></div>
          </section>
        `}
      </div>
    </div>
  `;
}
