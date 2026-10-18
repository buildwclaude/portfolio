import { html } from '../lib/html';
import { site } from '../content/site';

export function footer() {
  const { title, line, email, links } = site.contact;
  const year = new Date().getFullYear();

  return html`
    <footer class="footer" id="contact">
      <div class="shell grid">
        <div class="section__head">
          <h2 class="section__title">${title}</h2>
          <span class="section__index">Say hello</span>
        </div>
        <div class="section__rule" aria-hidden="true"></div>

        <div class="footer__lead" data-reveal>
          <p class="footer__line kicker">${line}</p>
          <p class="footer__email">
            <a href="mailto:${email}"><span>${email}</span><span class="footer__email-arrow" aria-hidden="true">↗</span></a>
          </p>
        </div>

        <ul class="footer__links" data-reveal-stagger>
          ${links.map(
            (link, i) => html`
              <li data-reveal>
                <a href="${link.href}" rel="me noreferrer" target="_blank">
                  <span class="kicker">${String(i + 1).padStart(2, '0')}</span>
                  <span>${link.label}</span>
                  <span class="footer__link-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            `,
          )}
        </ul>

        <p class="footer__legal meta">
          <span>© ${year} ${site.meta.name}</span>
          <span>${site.meta.role}</span>
        </p>
      </div>
      <div class="footer__trail" aria-hidden="true">
        <canvas class="footer__trail-canvas" data-trail-canvas></canvas>
      </div>
    </footer>
  `;
}
