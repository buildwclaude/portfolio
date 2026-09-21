import { html } from '../lib/html';
import { site } from '../content/site';
import { header } from './header';
import { kodama } from './kodama';
import { hero } from './hero';
import { inlinePlayground } from './inline-playground';
import { about } from './about';
import { experiments } from './experiments';
import { footer } from './footer';

/**
 * The whole page, assembled once at build time and written into
 * index.html. Nothing here runs in the browser.
 */
export function renderPage(): string {
  const cards = site.hero.cards;

  return html`
    <a class="skip-link" href="#main">Skip to content</a>

    <span id="top" class="visually-hidden"></span>
    ${header()} 

    <main class="page" id="main" tabindex="-1">
      ${hero()}
      ${inlinePlayground()}
      ${about()}
      ${experiments()}
    </main>

    ${footer()}

    <!-- DETAIL PANEL -->
    <aside class="sheet panel" id="panel" aria-hidden="true">
      <div class="sheet-head">
        <span id="panel-meta">Tag · 2024</span>
        <button class="icon-btn" id="panel-close" type="button" aria-label="Close project"></button>
      </div>
      <h2 id="panel-title">Title</h2>
      <span class="panel-role" id="panel-role">Role</span>
      <p id="panel-desc">Description.</p>
      <a class="panel-link" id="panel-link" href="#" target="_blank" rel="noopener">Visit project</a>
    </aside>

    <div class="scrim" id="scrim"></div>
  `.__html;
}
