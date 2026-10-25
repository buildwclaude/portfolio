import { html } from '../lib/html';
import { site, type Entry, type Photo } from '../content/site';

/**
 * The About page (about/), in the minimal style (components/minimal.css):
 * one narrow column, each block a label on the left and its content on the
 * right. The introduction, what drives the work, then each `records` group
 * — its entries and photos — and the skills. Transcribed from the source
 * site's "Me" page, in the same order.
 */
function entry(e: Entry) {
  const meta = [e.meta, e.year].filter(Boolean).join(' · ');
  const title = e.href
    ? html`<a class="m-entry__title" href="${e.href}" target="_blank" rel="noreferrer">${e.title}<span aria-hidden="true"> ↗</span></a>`
    : html`<span class="m-entry__title">${e.title}</span>`;

  return html`
    <li class="m-entry">
      ${title}
      ${meta && html`<span class="m-entry__meta">${meta}</span>`}
      ${e.desc && html`<p class="m-entry__desc">${e.desc}</p>`}
    </li>
  `;
}

function photos(list: Photo[]) {
  if (list.length === 0) return '';
  return html`
    <div class="m-photos">
      ${list.map(
        (p) => html`<img src="${p.src}" alt="${p.alt}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async" />`,
      )}
    </div>
  `;
}

function block(label: string, body: unknown) {
  return html`
    <section class="m-block" data-reveal>
      <h2 class="m-label">${label}</h2>
      <div class="m-body">${body}</div>
    </section>
  `;
}

export function aboutPage() {
  const { paragraphs, columns } = site.about;
  const { portrait } = site.me;
  const { email } = site.contact;
  const focus = site.hero.notes.find((n) => n.label.trim() === 'Focus')?.value;
  const first = site.meta.name.split(' ')[0] ?? site.meta.name;

  return html`
    <div class="m-page">
      <header class="m-intro m-col" data-reveal>
        <div class="m-body">
          <img class="m-portrait" src="${portrait.src}" alt="${portrait.alt}" width="1000" height="1000" decoding="async" />
          <h1 class="m-lead">Hello, I’m ${first}.</h1>
          <p class="m-text">${paragraphs[0]}</p>
          ${paragraphs[2] && html`<p class="m-text">${paragraphs[2]}</p>`}
          <p class="m-actions"><a class="m-chip" href="mailto:${email}">${email}</a></p>
        </div>
      </header>

      <div class="m-blocks">
        ${focus && block('Focus', html`<p class="m-text">${focus}</p>`)}
        ${paragraphs[1] && block('What drives me', html`<p class="m-text">${paragraphs[1]}</p>`)}

        ${site.records.groups.map((group) =>
          block(
            group.label,
            html`
              <ul class="m-entries">${group.items.map(entry)}</ul>
              ${photos(group.photos)}
            `,
          ),
        )}

        ${block(
          'Skills',
          html`
            <dl class="m-skills">
              ${columns.map(
                (c) => html`<div class="m-skills__row"><dt>${c.label}</dt><dd>${c.items.join(', ')}</dd></div>`,
              )}
            </dl>
          `,
        )}
      </div>
    </div>
  `;
}
