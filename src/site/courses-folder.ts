import { html } from '../lib/html';
import { site } from '../content/site';
import { logos, type Logo } from '../content/logos';

/**
 * The folder on the right of the landing screen: a blue glass folder with two
 * sheets of paper in its mouth, and the tools I work with scattered out of it
 * as bare logos on dotted threads. Clicking the folder tucks the tools away
 * and fans them out again. Positions are in a 736 × 920 frame and scale with
 * the stage. Behaviour lives in `lib/courses-folder`.
 */
export function coursesFolder() {
  const { marks, tools } = site.hero.folder;

  return html`
    <div class="folder folder--${marks}" data-folder>
      <div class="folder__stage is-open" data-folder-stage>
        <svg class="folder__lines" viewBox="0 0 736 920" aria-hidden="true">
          ${tools.map((t) => {
            // Each line leaves the folder's mouth on the side its tool is on,
            // spread across the mouth so neighbouring lines don't run together.
            const x0 = Math.round(Math.min(475, Math.max(185, 330 + (t.x - 330) * 0.55)));
            return html`<path d="M${x0} 610 C${x0} 500 ${t.x} ${t.y + 140} ${t.x} ${t.y + 44}"></path>`;
          })}
        </svg>

        <svg class="folder__back" viewBox="0 0 360 270" aria-hidden="true">
          <defs>
            <linearGradient id="folder-back-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#4fa6ff"></stop>
              <stop offset="1" stop-color="#2f6cf2"></stop>
            </linearGradient>
          </defs>
          <path d="M8 28 Q8 0 36 0 H112 Q124 0 132 7 L140 13 Q146 18 156 18 H324 Q352 18 352 46 V238 Q352 266 324 266 H36 Q8 266 8 238 Z"></path>
        </svg>

        <ul class="folder__tools" aria-label="Tools">
          ${tools.map(
            (t, i) => html`
              <li class="folder__slot" style="--x:${t.x};--y:${t.y};--r:${t.tilt}deg;--s:${t.size};--i:${i};--brand:${t.color}">
                <span class="folder__bob">
                  <span class="folder__tile">
                    <span class="folder__mark" aria-hidden="true">${marks === 'original' ? html`<img class="folder__art" src="${t.art}" alt="" width="48" height="48" decoding="async" />` : mark(t)}</span>
                    <span class="visually-hidden">${t.name}</span>
                  </span>
                </span>
              </li>
            `,
          )}
        </ul>

        <!-- Sheets of paper peeking out of its mouth, as on a macOS folder that has
             something in it. -->
        <div class="folder__tucked" aria-hidden="true">
          <span class="folder__card folder__card--0"><span class="folder__sheet"></span></span>
          <span class="folder__card folder__card--1"><span class="folder__sheet"></span></span>
        </div>

        <button class="folder__front" type="button" aria-expanded="true" data-folder-toggle>
          <!-- Frosted glass: the cards and the back panel show through, blurred. -->
          <span class="folder__glass" aria-hidden="true"></span>
          <span class="visually-hidden" data-folder-action>Tuck the tools away</span>
        </button>
      </div>
    </div>
  `;
}

/** A tool's mark: its logo when it has one, with its initials beside it for
    the colour style (the stylesheet shows one or the other). */
function mark({ initials, logo }: { initials: string; logo: string }) {
  const path = logo ? logos[logo as Logo] : '';
  return html`
    ${path && html`<svg class="folder__logo" viewBox="0 0 24 24"><path d="${path}"></path></svg>`}
    <span class="folder__initials${path ? '' : ' is-only'}">${initials}</span>
  `;
}
