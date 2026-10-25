/**
 * The sticky notes on the landing (site/hero): a stack whose top note can
 * be peeled away by its folded corner. Dragging the corner lifts and curls
 * the note as far as it's pulled (--pull, 0–1, read by the stylesheet); let
 * go past halfway — or simply click the corner — and it peels off and slips
 * to the back of the stack, showing the next note underneath.
 */
export function initNotes(reducedMotion: boolean) {
  const stack = document.querySelector<HTMLElement>('[data-notes]');
  if (!stack) return;
  let order = Array.from(stack.querySelectorAll<HTMLElement>('[data-note]'));
  if (order.length < 2) return;

  const restack = () => {
    order.forEach((note, i) => {
      note.style.setProperty('--z', String(order.length - i));
      note.classList.toggle('is-top', i === 0);
      const corner = note.querySelector<HTMLButtonElement>('[data-note-peel]');
      if (corner) corner.tabIndex = i === 0 ? 0 : -1;
    });
  };
  restack();

  let busy = false;
  const peel = (note: HTMLElement) => {
    if (busy) return;
    busy = true;
    note.classList.add('is-peeling');
    window.setTimeout(
      () => {
        order = [...order.slice(1), note];
        note.classList.remove('is-peeling');
        note.style.setProperty('--pull', '0');
        restack();
        busy = false;
        order[0]?.querySelector<HTMLElement>('[data-note-peel]')?.focus({ preventScroll: true });
      },
      reducedMotion ? 0 : 480,
    );
  };

  stack.querySelectorAll<HTMLButtonElement>('[data-note-peel]').forEach((corner) => {
    const note = corner.closest<HTMLElement>('[data-note]')!;
    let start: { x: number; y: number } | null = null;
    let moved = false;

    corner.addEventListener('pointerdown', (e) => {
      if (note !== order[0] || busy) return;
      start = { x: e.clientX, y: e.clientY };
      moved = false;
      corner.setPointerCapture(e.pointerId);
      note.classList.add('is-pulling');
    });
    corner.addEventListener('pointermove', (e) => {
      if (!start) return;
      const pull = Math.min(Math.hypot(e.clientX - start.x, e.clientY - start.y) / 110, 1);
      if (pull > 0.04) moved = true;
      note.style.setProperty('--pull', pull.toFixed(3));
    });
    const release = () => {
      if (!start) return;
      start = null;
      note.classList.remove('is-pulling');
      const pull = Number(note.style.getPropertyValue('--pull') || 0);
      if (pull > 0.45) peel(note);
      else note.style.setProperty('--pull', '0');
    };
    corner.addEventListener('pointerup', release);
    corner.addEventListener('pointercancel', release);
    // A click with no drag (or Enter / Space) peels it straight away.
    corner.addEventListener('click', () => {
      if (!moved && note === order[0]) peel(note);
      moved = false;
    });
  });
}
