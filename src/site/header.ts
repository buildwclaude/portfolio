import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { pageHref, resolveHref, type Page } from './paths';

/**
 * A word in the top bar: brackets that close in around it on hover, and its
 * letters rolling up one after another to a second copy underneath.
 */
function rolling(label: string, after: unknown = '') {
  const letters = [...label].map(
    (ch, i) => html`<span class="roll__ch" style="--i:${i}" data-ch="${ch}">${ch === ' ' ? raw('&nbsp;') : ch}</span>`,
  );
  return html`
    <span class="roll__br" aria-hidden="true">[</span>
    <span class="roll" aria-label="${label}"><span aria-hidden="true">${letters}</span></span>${after}
    <span class="roll__br" aria-hidden="true">]</span>
  `;
}

/**
 * The top bar on every page: the name at the left, set as the playground
 * names itself; the pages in the middle; Contact at the right. On a phone
 * the pages fold into a Menu button and a full-screen list (lib/nav opens
 * and closes it), kept outside the bar: the bar's blur would otherwise
 * hold the list inside its own box.
 */
export function header(page: Page = 'home') {
  const middle = site.nav.filter((item) => item.href !== 'contact/');
  const contact = site.nav.find((item) => item.href === 'contact/');
  const current = (href: string) => (resolveHref(href, page) === pageHref[page] ? raw('aria-current="page"') : '');

  return html`
    <header class="topbar" data-header>
      <a class="topbar__name" href="${pageHref.home}">${site.meta.shortName}</a>

      <nav class="topbar__nav" aria-label="Primary">
        ${middle.map(
          (item) => html`<a class="topbar__link" href="${resolveHref(item.href, page)}" data-nav-link ${current(item.href)}>${rolling(item.label)}</a>`,
        )}
      </nav>

      ${contact &&
      html`<a class="topbar__link topbar__contact" href="${resolveHref(contact.href, page)}" data-nav-link ${current(contact.href)}>${rolling(contact.label, html`<span class="topbar__arrow" aria-hidden="true">→</span>`)}</a>`}

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
