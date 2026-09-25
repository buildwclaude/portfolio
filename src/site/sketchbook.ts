import { html, raw } from '../lib/html';
import { site, type Entry, type Photo } from '../content/site';

/**
 * "More about me" as a reader: the content of every chapter, in order. The
 * reader (src/components/sketchbook) sets them in one scrolling column with
 * the chapters listed beside it.
 *
 * Built from the same content as the homepage — `about`, `records`, `shelf`,
 * `hero.notes` and `contact` — so the two can never disagree.
 */
export type Section = {
  /** Also the chapter name the shelf asks to open at. */
  label: string;
  /** Short name for the chapter list. */
  short: string;
  /** The chapter, as markup. */
  html: string;
};

const asset = (src: string) => (src.startsWith('/') ? import.meta.env.BASE_URL + src.slice(1) : src);
const pad = (n: number) => String(n).padStart(2, '0');

export function sketchbookSections(motifSrc: (motif: string) => string): Section[] {
  const { greeting, portrait, signoff } = site.me;
  const facts = site.hero.notes.filter((n) => n.value);
  const { line, email, links } = site.contact;
  const first = site.meta.name.split(' ')[0];

  const hello: Section = {
    label: 'Hello',
    short: 'Hello',
    html: html`
      <div class="sb-hello">
        <img class="sb-hello__portrait" src="${asset(portrait.src)}" alt="${portrait.alt}" width="1000" height="1000" decoding="async" />
        <div class="sb-hello__text">
          <p class="sb-kicker">About</p>
          <h2 class="sb-title"><span class="sb-hello__hi">${greeting}</span> I’m ${first}.</h2>
          ${site.about.paragraphs.map((p) => html`<p class="sb-prose">${p}</p>`)}
          ${facts.length > 0 &&
          html`
            <dl class="sb-facts">
              ${facts.map((f) => html`<div class="sb-fact"><dt>${f.label.trim()}</dt><dd>${f.value}</dd></div>`)}
            </dl>
          `}
        </div>
      </div>
    `.__html,
  };

  const chapters = site.shelf.books.map((book, i): Section => {
    const group = site.records.groups.find((g) => g.label === book.group);
    const items = group?.items ?? [];
    return {
      label: book.group,
      short: book.group,
      html: html`
        <header class="sb-head">
          <span class="sb-head__motif" style="--motif:url(${raw(motifSrc(book.motif))});--tone:${book.color}" aria-hidden="true"></span>
          <div>
            <p class="sb-kicker">Chapter ${pad(i + 1)} · ${items.length} ${items.length === 1 ? 'entry' : 'entries'}</p>
            <h2 class="sb-title">${book.group}</h2>
            <p class="sb-lede">${book.tagline}</p>
          </div>
        </header>
        <div class="sb-entries">${items.map(entry)}</div>
        ${photos(group?.photos ?? [])}
      `.__html,
    };
  });

  const bye: Section = {
    label: 'Say hello',
    short: 'Say hello',
    html: html`
      <div class="sb-bye">
        <img class="sb-bye__tree" src="${asset(signoff)}" alt="" width="294" height="370" />
        <div>
          <p class="sb-kicker">Last page</p>
          <h2 class="sb-title">Say hello</h2>
          <p class="sb-lede">${line}</p>
          <ul class="sb-links">
            <li><a class="sb-link sb-link--primary" href="mailto:${email}">${email}</a></li>
            ${links.map(
              (l) => html`<li><a class="sb-link" href="${l.href}" target="_blank" rel="noopener">${l.label} <span aria-hidden="true">↗</span></a></li>`,
            )}
          </ul>
          <p class="sb-colophon">© ${raw(String(new Date().getFullYear()))} ${site.meta.name}</p>
        </div>
      </div>
    `.__html,
  };

  return [hello, ...chapters, bye];
}

function entry(item: Entry) {
  const title = item.href
    ? html`<a href="${item.href}" target="_blank" rel="noopener">${item.title} <span aria-hidden="true">↗</span></a>`
    : item.title;
  const meta = [item.meta, item.year].filter(Boolean).join(' · ');
  return html`
    <article class="sb-entry">
      <h3 class="sb-entry__title">${title}</h3>
      ${meta && html`<p class="sb-entry__meta">${meta}</p>`}
      ${item.desc && html`<p class="sb-entry__desc">${item.desc}</p>`}
    </article>
  `;
}

/** A chapter's photos, in an even grid. */
function photos(list: readonly Photo[]) {
  if (list.length === 0) return '';
  return html`
    <div class="sb-photos">
      ${list.map(
        (p) => html`
          <figure class="sb-photo">
            <img src="${asset(p.src)}" alt="${p.alt}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" />
          </figure>
        `,
      )}
    </div>
  `;
}
