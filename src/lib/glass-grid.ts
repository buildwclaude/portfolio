/**
 * The glass grid in the hero (site/glass-grid). Leans the glow behind the
 * tiles a little toward the pointer, so the light seems to follow it; the
 * stylesheet eases the move. Nothing to do under reduced motion.
 */
export function initGlassGrid() {
  const stage = document.querySelector<HTMLElement>('[data-glass] .glass__stage');
  if (!stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  window.addEventListener(
    'pointermove',
    (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = stage.getBoundingClientRect();
        // -1 to 1 across the stage, held there once the pointer is outside.
        const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
        const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
        stage.style.setProperty('--gx', x.toFixed(3));
        stage.style.setProperty('--gy', y.toFixed(3));
      });
    },
    { passive: true },
  );
}
