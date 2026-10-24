/**
 * Navigation behaviour: the current section marker and the menu. All of
 * it is progressive — the links work with none of this running.
 */

export function initNav(root: ParentNode = document) {
  const toggle = root.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const toggleLabel = root.querySelector<HTMLElement>('[data-menu-label]');
  const menu = root.querySelector<HTMLElement>('[data-menu]');
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));

  /* --- Current section -------------------------------------------------- */
  const sections = links
    .map((link) => document.querySelector<HTMLElement>(link.getAttribute('href') ?? ''))
    .filter((section): section is HTMLElement => section !== null);

  if (sections.length > 0) {
    const setCurrent = (id: string) => {
      for (const link of links) {
        const active = link.getAttribute('href') === `#${id}`;
        link.toggleAttribute('data-current', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        }
      },
      { rootMargin: '-50% 0px -45% 0px', threshold: 0 },
    );
    for (const section of sections) observer.observe(section);
  }

  /* --- Mobile menu ------------------------------------------------------ */
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.toggleAttribute('data-menu-open', open);
    if (toggleLabel) toggleLabel.textContent = open ? 'Close' : 'Menu';
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    toggle.focus();
  });

  // Leaving the mobile breakpoint should never strand the panel open.
  matchMedia('(min-width: 861px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
