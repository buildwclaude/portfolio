/**
 * The top bar's hover (site/header): the letters of a page's name flicker
 * through random characters and settle back, left to right, like a word
 * being decoded. Each letter is held at its own width while it flickers, so
 * the word never jumps. Nothing happens under reduced motion.
 */
const NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/<>?';
const STEP = 32; // ms between frames
const SETTLE = 2; // frames each letter flickers before its neighbour settles

export function initTopbar(reducedMotion: boolean) {
  if (reducedMotion) return;

  document.querySelectorAll<HTMLElement>('.topbar__link').forEach((link) => {
    const letters = Array.from(link.querySelectorAll<HTMLElement>('.scramble__ch'));
    const original = letters.map((l) => l.textContent ?? '');
    let timer = 0;

    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
      letters.forEach((l, i) => {
        l.textContent = original[i]!;
        l.classList.remove('is-noise');
        l.style.width = '';
      });
    };

    const start = () => {
      if (timer) return;
      letters.forEach((l) => (l.style.width = `${l.getBoundingClientRect().width}px`));
      let frame = 0;
      timer = window.setInterval(() => {
        frame += 1;
        let done = true;
        letters.forEach((l, i) => {
          const blank = original[i]!.trim() === '';
          if (blank || frame > (i + 1) * SETTLE) {
            l.textContent = original[i]!;
            l.classList.remove('is-noise');
          } else {
            done = false;
            l.textContent = NOISE[Math.floor(Math.random() * NOISE.length)]!;
            l.classList.add('is-noise');
          }
        });
        if (done) stop();
      }, STEP);
    };

    link.addEventListener('pointerenter', start);
    link.addEventListener('focus', start);
  });
}
