import { createHelixCarousel } from '../src/components/helix-carousel';

/* The whole integration: build it, mount it. */
const helix = createHelixCarousel({
  // images: ['/work/yatri-hub.webp', ...],   ← your own images go here
  label: 'Selected imagery',
  alt: (i) => `Placeholder image ${i + 1}`,
});

document.querySelector('#mount')?.appendChild(helix.element);

// On a single-page app, call this when the view unmounts:
// helix.destroy();
