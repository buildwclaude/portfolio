import { html } from '../lib/html';
import { site } from '../content/site';

export function footer() {
  const { title, line, email, links } = site.contact;
  const year = new Date().getFullYear();

  return html`
    <footer class="footer" id="contact">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>

        <h2 class="footer__title title" data-reveal>${title}</h2>
        <p class="footer__line" data-reveal>${line}</p>

        <p class="footer__email" data-reveal>
          <a class="link link--underlined" href="mailto:${email}">${email}</a>
        </p>

        <ul class="footer__links" data-reveal>
          ${links.map(
            (link) => html`
              <li>
                <a class="link" href="${link.href}" rel="me noreferrer" target="_blank">
                  ${link.label}
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
    </footer>
  `;
}
