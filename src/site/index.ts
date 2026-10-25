import { html } from '../lib/html';
import { site } from '../content/site';
import { header } from './header';
import { hero } from './hero';
import { warp } from './warp';
import { footer } from './footer';
import { aboutPage } from './about-page';
import { experimentsPage } from './experiments';
import { contactPage } from './contact-page';
import type { Page } from './paths';

/**
 * A page, assembled once at build time and written into its HTML file
 * (index.html, about/index.html, contact/index.html). Nothing here runs in
 * the browser.
 *
 * The home page is short: the landing screen, the featured work and the
 * sign-off. About, Experiments and Contact are pages of their own, all
 * reached from the dial.
 */
export function renderPage(page: Page = 'home'): string {
  if (page !== 'home') {
    return html`
      <a class="skip-link" href="#main">Skip to content</a>
      ${header(page)}
      <main class="page" id="main" tabindex="-1">
        ${{ about: aboutPage, experiments: experimentsPage, contact: contactPage }[page]()}
      </main>
      ${footer()}
      ${overlays()}
    `.__html;
  }

  return html`
    <a class="skip-link" href="#main">Skip to content</a>

    <span id="top" class="visually-hidden"></span>
    ${header()}

    <main class="page page--paper" id="main" tabindex="-1">
      ${hero()}
      ${warp()}
    </main>

    ${footer()}

    ${overlays()}
  `.__html;
}

/**
 * What opens over any page: the playground (lib/playground), its detail
 * panel and the case study (lib/warp-detail). Hidden until called, and on
 * every page, since the scripts that drive them run on every page.
 */
function overlays() {
  return html`
    <div class="pg" id="pg" aria-hidden="true">
      <canvas id="gl"></canvas>
      <div class="hud tl pg-only">
        <b id="pg-name">${site.meta.shortName}</b>
        <div class="room-toggle" id="room-toggle" role="tablist" aria-label="Room" data-room="projects">
          <div class="room-slider"></div>
          <button class="room-tab active" id="room-projects" role="tab" aria-selected="true" type="button">Projects</button>
          <button class="room-tab" id="room-art" role="tab" aria-selected="false" type="button">Art</button>
        </div>
      </div>
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
      
      <div id="panel-hero" class="panel-hero" hidden></div>
      <div id="panel-meta-grid" class="panel-meta-grid" hidden></div>
      <div id="panel-content" class="panel-content" hidden></div>

      <a class="panel-link" id="panel-link" href="#" target="_blank" rel="noopener">Visit project</a>
    </aside>

    <div class="detail" id="warp-detail" hidden>
      <div class="detail__scrim" data-detail-close></div>
      <div class="detail__panel" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <!-- the way back, and the section being read, which opens the list of them -->
        <nav class="detail__rail" aria-label="Case study">
          <button class="detail__close" type="button" data-detail-close>
            <span aria-hidden="true">←</span> Back
          </button>
          <div class="detail__toc" data-toc>
            <button class="detail__toc-btn" type="button" aria-expanded="false" aria-controls="detail-sections" data-toc-toggle>
              <span class="detail__toc-count" id="detail-count"></span>
              <span class="detail__toc-now" id="detail-now"></span>
              <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
            </button>
            <ol class="detail__sections" id="detail-sections"></ol>
          </div>
        </nav>

        <figure class="detail__figure">
          <img id="detail-img" src="" alt="" decoding="async" />
        </figure>
        <div class="detail__body">
          <header class="detail__head">
            <p class="detail__num" id="detail-num"></p>
            <h2 class="detail__title" id="detail-title"></h2>
            <p class="detail__meta" id="detail-meta"></p>
            <p class="detail__note" id="detail-note"></p>
          </header>
          <div id="detail-rich-content" class="detail__content"></div>
        </div>
      </div>
    </div>

    <div class="scrim" id="scrim"></div>
  `;
}
