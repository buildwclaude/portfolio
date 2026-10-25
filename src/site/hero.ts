import { html, raw } from '../lib/html';
import { site } from '../content/site';
import { workedWith } from './worked-with';
import { tiles } from './tiles';
import { clip } from './clip';
import { scatter } from './gloss';
import { pageHref } from './paths';

/**
 * The landing screen: everything small and in the middle — a portrait, the
 * name over the role, one quiet line, a paper tag clipped on that leads to
 * Contact, and the places worked with — on faint grid paper, with a few
 * things left on the desk around it: a sticky note, a taped polaroid of my
 * art, a pinned tag for where I am now, and a few glossy jelly shapes
 * (site/gloss). Under it, four small tiles
 * (site/tiles).
 * Copy comes from `content/site.ts`.
 *
 * Set aside, ready to swap back in: the dial (site/dial, lib/hero-dial), the
 * arm (site/arm, lib/arm), the tunnel (site/tunnel, lib/tunnel), the orbit
 * (site/orbit, lib/orbit), the palace (site/palace, lib/palace), the temple
 * (site/temple), the glass grid (site/glass-grid), the courses folder
 * (site/courses-folder), the interaction loop (site/interaction), the vine
 * (site/vine) and the WebGL scenes (components/ribbon, components/console,
 * via data-scene).
 */
export function hero() {
  const { intro } = site.hero;
  const { portrait } = site.me;

  return html`
    <section class="hero" id="intro" aria-labelledby="hero-title">
      <div class="hero__center">
        <span class="desk" aria-hidden="true">
          <span class="desk__polaroid"><span class="desk__tape"></span><img src="${site.tiles.art[3]}" alt="" width="1200" height="1200" loading="lazy" decoding="async" /></span>
          <span class="desk__tag"><span class="desk__pin"></span><span class="desk__dot"></span>Open XR Lab</span>
          ${scatter([
            { shape: 'star', color: 'pink', x: 'calc(50% + 250px)', y: '58%', size: 86, turn: 12, phone: true },
            { shape: 'heart', color: 'lilac', x: 'calc(50% - 205px)', y: '3%', size: 34, turn: -14 },
            { shape: 'ring', color: 'lime', x: 'calc(50% + 135px)', y: '2%', size: 50, turn: 18 },
            { shape: 'flower', color: 'butter', x: 'calc(50% - 395px)', y: '46%', size: 28, turn: 10 },
            { shape: 'star', color: 'sky', x: 'calc(50% + 372px)', y: '9%', size: 30, turn: -22 },
            { shape: 'pill', color: 'peach', x: 'calc(50% - 150px)', y: '86%', size: 46, turn: 32, phone: true },
            { shape: 'heart', color: 'butter', x: 'calc(50% + 420px)', y: '78%', size: 22, turn: 20 },
          ])}
        </span>
        ${notes()}
        <img class="hero__avatar" src="${portrait.src}" alt="${portrait.alt}" width="1000" height="1000" decoding="async" data-reveal />
        <h1 class="hero__title" id="hero-title" data-reveal>
          <span>${site.meta.name}</span>
          <span class="hero__role">${site.meta.role}</span>
        </h1>
        <p class="hero__intro" data-reveal>${intro}</p>
        <p class="hero__actions" data-reveal>
          <a class="clip-tag" href="${pageHref.contact}">${clip('#7aa7f0')}<span>Say hello</span><span aria-hidden="true">→</span></a>
        </p>
        ${workedWith()}
      </div>

      ${tiles()}
    </section>
  `;
}

/**
 * A little stack of sticky notes on the desk, one thing each: the focus,
 * then what I practise, the tools and what I do beyond design. Pull the top
 * one's folded corner (or click it) and it peels away to the back, showing
 * the next (lib/notes).
 */
function notes() {
  const focus = site.hero.notes.find((n) => n.label.trim() === 'Focus')?.value ?? '';
  const list = [
    { label: 'Focus', text: focus, color: '#ffe17a', ink: '#5c4500' },
    ...site.about.columns.map((c, i) => ({
      label: c.label,
      text: c.items.slice(0, 4).join(', ') + (c.items.length > 4 ? '…' : ''),
      color: ['#ffc2dc', '#c9f2d6', '#cfe3ff'][i % 3]!,
      ink: ['#6a1f42', '#1d4d2c', '#1d3770'][i % 3]!,
    })),
  ];
  return html`
    <div class="notes" data-notes>
      ${list.map(
        (note, i) => html`
          <div class="note" style="--c:${note.color}; --ink:${note.ink}; --z:${list.length - i}; --tilt:${[-7, 4, -3, 6][i % 4]}deg" data-note>
            <b>${note.label}</b>
            <span>${note.text}</span>
            <button class="note__corner" type="button" aria-label="Next note" data-note-peel></button>
          </div>
        `,
      )}
    </div>
  `;
}

/**
 * The portfolio description (site.hero.portfolioDescription): credential
 * lines, set aside for now. Drop `${portfolioDescription()}` back under the
 * statement to show them.
 */
export function portfolioDescription() {
  return html`
    <ul class="hero__creds" data-reveal>
      ${site.hero.portfolioDescription.map((line) => html`<li>${raw(emphasise(line))}</li>`)}
    </ul>
  `;
}

/** Escapes a credential line and sets its **names** in <strong>. */
function emphasise(line: string) {
  return html`${line}`.__html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
