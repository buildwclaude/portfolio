import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { pageHref, resolveHref, type Page } from './paths';

/**
 * A word in the top bar: one span per letter, so lib/topbar can scramble
 * them on hover; brackets either side that show on the page you're on.
 */
function word(label: string) {
  const letters = [...label].map((ch) => html`<span class="scramble__ch">${ch === ' ' ? raw('&nbsp;') : ch}</span>`);
  return html`
    <span class="topbar__br" aria-hidden="true">[</span>
    <span class="scramble" aria-label="${label}" data-scramble><span aria-hidden="true">${letters}</span></span>
    <span class="topbar__br" aria-hidden="true">]</span>
  `;
}

/**
 * The top bar on every page: the name at the left, set as the playground
 * names itself; every page in the middle; the résumé at the right. On a
 * phone the pages fold into a Menu button and a full-screen list (lib/nav
 * opens and closes it), kept outside the bar: the bar's blur would
 * otherwise hold the list inside its own box.
 */
export function header(page: Page = 'home') {
  const current = (href: string) => (resolveHref(href, page) === pageHref[page] ? raw('aria-current="page"') : '');
  const resume = site.contact.links.find((l) => l.label === 'Résumé');

  return html`
    <header class="topbar" data-header>
      <a class="topbar__name" href="${pageHref.home}">${site.meta.shortName}</a>

      <nav class="topbar__nav" aria-label="Primary">
        ${site.nav.map(
          (item) => html`<a class="topbar__link" href="${resolveHref(item.href, page)}" data-nav-link ${current(item.href)}>${word(item.label)}</a>`,
        )}
      </nav>

      ${resume &&
      html`<a class="topbar__resume" href="${resume.href}" target="_blank" rel="noreferrer">${resume.label}<span aria-hidden="true">↗</span></a>`}

      <button class="topbar__toggle" type="button" aria-expanded="false" aria-controls="menu-panel" data-menu-toggle>
        <span data-menu-label>Menu</span>
      </button>
    </header>

    <nav class="menu-panel" id="menu-panel" aria-label="Menu" data-menu>
      <ol class="menu-panel__list">
        ${site.nav.map(
          (item, i) => html`
            <li style="--i:${i}">
              <a href="${resolveHref(item.href, page)}" ${current(item.href)}>
                <span class="menu-panel__num">${String(i + 1).padStart(2, '0')}</span>${item.label}
              </a>
            </li>
          `,
        )}
      </ol>
    </nav>
  `;
}
