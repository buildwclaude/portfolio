import { html } from '../lib/html';
import { site } from '../content/site';
import { header } from './header';
import { kodama } from './kodama';
import { hero } from './hero';
import { warp } from './warp';
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
      ${warp()}
      ${about()}
      ${experiments()}
    </main>

    ${footer()}

    <div class="pg" id="pg" aria-hidden="true">
      <canvas id="gl"></canvas>
      <div class="hud tl pg-only"><b id="pg-name">${site.meta.shortName}</b><span>Playground</span></div>
      <div class="hud bl pg-only" id="coord" aria-hidden="true">0000 · 0000</div>
      <button class="hud tr pg-close" id="pg-close" type="button">
        <span>Close</span><span class="pg-esc">Esc</span>
      </button>
      <div class="label" id="label" aria-hidden="true"></div>
      <div class="pg-hint" id="pg-hint">Drag to wander · click a piece to open it</div>
      <div class="pg-loading" id="pg-loading">Building the room…</div>
    </div>

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
