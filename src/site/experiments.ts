import { html } from '../lib/html';
import { site, type Experiment } from '../content/site';

/**
 * The Experiments page (experiments/), in the minimal style
 * (components/minimal.css): a short line, then one row each — the title and
 * its tag, the note under them.
 */
function item(experiment: Experiment) {
  const inner = html`
    <span class="m-row__head">
      <span class="m-row__title">${experiment.title}</span>
      <span class="m-row__meta">${experiment.tag}${experiment.href ? html`<span class="m-row__arrow" aria-hidden="true"> ↗</span>` : ''}</span>
    </span>
    <span class="m-row__note">${experiment.note}</span>
  `;

  return html`
    <li class="m-row">
      ${experiment.href
        ? html`<a class="m-row__link" href="${experiment.href}" target="_blank" rel="noreferrer">${inner}</a>`
        : html`<div class="m-row__link">${inner}</div>`}
    </li>
  `;
}

export function experimentsPage() {
  const { title, intro, items } = site.experiments;

  return html`
    <div class="m-page">
      <header class="m-intro m-col" data-reveal>
        <div class="m-body">
          <h1 class="m-label m-label--page">${title}</h1>
          <p class="m-lead">${intro}</p>
        </div>
      </header>

      <div class="m-blocks">
        <section class="m-block" data-reveal>
          <h2 class="m-label">Projects</h2>
          <div class="m-body"><ul class="m-rows m-rows--flush">${items.map(item)}</ul></div>
        </section>
      </div>
    </div>
  `;
}
