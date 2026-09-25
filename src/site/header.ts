import { html } from '../lib/html';
import { site } from '../content/site';

export function header() {
  return html`
    <header class="header" data-header>
      <div class="shell header__inner">
        <a class="header__mark" href="#top" aria-label="${site.meta.name} — back to top">
          <span class="header__seal" aria-hidden="true"></span>
          <span class="header__name">${site.meta.shortName}</span>
        </a>

        <nav class="nav" aria-label="Primary">
          <ul class="nav__list" id="primary-menu" data-menu>
            ${site.nav.map(
              (item) => html`
                <li class="nav__item">
                  <a class="nav__link" href="${item.href}" data-nav-link>${item.label}</a>
                </li>
              `,
            )}
          </ul>
        </nav>

        <button
          class="nav__toggle"
          type="button"
          aria-expanded="false"
          aria-controls="primary-menu"
          data-menu-toggle
        >
          <span data-menu-label>Menu</span>
        </button>
      </div>
    </header>
  `;
}
