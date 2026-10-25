import { html } from '../lib/html';
import { site } from '../content/site';
import { pageHref } from './paths';

/**
 * Under the landing text: four soft-coloured tiles, each a small toy made of
 * something of mine (lib/tiles plays them).
 *
 *   - Hello: the portrait, the greeting turning through languages I love.
 *   - Playground: a stack of my art that shuffles while the pointer is on it.
 *   - Social battery: Socialux in miniature — slide between AI and human
 *     conversations and the battery fills and changes colour.
 *   - Currently: what I'm doing now, with a breathing dot, and my focus.
 *
 * Content: site.tiles, site.me, site.hero.notes, site.experiments.
 */
export function tiles() {
  const { hello, art } = site.tiles;
  const { portrait } = site.me;
  const note = (label: string) => site.hero.notes.find((n) => n.label.trim() === label)?.value ?? '';
  const focus = note('Focus').split(', ');
  const socialux = site.experiments.items.find((x) => x.title === 'Socialux');

  return html`
    <section class="tiles" aria-label="A little about me" data-tiles>
      <a class="tile-card tile-card--hello" href="${pageHref.about}" data-reveal>
        <img class="tile-card__photo" src="${portrait.src}" alt="${portrait.alt}" width="1000" height="1000" loading="lazy" decoding="async" />
        <span class="hello" aria-hidden="true">
          <span class="hello__word" data-hello='${JSON.stringify(hello)}'>${hello[0]}</span>
        </span>
        <span class="tile-card__foot"><span>About me</span><span class="tile-card__arrow" aria-hidden="true">→</span></span>
      </a>

      <a class="tile-card tile-card--art" href="#playground" data-riffle data-reveal>
        <span class="riffle" aria-hidden="true">
          ${art.map((src, i) => html`<img src="${src}" alt="" loading="lazy" decoding="async" style="--n:${i}" />`)}
        </span>
        <span class="tile-card__foot"><span>Playground<small>Art &amp; sketches</small></span><span class="tile-card__arrow" aria-hidden="true">→</span></span>
      </a>

      <div class="tile-card tile-card--battery" data-battery data-reveal>
        <span class="tile-card__kicker">${socialux?.title ?? 'Socialux'} · try it</span>
        <span class="charge" aria-hidden="true"><span class="charge__fill"></span><span class="charge__tip"></span></span>
        <label class="charge__label">
          <span class="visually-hidden">Of today’s conversations, how many were with people?</span>
          <input class="charge__range" type="range" min="0" max="100" value="62" data-battery-input />
        </label>
        <span class="charge__scale"><span>AI</span><b data-battery-read>62% human</b><span>Human</span></span>
        <a class="tile-card__more" href="${pageHref.experiments}">Experiments <span aria-hidden="true">→</span></a>
      </div>

      <a class="tile-card tile-card--now" href="${pageHref.about}" data-reveal>
        <span class="tile-card__kicker"><span class="now-dot" aria-hidden="true"></span>Currently</span>
        <span class="tile-card__now">${note('Currently')}</span>
        <span class="chips">${focus.map((f) => html`<span class="chip">${f}</span>`)}</span>
      </a>
    </section>
  `;
}
