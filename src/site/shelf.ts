import { html } from '../lib/html';
import { site, type Book } from '../content/site';

/**
 * "More about me": one clothbound volume per chapter of the About page, on
 * a WebGL shelf.
 *
 * The markup is a plain index of the chapters. The shelf is built over it
 * when it scrolls near (src/components/bookshelf), and the index stays
 * underneath as the keyboard and no-WebGL way in. Every chapter opens the
 * About page (#me) at its own section.
 */
function volume(book: Book, i: number) {
  return html`
    <li class="shelf__vol" data-index="${String(i)}">
      <a class="shelf__link" href="#me" data-chapter="${book.group}">
        <span class="shelf__num meta">${String(i + 1).padStart(2, '0')}</span>
        <span class="shelf__name">${book.group}</span>
        <span class="shelf__kind meta">${book.tagline}</span>
      </a>
    </li>
  `;
}

export function shelf() {
  const { title, hint, books } = site.shelf;

  return html`
    <div class="shelf" role="group" aria-labelledby="shelf-title">
      <div class="shelf__head">
        <h3 class="shelf__title meta" id="shelf-title">${title}</h3>
        <a class="about__more" href="#me" data-study="me">
          <span>The full page</span><span class="about__more-arrow" aria-hidden="true">→</span>
        </a>
      </div>

      <div class="shelf__stage" data-shelf data-reveal>
        <!-- the pulled-out volume's card; filled in by the shelf -->
        <aside class="shelf__card" aria-live="polite" hidden>
          <p class="shelf__card-kicker meta"></p>
          <h4 class="shelf__card-title"></h4>
          <p class="shelf__card-meta meta"></p>
          <ol class="shelf__card-list"></ol>
          <div class="shelf__card-actions">
            <button class="shelf__open" type="button">
              <span class="shelf__open-label">Read the chapter</span><span aria-hidden="true">→</span>
            </button>
            <button class="shelf__back" type="button">Back to the shelf</button>
          </div>
        </aside>
        <p class="shelf__hint meta" aria-hidden="true">${hint}</p>
      </div>

      <ol class="shelf__index" data-reveal-stagger>${books.map(volume)}</ol>
    </div>
  `;
}
