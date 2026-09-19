/**
 * Navigation behaviour: the header's scrolled state, the current section
 * marker, and the mobile menu. All of it is progressive — the links work
 * with none of this running.
 */

export function initNav(root: ParentNode = document) {
  const header = root.querySelector<HTMLElement>('[data-header]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const toggleLabel = root.querySelector<HTMLElement>('[data-menu-label]');
  const menu = root.querySelector<HTMLElement>('[data-menu]');
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));

  /* --- Header separator ------------------------------------------------
     A 1px sentinel at the top of the document tells us when the page has
     left the very top. Cheaper and steadier than a scroll listener. */
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;';
    document.body.prepend(sentinel);
    new IntersectionObserver(
      ([entry]) => header.toggleAttribute('data-scrolled', !entry?.isIntersecting),
      { threshold: 0 },
    ).observe(sentinel);
  }

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
