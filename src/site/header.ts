import { html } from '../lib/html';
import { dialParts } from './dial';

/**
 * The header: a Menu button, which opens the menu as a dial — the pages
 * around the rim of a large wheel, turned to choose (lib/dial-menu). On the
 * landing screen the same dial is already in view, so the button waits until
 * it has scrolled away (lib/hero-dial).
 */
export function header() {
  return html`
    <header class="header" data-header>
      <div class="shell header__inner">
        <nav class="nav" aria-label="Primary">
          <div class="dial" id="primary-menu" data-menu>
            ${dialParts({ navLinks: true })}
            <p class="dial__hint" aria-hidden="true">Scroll or drag to turn · click to go</p>
          </div>
        </nav>

        <button
          class="nav__toggle"
          type="button"
          aria-expanded="false"
          aria-controls="primary-menu"
          data-menu-toggle
        >
          <svg class="nav__dial-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25"/><path d="M8 1.75v2.5"/></svg>
          <span data-menu-label>Menu</span>
        </button>
      </div>
    </header>
  `;
}
