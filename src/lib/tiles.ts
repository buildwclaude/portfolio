/**
 * The tiles under the landing text (site/tiles):
 *
 *   - the greeting turns to the next language every couple of seconds,
 *     while the tile is on screen;
 *   - the art stack shuffles, one piece to the front at a time, while the
 *     pointer rests on it;
 *   - the battery follows its slider: --level (0–1) sets the fill and its
 *     colour, and the reading says how much was human.
 */
export function initTiles(reducedMotion: boolean) {
  const root = document.querySelector<HTMLElement>('[data-tiles]');
  if (!root) return;

  /* --- Hello, in turn ---------------------------------------------------- */
  const word = root.querySelector<HTMLElement>('[data-hello]');
  const words: string[] = word ? JSON.parse(word.dataset.hello || '[]') : [];
  if (word && words.length > 1 && !reducedMotion) {
    let i = 0;
    let timer = 0;
    const next = () => {
      word.classList.add('is-leaving');
      window.setTimeout(() => {
        i = (i + 1) % words.length;
        word.textContent = words[i]!;
        word.classList.remove('is-leaving');
        word.classList.add('is-arriving');
        requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove('is-arriving')));
      }, 260);
    };
    new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry?.isIntersecting) timer = window.setInterval(next, 2000);
    }).observe(word);
  }

  /* --- Art, shuffled under the pointer ------------------------------------ */
  root.querySelectorAll<HTMLElement>('[data-riffle]').forEach((tile) => {
    const pieces = Array.from(tile.querySelectorAll<HTMLElement>('.riffle img'));
    if (pieces.length < 2) return;
    let top = 0;
    let timer = 0;
    const show = () => pieces.forEach((p, n) => p.style.setProperty('--n', String((n - top + pieces.length) % pieces.length)));
    const step = () => {
      top = (top + 1) % pieces.length;
      show();
    };
    tile.addEventListener('pointerenter', () => {
      if (reducedMotion) return;
      step();
      timer = window.setInterval(step, 650);
    });
    tile.addEventListener('pointerleave', () => window.clearInterval(timer));
  });

  /* --- The social battery -------------------------------------------------- */
  const battery = root.querySelector<HTMLElement>('[data-battery]');
  const input = battery?.querySelector<HTMLInputElement>('[data-battery-input]');
  const read = battery?.querySelector<HTMLElement>('[data-battery-read]');
  if (battery && input) {
    const update = () => {
      const v = Number(input.value);
      battery.style.setProperty('--level', String(v / 100));
      input.setAttribute('aria-valuetext', `${v}% human, ${100 - v}% AI`);
      if (read) read.textContent = `${v}% human`;
    };
    input.addEventListener('input', update);
    update();
  }
}
