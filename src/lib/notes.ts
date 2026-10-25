/**
 * The sticky notes on the landing (site/hero): a stack whose top note is
 * peeled by its folded corner. Dragging the corner folds the sheet back as
 * far as the pointer has travelled toward the opposite corner (--pull, 0–1,
 * read by the stylesheet). Let go past a third — or simply click the corner
 * — and it peels right off: the fold sweeps across the whole sheet, it
 * flies away, and it slips to the back of the stack. A short pull folds
 * back down.
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

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 0 : ms));
  let busy = false;

  const peel = async (note: HTMLElement) => {
    if (busy) return;
    busy = true;
    note.style.removeProperty('--pull');
    note.classList.add('is-peeling');
    await wait(260);
    note.classList.add('is-gone');
    await wait(420);
    // Back under the stack, flat again, with no animation on the way.
    note.classList.add('is-resetting');
    note.classList.remove('is-peeling', 'is-gone');
    order = [...order.slice(1), note];
    restack();
    void note.offsetWidth;
    note.classList.remove('is-resetting');
    busy = false;
    order[0]?.querySelector<HTMLElement>('[data-note-peel]')?.focus({ preventScroll: true });
  };

  stack.querySelectorAll<HTMLButtonElement>('[data-note-peel]').forEach((corner) => {
    const note = corner.closest<HTMLElement>('[data-note]')!;
    let start: { x: number; y: number } | null = null;
    let moved = false;
    // How far along the diagonal a full peel is, in pixels.
    const reach = () => note.getBoundingClientRect().width * 0.9;

    corner.addEventListener('pointerdown', (e) => {
      if (note !== order[0] || busy) return;
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY };
      moved = false;
      corner.setPointerCapture(e.pointerId);
      note.classList.add('is-pulling');
    });
    corner.addEventListener('pointermove', (e) => {
      if (!start) return;
      // Toward the opposite (top left) corner is what folds it.
      const along = (start.x - e.clientX + (start.y - e.clientY)) / Math.SQRT2;
      const pull = Math.max(0, Math.min(along / reach(), 1));
      if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 4) moved = true;
      note.style.setProperty('--pull', pull.toFixed(3));
    });
    const release = () => {
      if (!start) return;
      start = null;
      const pull = Number(note.style.getPropertyValue('--pull') || 0);
      note.classList.remove('is-pulling');
      if (pull > 0.33) void peel(note);
      else note.style.removeProperty('--pull');
    };
    corner.addEventListener('pointerup', release);
    corner.addEventListener('pointercancel', release);
    // A click with no drag (or Enter / Space) peels it straight away.
    corner.addEventListener('click', () => {
      if (!moved && note === order[0]) void peel(note);
      moved = false;
    });
  });
}
