import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/site';
import { site } from './src/content/site';

/**
 * The page is assembled from the components in `src/site` at build time and
 * written into index.html. The browser therefore receives finished markup:
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
        return html
          .replace('<!--page-->', renderPage())
          .replaceAll('%TITLE%', `${site.meta.name} — ${site.meta.role}`)
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
