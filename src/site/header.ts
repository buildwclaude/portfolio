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
            <li class="nav__item">
              <button class="nav__theme-btn" id="theme-toggle" aria-label="Toggle dark mode">
                <svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </button>
            </li>
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
