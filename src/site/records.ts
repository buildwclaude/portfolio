import { html, type Html } from '../lib/html';
import { site, type Entry } from '../content/site';

/**
 * The three lists in the About section — experience, recognition, and the
 * work outside the work.
 *
 * It is the archive row from the Work section, one column narrower: the
 * same hairline, the same grid positions, the same mono metadata. Nothing
 * new is introduced to hold this content.
 */

function row(item: Entry) {
  const body = html`
    <span class="records__title"><span class="records__title-text">${item.title}</span></span>
    <span class="records__meta">${item.meta}</span>
    ${item.year && html`<span class="records__year meta">${item.year}</span>`}
  `;

  return html`
    <li class="records__row" data-reveal>
      ${item.href
        ? html`<a class="records__inner grid" href="${item.href}" target="_blank" rel="noreferrer"
            >${body}</a
          >`
        : html`<div class="records__inner grid">${body}</div>`}
    </li>
  `;
}

function group(label: string, items: readonly Entry[], index: number): Html {
  return html`
    <div class="records__group">
      <h3 class="records__label meta" id="records-${index}">${label}</h3>
      <ol class="records__list" aria-labelledby="records-${index}" data-reveal-stagger>
        ${items.map((item) => row(item))}
      </ol>
    </div>
  `;
}

/**
 * The homepage shows only the groups named here; the full set, with photos,
 * lives on the About page (`#me`).
 */
export function records(labels?: readonly string[]) {
  const groups = labels ? site.records.groups.filter((g) => labels.includes(g.label)) : site.records.groups;
  return html`
    <div class="records">
      ${groups.map((entry, i) => group(entry.label, entry.items, i + 1))}
    </div>
  `;
}
