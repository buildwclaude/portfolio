import { html, raw } from '../lib/html';
import { site, type Entry, type Photo } from '../content/site';

/**
 * The About page, opened in the case-study window at #me. Built from the
 * same content as the homepage — `about`, `records`, `hero.notes` and
 * `contact` — so the two can never disagree.
 *
 * Returned as a string: `lib/warp-detail.ts` loads it on demand and drops it
 * into the window like any other study.
 */
export function renderMe(): string {
  const { greeting, portrait, signoff } = site.me;
  const { paragraphs } = site.about;
  const facts = site.hero.notes.filter((n) => n.value);
  const { line, email, links } = site.contact;

  return html`
    <article class="me" aria-labelledby="me-title">
      <header class="me__intro">
        <div class="me__intro-text">
          <p class="me__eyebrow meta">About</p>
          <h2 class="me__title" id="me-title">
            <span class="me__hello">${greeting}</span>
            <span class="me__name">I’m ${site.meta.name.split(' ')[0]}.</span>
          </h2>
          <div class="me__bio">${paragraphs.map((p) => html`<p>${p}</p>`)}</div>
          <dl class="me__facts">
            ${facts.map(
              (f) => html`
                <div class="me__fact">
                  <dt class="meta">${f.label.trim()}</dt>
                  <dd>${f.value}</dd>
                </div>
              `,
            )}
          </dl>
        </div>
        <figure class="me__portrait">
          <img src="${portrait.src}" alt="${portrait.alt}" width="1000" height="1000" decoding="async" />
        </figure>
      </header>

      ${site.records.groups.map((group, i) => section(group.label, group.items, group.photos, i))}

      <footer class="me__signoff" data-rm-reveal>
        <img class="me__tree" src="${signoff}" alt="" aria-hidden="true" width="294" height="370" />
        <p class="me__signoff-line">${line}</p>
        <ul class="me__links">
          <li><a href="mailto:${email}">Email <span aria-hidden="true">↗</span></a></li>
          ${links.map(
            (l) => html`<li><a href="${l.href}" target="_blank" rel="noopener">${l.label} <span aria-hidden="true">↗</span></a></li>`,
          )}
        </ul>
        <p class="me__colophon meta">© ${raw(String(new Date().getFullYear()))} ${site.meta.name}</p>
      </footer>
    </article>
  `.__html;
}

function section(label: string, items: readonly Entry[], photos: readonly Photo[], i: number) {
  const id = `me-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return html`
    <section class="me__section" aria-labelledby="${id}" data-rm-reveal>
      <h3 class="me__label meta" id="${id}">
        <span class="me__label-num">${raw(String(i + 1).padStart(2, '0'))}</span>${label}
      </h3>
      <ol class="me__list">
        ${items.map((item) => row(item))}
      </ol>
      ${photos.length > 0 &&
      html`
        <ul class="me__photos" aria-label="Photos: ${label}">
          ${photos.map(
            (p) =>
              html`<li style="--ar:${raw((p.width / p.height).toFixed(3))}">
                <img src="${p.src}" alt="${p.alt}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" />
              </li>`,
          )}
        </ul>
      `}
    </section>
  `;
}

function row(item: Entry) {
  const title = item.href
    ? html`<a href="${item.href}" target="_blank" rel="noopener">${item.title} <span aria-hidden="true">↗</span></a>`
    : item.title;
  return html`
    <li class="me__row">
      <div class="me__row-head">
        <h4 class="me__row-title">${title}</h4>
        ${item.meta && html`<span class="me__row-meta">${item.meta}</span>`}
        ${item.year && html`<span class="me__row-year meta">${item.year}</span>`}
      </div>
      ${item.desc && html`<p class="me__row-desc">${item.desc}</p>`}
    </li>
  `;
}
