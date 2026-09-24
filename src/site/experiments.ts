import { html, raw } from '../lib/html';
import { site, type Experiment } from '../content/site';

/**
 * Each experiment carries a small line drawing that draws itself in on
 * hover and focus. Pure SVG + CSS: four short paths, no runtime cost.
 */
const glyphs: string[] = [
  // Contour field
  'M2 22C10 22 10 10 18 10S26 22 34 22M2 30C10 30 10 18 18 18S26 30 34 30M2 14C10 14 10 2 18 2S26 14 34 14',
  // Dither grid
  'M4 6h2M12 6h2M20 6h2M28 6h2M8 14h2M16 14h2M24 14h2M32 14h2M4 22h2M12 22h2M20 22h2M28 22h2M8 30h2M16 30h2M24 30h2M32 30h2',
  // Port marks
  'M2 16h32M6 16v-6M14 16v-10M22 16v-4M30 16v-8M6 16v8M18 16v6M26 16v10',
  // Vertical setting
  'M8 2v30M18 2v18M28 2v24M4 2h8M14 2h8M24 2h8',
];

function item(experiment: Experiment, index: number) {
  const glyph = glyphs[index % glyphs.length] ?? glyphs[0]!;
  const inner = html`
    <span class="xp__index meta">${experiment.index}</span>
    <svg class="xp__glyph" viewBox="0 0 36 34" aria-hidden="true" focusable="false">
      <path d="${raw(glyph)}" pathLength="1" />
    </svg>
    <h3 class="xp__title">${experiment.title}</h3>
    <p class="xp__note">${experiment.note}</p>
    <span class="xp__tag meta">${experiment.tag}</span>
  `;

  return html`
    <li class="xp" data-reveal>
      ${experiment.href
        ? html`<a class="xp__inner" href="${experiment.href}" target="_blank" rel="noreferrer"
            >${inner}</a
          >`
        : html`<div class="xp__inner">${inner}</div>`}
    </li>
  `;
}

export function experiments() {
  const { title, intro, items } = site.experiments;

  return html`
    <section
      class="section experiments"
      id="experiments"
      aria-labelledby="experiments-title"
    >
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="experiments-title">${title}</h2>
          <span class="section__index meta">03</span>
        </div>
        <p class="experiments__intro lead" data-reveal>${intro}</p>
        <ul class="experiments__list" data-reveal-stagger>${items.map((x, i) => item(x, i))}</ul>
      </div>
    </section>
  `;
}
