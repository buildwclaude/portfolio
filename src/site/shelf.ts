import { html } from '../lib/html';
import { site, type Book } from '../content/site';

/**
 * The chapters of About: one card each, so the section stays short while
 * everything is a click away. Each card shows what the chapter holds
 * and opens the reader (#me) at it. The chapter's line drawing is painted
 * onto its tile once the page has loaded (main.ts); without it the tile is
 * simply a block of the chapter's blue.
 */
function chapter(book: Book, i: number) {
  const items = site.records.groups.find((g) => g.label === book.group)?.items ?? [];
  const preview = items.slice(0, 2);
  const more = items.length - preview.length;

  return html`
    <li class="chapter" style="--tone:${book.color}">
      <a class="chapter__link" href="#me" data-chapter="${book.group}">
        <span class="chapter__tile" data-motif="${book.motif}" aria-hidden="true"></span>
        <span class="chapter__kicker">Chapter ${String(i + 1).padStart(2, '0')} · ${items.length} ${items.length === 1 ? 'entry' : 'entries'}</span>
        <span class="chapter__title">${book.group}</span>
        <span class="chapter__tagline">${book.tagline}</span>
        <span class="chapter__preview">
          ${preview.map((item) => html`<span class="chapter__item">${item.title}</span>`)}
          ${more > 0 && html`<span class="chapter__more">+ ${String(more)} more</span>`}
        </span>
        <span class="chapter__cta">Read the chapter <span aria-hidden="true">→</span></span>
      </a>
    </li>
  `;
}

export function shelf() {
  const { title, books } = site.shelf;

  return html`
    <div class="shelf" role="group" aria-labelledby="shelf-title">
      <div class="shelf__head">
        <h3 class="shelf__title" id="shelf-title">${title}</h3>
        <p class="shelf__note">Each opens the full chapter</p>
      </div>

      <ol class="shelf__chapters" data-reveal-stagger>${books.map(chapter)}</ol>
    </div>
  `;
}
