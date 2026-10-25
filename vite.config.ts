import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/site';
import { site } from './src/content/site';
import type { Page } from './src/site/paths';

/**
 * Each page is assembled from the components in `src/site` at build time and
 * written into its HTML file, which names it with a marker: `<!--page-->` is
 * the home page, `<!--page:about-->` the About page. The browser therefore
 * receives finished markup:
 * the content needs no JavaScript, and the bundle only carries behaviour.
 *
 * Vite watches the files this config imports, so editing `content/site.ts`
 * during development reloads the page.
 */
function staticRender(): Plugin {
  return {
    name: 'portfolio:static-render',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const page = (html.match(/<!--page(?::(\w+))?-->/)?.[1] ?? 'home') as Page;
        const title = { home: site.meta.role, about: 'About', experiments: 'Experiments', contact: 'Contact' }[page];
        return html
          .replace(/<!--page(?::\w+)?-->/, renderPage(page))
          .replaceAll('%TITLE%', `${site.meta.name} — ${title}`)
          .replaceAll('%DESCRIPTION%', site.meta.description);
      },
    },
  };
}

export default defineConfig({
  base: '/portfolio/',
  plugins: [staticRender()],
  build: {
    rollupOptions: {
      input: {
        // The portfolio itself.
        main: 'index.html',
        about: 'about/index.html',
        experiments: 'experiments/index.html',
        contact: 'contact/index.html',
        // The Helix Carousel demo. Drop this line to stop shipping it — it
        // is a separate entry and costs the main page nothing either way.
        helix: 'examples/helix.html',
      },
    },
    target: 'es2020',
    cssTarget: 'chrome87',
    reportCompressedSize: true,
  },
});
