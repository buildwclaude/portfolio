import { html } from '../lib/html';
import { site } from '../content/site';

/**
 * The folder on the right of the landing screen: tool tiles fanned out
 * above it on dotted threads, three cards tucked in its mouth. Clicking the
 * folder tucks the tiles away and fans them out again; clicking a tile adds
 * it to the count. Positions are in the design's 736 × 920 frame and scale
 * with the stage. Behaviour lives in `lib/courses-folder`.
 */
export function coursesFolder() {
  const { label, tools, tucked } = site.hero.folder;
  const count = tucked.length;

  return html`
    <div class="folder" data-folder>
      <div class="folder__stage is-open" data-folder-stage>
        <svg class="folder__threads" viewBox="0 0 736 920" aria-hidden="true">
          ${tools.map((t, i) => {
            const x0 = 230 + i * 30;
            return html`<path d="M${x0} 610 C${x0} 500 ${t.x} ${t.y + 150} ${t.x} ${t.y + 56}"></path>`;
          })}
        </svg>

        <span class="folder__back" aria-hidden="true"></span>

        <ul class="folder__tools" aria-label="Tools">
          ${tools.map(
            (t, i) => html`
              <li class="folder__slot" style="--x:${t.x};--y:${t.y};--r:${t.tilt}deg;--i:${i}">
                <span class="folder__bob">
                  <span class="folder__ghost" aria-hidden="true"></span>
                  <button class="folder__tile" type="button" aria-pressed="false" data-folder-tool>
                    <span class="folder__mark" style="--mark:${t.color};--mark-ink:${t.ink}" aria-hidden="true">${t.initials}</span>
                    <span class="folder__name">${t.name}</span>
                    <span class="visually-hidden"> — add to ${label}</span>
                    <span class="folder__check" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><polyline points="5 12 10 17 19 7"></polyline></svg>
                    </span>
                  </button>
                </span>
              </li>
            `,
          )}
        </ul>

        <div class="folder__tucked" aria-hidden="true">
          ${tucked.map(
            (c, i) => html`<span class="folder__card folder__card--${i}" style="--mark:${c.color}">${c.initials}</span>`,
          )}
        </div>

        <button class="folder__front" type="button" aria-expanded="true" data-folder-toggle>
          <svg viewBox="0 0 360 230" aria-hidden="true">
            <path d="M16 0 H150 C160 0 165 4 170 10 L178 18 C182 22 186 24 194 24 H344 Q360 24 360 40 V212 Q360 230 342 230 H18 Q0 230 0 212 V16 Q0 0 16 0 Z"></path>
          </svg>
          <span class="folder__label">${label}</span>
          <span class="folder__count"><span data-folder-count data-base="${count}">${count}</span> courses</span>
          <span class="visually-hidden" data-folder-action>Tuck the tools away</span>
        </button>
      </div>
    </div>
  `;
}
