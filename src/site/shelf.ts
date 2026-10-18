import { html } from '../lib/html';
import { site, type Book } from '../content/site';

/**
 * The chapters of About, as a table of contents: one ruled row each — its
 * number, its title, a line on what it holds, the first entries and a
 * count. Every row opens the reader (#me) at that chapter.
 */
function chapter(book: Book, i: number) {
  const items = site.records.groups.find((g) => g.label === book.group)?.items ?? [];
  const preview = items.slice(0, 2).map((item) => item.title);
  const more = items.length - preview.length;

  return html`
    <li class="toc__row" data-reveal>
      <a class="toc__link" href="#me" data-chapter="${book.group}">
        <span class="toc__num kicker">${String(i + 1).padStart(2, '0')}</span>
        <span class="toc__title">${book.group}</span>
        <span class="toc__tagline">${book.tagline}</span>
        <span class="toc__preview">${preview.join(' · ')}${more > 0 ? ` · +${more}` : ''}</span>
        <span class="toc__count kicker">${String(items.length).padStart(2, '0')}<span class="toc__arrow" aria-hidden="true">→</span></span>
      </a>
    </li>
  `;
}

export function shelf() {
  const { title, books } = site.shelf;

  return html`
    <nav class="toc" aria-labelledby="shelf-title">
      <div class="toc__head">
        <h3 class="kicker" id="shelf-title">${title}</h3>
        <span class="kicker">Chapter · Entries</span>
      </div>
      <ol class="toc__list" data-reveal-stagger>${books.map(chapter)}</ol>
    </nav>
  `;
}
