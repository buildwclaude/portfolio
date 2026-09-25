/**
 * The courses folder in the hero (site/courses-folder). The markup arrives
 * open, so it reads without JavaScript; this tucks the tools away and fans
 * them back out on load, and toggles them from the folder.
 */
export function initCoursesFolder() {
  const stage = document.querySelector<HTMLElement>('[data-folder-stage]');
  if (!stage) return;
  const toggle = stage.querySelector<HTMLButtonElement>('[data-folder-toggle]');
  const action = stage.querySelector<HTMLElement>('[data-folder-action]');

  const setOpen = (open: boolean) => {
    stage.classList.toggle('is-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (action) action.textContent = open ? 'Tuck the tools away' : 'Open the folder';
  };

  toggle?.addEventListener('click', () => setOpen(!stage.classList.contains('is-open')));

  // The entrance: closed, then fanned out once the statement has risen.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setOpen(false);
  setTimeout(() => setOpen(true), 700);
}
