/**
 * The site's pages and where they live. The site is served under `base`
 * (vite.config.ts), so every link between pages starts from it.
 */
export const BASE = '/portfolio/';

export type Page = 'home' | 'about' | 'experiments' | 'contact';

export const pageHref: Record<Page, string> = {
  home: BASE,
  about: `${BASE}about/`,
  experiments: `${BASE}experiments/`,
  contact: `${BASE}contact/`,
};

/**
 * A link as written in content: a section of the home page ('#warp-work')
 * or another page ('about/'). On the home page a section stays a bare hash,
 * so the smooth scroll takes it; anywhere else it goes home first.
 */
export function resolveHref(href: string, page: Page) {
  if (href.startsWith('#')) return page === 'home' ? href : `${BASE}${href}`;
  if (/^[a-z]+:/i.test(href) || href.startsWith('/')) return href;
  return `${BASE}${href}`;
}
