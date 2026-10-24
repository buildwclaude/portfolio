import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import { el, ivyDefs, ivyLeaf, tendril, type IvyTheme } from './ivy';

gsap.registerPlugin(ScrollTrigger);

/** The ivy is drawn on a 90 × 440 canvas; each section's big leaf sits at one of these heights. */
const H = 440;
const LEAF_Y = [70, 170, 270, 370];
const VINE = 'M45 0 C36 40 54 80 45 120 C36 160 54 200 45 240 C36 280 54 320 45 360 C40 390 48 420 45 440';

/**
 * Down the left edge: an ivy that climbs down as the page scrolls. The vine
 * draws itself to where the reader is, young leaves and tendrils unfurl as
 * it reaches them, and each section has a big leaf — the current one
 * grown largest and darkest. Hover names a section, click goes there.
 */
export function initRail(onProgress?: (p: number) => void) {
  const rail = document.querySelector<HTMLElement>('.rail');
  const svg = rail?.querySelector<SVGSVGElement>('.rail__ivy');
  if (!rail || !svg) return;

  const ticks = Array.from(rail.querySelectorAll<HTMLAnchorElement>('.rail__tick')).map((el, i) => {
    el.style.setProperty('--y', String(LEAF_Y[i]! / H));
    return { el, target: document.querySelector<HTMLElement>(el.getAttribute('href') || ''), at: 0 };
  });
  const ivy = growIvy(svg, (rail.dataset.ivyTheme || 'default') as IvyTheme);
  let shown = -1;

  const apply = (p: number) => {
    // The current section is the last one whose start has been passed.
    let current = 0;
    ticks.forEach((t, i) => {
      if (p >= t.at - 0.001) current = i;
    });
    ivy.reach(reachAt(p, ticks.map((t) => t.at)), current !== shown ? current : null);
    if (current !== shown) {
      shown = current;
      ticks.forEach((t, i) => t.el.classList.toggle('is-current', i === current));
    }
    onProgress?.(p);
  };

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => {
      // Note the scroll progress where each section begins.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (const t of ticks) {
        const top = t.target ? t.target.getBoundingClientRect().top + window.scrollY : 0;
        t.at = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
      }
      shown = -1;
      apply(self.progress);
    },
  });

  apply(0);
}

/**
 * How far down the canvas the vine has grown at scroll progress p: it
 * reaches each section's leaf as that section begins, a little past it at
 * the very top, and the foot at the end of the page.
 */
function reachAt(p: number, starts: number[]) {
  const stops: [number, number][] = [[0, LEAF_Y[0]! + 24], ...starts.slice(1).map((at, i): [number, number] => [at, LEAF_Y[i + 1]! + 24]), [1, H]];
  for (let i = 1; i < stops.length; i++) {
    const [p0, y0] = stops[i - 1]!;
    const [p1, y1] = stops[i]!;
    if (p <= p1) return p1 > p0 ? y0 + ((p - p0) / (p1 - p0)) * (y1 - y0) : y1;
  }
  return H;
}

/** Draws the ivy into the rail's svg and returns a way to grow it. */
function growIvy(svg: SVGSVGElement, theme: IvyTheme) {
  const fill = ivyDefs(svg, 'rail', theme);

  // Where the vine will go, then the vine itself, drawn as far as it has grown.
  el(svg, 'path', { d: VINE, class: 'rail__guide' });
  const vine = el(svg, 'path', { d: VINE, class: 'rail__vine', stroke: fill.vine });
  const length = vine.getTotalLength();
  vine.style.strokeDasharray = String(length);
  vine.style.strokeDashoffset = String(length);
  const at = (y: number) => vine.getPointAtLength(length * (y / H));

  // The big leaves lean out toward the screen's edge, clear of the content.
  const big = LEAF_Y.map((y, i) => {
    const pt = at(y);
    return { y, leaf: ivyLeaf(svg, pt.x, pt.y, i % 2 ? 205 : 160, 15, fill.leaf) };
  });
  const small: { y: number; node: Element }[] = [];
  for (let y = 25; y < H - 10; y += 25) {
    if (LEAF_Y.some((s) => Math.abs(s - y) < 18)) continue;
    const pt = at(y);
    const dir = Math.round(y / 25) % 2 ? 1 : -1;
    small.push({ y, node: ivyLeaf(svg, pt.x, pt.y, dir > 0 ? -30 : 210, 8, fill.young) });
    if (y % 75 === 0) small.push({ y, node: tendril(svg, pt.x, pt.y, -dir) });
  }

  return {
    /** Grows the vine to canvas height y; on a new section, re-picks the leaf that leads. */
    reach(y: number, current: number | null) {
      vine.style.strokeDashoffset = String(length * (1 - y / H));
      for (const s of small) s.node.classList.toggle('is-grown', s.y <= y);
      big.forEach((b, i) => {
        b.leaf.classList.toggle('is-grown', b.y <= y);
        if (current === null) return;
        b.leaf.classList.toggle('is-current', i === current);
        b.leaf.querySelector('.ivy__blade')?.setAttribute('fill', i === current ? fill.leafNow : fill.leaf);
      });
    },
  };
}
