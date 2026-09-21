import { html } from '../lib/html';
import { site } from '../content/site';

export function inlinePlayground() {
  return html`
    <section class="section" id="playground" aria-labelledby="playground-title">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="playground-title">Playground</h2>
          <span class="section__index meta">01 — 12</span>
        </div>
      </div>
      
      <div class="pg-inline-wrapper shell">
        <div class="pg-inline" id="pg">
          <canvas id="gl"></canvas>
          <div class="hud tl pg-only"><b id="pg-name">${site.meta.shortName}</b><span>Playground</span></div>
          <div class="hud bl pg-only" id="coord" aria-hidden="true">0000 · 0000</div>
          <div class="label" id="label" aria-hidden="true"></div>
          <div class="pg-hint" id="pg-hint">Drag to wander · click a piece to open it</div>
          <div class="pg-loading" id="pg-loading">Building the room…</div>
        </div>
      </div>
    </section>
  `;
}
