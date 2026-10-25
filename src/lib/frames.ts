/**
 * The landing's fan of frames (site/frames): it opens out the first time it
 * comes into view, then leans gently toward the pointer. The lean is two
 * custom properties on the fan, --px and --py, from -1 to 1; the stylesheet
 * turns them into each frame's tilt. Hovering a frame is plain CSS.
 */
export function initFrames(reducedMotion: boolean) {
  const fan = document.querySelector<HTMLElement>('[data-frames]');
  if (!fan) return;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    fan.classList.add('is-open');
    return;
  }

  const seen = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      fan.classList.add('is-open');
      seen.disconnect();
    },
    { threshold: 0.25 },
  );
  seen.observe(fan);

  if (!matchMedia('(hover: hover)').matches) return;

  let frame = 0;
  let x = 0;
  let y = 0;
  fan.addEventListener('pointermove', (e) => {
    const r = fan.getBoundingClientRect();
    x = ((e.clientX - r.left) / r.width) * 2 - 1;
    y = ((e.clientY - r.top) / r.height) * 2 - 1;
    frame ||= requestAnimationFrame(() => {
      frame = 0;
      fan.style.setProperty('--px', x.toFixed(3));
      fan.style.setProperty('--py', y.toFixed(3));
    });
  });
  fan.addEventListener('pointerleave', () => {
    fan.style.setProperty('--px', '0');
    fan.style.setProperty('--py', '0');
  });
}
