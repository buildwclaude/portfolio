import { html, raw } from '../lib/html';
import { site, type Entry, type Photo } from '../content/site';

/**
 * "More about me" as a set of drawings: the content of every sheet, as runs of
 * blocks. The book (src/components/sketchbook) pours each run onto as many
 * pages as it needs, so a chapter can grow without anyone re-laying it out.
 *
 * Built from the same content as the homepage — `about`, `records`, `shelf`,
 * `hero.notes` and `contact` — so the two can never disagree.
 */
export type Section = {
  /** Also the chapter name the shelf asks to open at. */
  label: string;
  /** Short name for the index under the book. */
  short: string;
  blocks: string[];
  /** Fills the right-hand page when the section ends on a left one. */
  filler: string;
};

/** Ends the page early: the next block starts a fresh one. */
export const PAGE_BREAK = '<!--page-->';

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
    blocks: [
      html`
        <figure class="sb-fig sb-fig--portrait">
          <img src="${asset(portrait.src)}" alt="${portrait.alt}" width="1000" height="1000" decoding="async" />
          <figcaption class="sb-fig__label">Fig. 0 — The author, squinting at the sun</figcaption>
        </figure>
      `.__html,
      html`
        <dl class="sb-facts">
          ${facts.map((f) => html`<div><dt>${f.label.trim()}</dt><dd>${f.value}</dd></div>`)}
        </dl>
      `.__html,
      PAGE_BREAK,
      html`
        <header class="sb-hello">
          <p class="sb-kicker">About</p>
          <h2 class="sb-hello__title"><span class="sb-hello__hi">${greeting}</span> I’m ${first}.</h2>
        </header>
      `.__html,
      ...site.about.paragraphs.map((p) => html`<p class="sb-prose">${p}</p>`.__html),
    ],
    filler: blankSheet(),
  };

  const chapters = site.shelf.books.map((book, i): Section => {
    const group = site.records.groups.find((g) => g.label === book.group);
    return {
      label: book.group,
      short: book.group.split(' ')[0]!,
      blocks: [
        html`
          <header class="sb-chap">
            <p class="sb-kicker">Chapter ${pad(i + 1)}</p>
            <h3 class="sb-chap__title">${book.group}</h3>
            <p class="sb-note">${book.tagline}</p>
          </header>
        `.__html,
        ...(group?.items ?? []).map(entry),
        ...photoRows(group?.photos ?? [], i + 1),
      ],
      filler: html`
        <div class="sb-filler">
          <span class="sb-filler__motif" style="--motif:url(${raw(motifSrc(book.motif))})" aria-hidden="true"></span>
          <p class="sb-note">Detail ${pad(i + 1)} — ${book.tagline}</p>
        </div>
      `.__html,
    };
  });

  const bye: Section = {
    label: 'Say hello',
    short: 'Say hello',
    blocks: [
      html`
        <div class="sb-bye">
          <img class="sb-bye__tree" src="${asset(signoff)}" alt="" width="294" height="370" />
          <p class="sb-note sb-bye__line">${line}</p>
        </div>
      `.__html,
      PAGE_BREAK,
      html`
        <header class="sb-chap">
          <p class="sb-kicker">Last page</p>
          <h3 class="sb-chap__title">Say hello</h3>
          <p class="sb-note">Correspondence</p>
        </header>
      `.__html,
      html`
        <ul class="sb-links">
          <li><a href="mailto:${email}">${email} <span aria-hidden="true">↗</span></a></li>
          ${links.map(
            (l) => html`<li><a href="${l.href}" target="_blank" rel="noopener">${l.label} <span aria-hidden="true">↗</span></a></li>`,
          )}
        </ul>
      `.__html,
      html`<p class="sb-colophon">© ${raw(String(new Date().getFullYear()))} ${site.meta.name}</p>`.__html,
    ],
    filler: blankSheet(),
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
      <h4 class="sb-entry__title">${title}</h4>
      ${meta && html`<p class="sb-entry__meta">${meta}</p>`}
      ${item.desc && html`<p class="sb-entry__desc">${item.desc}</p>`}
    </article>
  `.__html;
}

/**
 * Photos are set as figures two to a row, each row sized so both share a
 * height; an odd one out gets a row of its own.
 */
function photoRows(photos: readonly Photo[], chapter: number) {
  const rows: string[] = [];
  for (let i = 0; i < photos.length; i += 2) {
    const pair = photos.slice(i, i + 2);
    rows.push(
      html`
        <div class="sb-figs${pair.length === 1 ? ' sb-figs--single' : ''}">
          ${pair.map((p, j) => {
            const ar = p.width / p.height;
            return html`
              <figure class="sb-fig" style="--ar:${raw(ar.toFixed(3))}">
                <img src="${asset(p.src)}" alt="${p.alt}" width="${p.width}" height="${p.height}" decoding="async" />
                <figcaption class="sb-fig__label">Fig. ${chapter}.${i + j + 1}</figcaption>
              </figure>
            `;
          })}
        </div>
      `.__html,
    );
  }
  return rows;
}

/** An empty sheet, as a drawing set leaves one: marked so. */
function blankSheet() {
  return html`
    <div class="sb-filler">
      <p class="sb-note sb-filler__blank">This sheet intentionally left blank</p>
    </div>
  `.__html;
}
