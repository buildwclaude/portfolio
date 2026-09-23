import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The ruler down the left edge. The line fills with overall page progress,
 * a marker with a three-digit readout rides along it, and each section has a
 * numbered mark placed where that section starts — hover names it, click
 * goes there.
 */
export function initRail(onProgress?: (p: number) => void) {
  const rail = document.querySelector<HTMLElement>('.rail');
  const fill = rail?.querySelector<HTMLElement>('.rail__fill');
  const marker = rail?.querySelector<HTMLElement>('.rail__marker');
  const readout = rail?.querySelector<HTMLElement>('.rail__readout');
  if (!rail || !fill || !marker || !readout) return;

  const ticks = Array.from(rail.querySelectorAll<HTMLAnchorElement>('.rail__tick')).map((el) => ({
    el,
    target: document.querySelector<HTMLElement>(el.getAttribute('href') || ''),
    at: 0,
  }));

  const apply = (p: number) => {
    gsap.set(fill, { scaleY: p });
    marker.style.setProperty('--p', String(p));
    readout.textContent = String(Math.round(p * 100)).padStart(3, '0');

    // The current section is the last one whose start has been passed.
    let current = 0;
    ticks.forEach((t, i) => {
      if (p >= t.at - 0.001) current = i;
    });
    ticks.forEach((t, i) => {
      t.el.classList.toggle('is-past', i <= current);
      t.el.classList.toggle('is-current', i === current);
    });
    onProgress?.(p);
  };

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => {
      // Place each mark at the scroll progress where its section begins.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (const t of ticks) {
        const top = t.target ? t.target.getBoundingClientRect().top + window.scrollY : 0;
        t.at = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
        t.el.style.setProperty('--at', String(t.at));
      }
      apply(self.progress);
    },
  });

  apply(0);
}
