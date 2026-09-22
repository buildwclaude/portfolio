import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The thin rail down the left edge that tracks overall page scroll progress.
 */
export function initRail(onProgress?: (p: number) => void) {
  const rail = document.querySelector<HTMLElement>('.rail');
  const fill = document.querySelector<HTMLElement>('.rail__fill');
  if (!rail || !fill) return;

  const sections = gsap.utils.toArray<HTMLElement>('section.section, section.warp-work, section.hero');
  const ticks: HTMLElement[] = [];

  sections.forEach((sec, i) => {
    // Skip the very first section if desired, but we can just add it
    if (i === 0) return; 
    const tick = document.createElement('span');
    tick.className = 'rail__tick';
    rail.appendChild(tick);
    ticks.push(tick);
  });

  const apply = (p: number) => {
    gsap.set(fill, { scaleY: p });
    ticks.forEach((t) => {
      const at = parseFloat(t.style.getPropertyValue('--at')) || 0;
      t.classList.toggle('is-past', p >= at - 0.001);
    });
    onProgress?.(p);
  };

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => {
      // Recalculate tick positions on resize
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      sections.forEach((sec, i) => {
        if (i === 0) return;
        const offset = sec.offsetTop;
        // The scroll progress needed to reach this section's top
        const progress = Math.min(1, Math.max(0, offset / scrollHeight));
        ticks[i - 1].style.setProperty('--at', progress.toString());
      });
      apply(self.progress);
    },
  });

  apply(0);
}
