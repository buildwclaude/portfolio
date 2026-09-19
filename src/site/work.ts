import { html, raw, type Html } from '../lib/html';
import { site, type Project } from '../content/site';
import { plate } from './plate';

/** Featured pieces get a large visual area; the rest form a compact index. */
const FEATURED = 0;

function media(project: Project, seed: number) {
  return project.image
    ? html`<img
        class="piece__image"
        src="${project.image}"
        alt="${project.imageAlt}"
        loading="lazy"
        decoding="async"
      />`
    : plate(seed);
}

function wrap(href: string, inner: Html, className: string) {
  if (!href) return html`<div class="${className}">${inner}</div>`;
  // Case studies still live on the old site, so they open alongside this one.
  const external = href.startsWith('http');
  return external
    ? html`<a class="${className}" href="${href}" target="_blank" rel="noreferrer">${inner}</a>`
    : html`<a class="${className}" href="${href}">${inner}</a>`;
}

function piece(project: Project, i: number) {
  const body = html`
    <div class="piece__media">
      <div class="piece__media-inner">${media(project, i)}</div>
    </div>
    <div class="piece__body">
      <p class="piece__meta meta">
        <span>${project.index}</span>
        <span aria-hidden="true">·</span>
        <span>${project.type}</span>
        <span aria-hidden="true">·</span>
        <span>${project.year}</span>
      </p>
      <h3 class="piece__title title">
        <span class="piece__title-text">${project.title}</span>
      </h3>
      <p class="piece__description">${project.description}</p>
      <ul class="piece__tech meta">
        ${project.tech.map((t) => html`<li>${t}</li>`)}
      </ul>
      ${project.href &&
      html`<span class="piece__action meta" aria-hidden="true">View <span>↗</span></span>`}
    </div>
  `;

  return html`
    <article class="piece ${i % 2 === 1 ? 'piece--flip' : ''}" data-reveal>
      ${wrap(project.href, body, 'piece__inner grid')}
    </article>
  `;
}

function archiveRow(project: Project) {
  const body = html`
    <span class="archive__index meta">${project.index}</span>
    <h3 class="archive__title"><span class="archive__title-text">${project.title}</span></h3>
    <p class="archive__description">${project.description}</p>
    <span class="archive__type meta">${project.type}</span>
    <span class="archive__year meta">${project.year}</span>
  `;

  return html`
    <li class="archive__row" data-reveal>${wrap(project.href, body, 'archive__link grid')}</li>
  `;
}

export function work() {
  const projects = site.work.projects;
  const featured = projects.slice(0, FEATURED);
  const archive = projects.slice(FEATURED);

  return html`
    <section class="section work" id="work" aria-labelledby="work-title">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="work-title">${site.work.title}</h2>
          <span class="section__index meta">01 — ${raw(String(projects.length).padStart(2, '0'))}</span>
        </div>
      </div>

      ${featured.length > 0 && html`<div class="work__pieces shell">${featured.map((p, i) => piece(p, i))}</div>`}

      ${archive.length > 0 &&
      html`
        <div class="shell">
          <ol class="archive" data-reveal-stagger>
            ${archive.map((p) => archiveRow(p))}
          </ol>
        </div>
      `}
    </section>
  `;
}
