/**
 * The Kodama companion.
 *
 * Three small responsibilities and nothing else:
 *   1. show itself once a real frame exists, and remove itself if the clip
 *      is not there,
 *   2. stay muted,
 *   3. hold still for anyone who asked for reduced motion.
 *
 * No hover, no cursor following, no scroll behaviour. It is a creature,
 * not a widget.
 */
export function initKodama(reducedMotion: boolean, root: ParentNode = document) {
  const host = root.querySelector<HTMLElement>('[data-kodama]');
  const video = host?.querySelector('video');
  if (!host || !video) return;

  video.muted = true; // belt and braces: never surprise anyone with audio
  video.volume = 0;

  const remove = () => host.remove();

  /* --- Giving up -------------------------------------------------------
     A <video> does not fire `error` when it simply runs out of <source>
     children — the last source does. Listening anywhere else would drop
     the companion the moment the first format was unsupported, even
     though the fallback was about to work. */
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    remove();
    return;
  }
  video.addEventListener('error', remove);
  const sources = video.querySelectorAll('source');
  sources[sources.length - 1]?.addEventListener('error', remove);

  /* --- Appearing --------------------------------------------------------
     The clip is small enough to finish decoding before this module runs,
     so the current state has to be checked as well as listened for. */
  const reveal = () => {
    host.setAttribute('data-ready', '');
    if (reducedMotion) video.pause(); // the first frame is enough
  };

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) reveal();
  else video.addEventListener('loadeddata', reveal, { once: true });

  if (reducedMotion) {
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }

  // Some browsers refuse autoplay until the first interaction; try again
  // quietly rather than showing a control.
  const play = () => void video.play().catch(() => undefined);
  play();
  document.addEventListener('pointerdown', play, { once: true, passive: true });

  // Stop decoding while the tab is in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
}
