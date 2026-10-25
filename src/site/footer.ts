import { html } from '../lib/html';
import { site } from '../content/site';
import { scatter } from './gloss';

/**
 * The sign-off at the foot of every page: the little tree, "Thanks for
 * stopping by!" and one small line.
 * The pages themselves are all on the dial (site/dial); there is no second
 * menu down here.
 */
export function footer() {
  const { line, madeWith } = site.contact;
  const year = new Date().getFullYear();

  return html`
    <footer class="m-footer" id="contact">
      <div data-reveal>
        <span class="m-footer__mark">
          <img class="m-footer__tree" src="${site.me.signoff}" alt="" width="294" height="370" loading="lazy" decoding="async" />
          ${scatter([
            { shape: 'heart', color: 'pink', x: 'calc(100% + 4px)', y: '-8px', size: 22, turn: 16, phone: true },
          ])}
        </span>
        <p class="m-lead">${line}</p>
        <p class="m-footer__small">${madeWith} © ${year} ${site.meta.name}</p>
      </div>
    </footer>
  `;
}
