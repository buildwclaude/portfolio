import { gsap } from 'gsap';

export function initWarpDetail() {
  const root = document.getElementById('warp-detail');
  if (!root) return;
  const scrim = root.querySelector('.detail__scrim');
  const panel = root.querySelector('.detail__panel');
  const figure = root.querySelector('.detail__figure');
  const img = root.querySelector('#detail-img') as HTMLImageElement;
  const body = root.querySelector('.detail__body');
  const closeBtn = root.querySelector('.detail__close') as HTMLElement;
  const cards = gsap.utils.toArray('.warp-card') as HTMLElement[];

  let open = -1;
  let busy = false;
  let lastFocus: HTMLElement | null = null;
  let tl: any = null;

  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openCard(i);
    });
  });

  root.querySelectorAll('[data-detail-close]').forEach((el) => {
    el.addEventListener('click', () => closeCard());
  });

  document.addEventListener('keydown', (e) => {
    if (open < 0) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCard(); }
  });

  function openCard(i: number) {
    if (busy || open >= 0) return;
    busy = true;
    open = i;
    lastFocus = document.activeElement as HTMLElement;

    const card = cards[i];
    const sourceImg = card.querySelector('img') as HTMLImageElement;
    const title = card.querySelector('.title')?.textContent || '';
    const num = card.querySelector('.idx')?.textContent || '';
    
    // The meta info is in the second .meta block
    const metaBlocks = card.querySelectorAll('.meta');
    let metaText = '';
    if (metaBlocks.length > 1) {
      const spans = metaBlocks[1].querySelectorAll('span');
      if (spans.length >= 2) {
        metaText = `${spans[0].textContent} · ${spans[1].textContent}`;
      }
    }

    img.src = sourceImg.currentSrc || sourceImg.src;
    img.alt = sourceImg.alt;
    root.querySelector('#detail-num')!.textContent = num;
    root.querySelector('#detail-title')!.textContent = title;
    root.querySelector('#detail-meta')!.textContent = metaText;
    root.querySelector('#detail-note')!.textContent = 'A beautiful piece of work featured in the gallery.';

    root.hidden = false;
    document.documentElement.classList.add('is-locked');

    const cardFigure = card.querySelector('figure') as HTMLElement;
    const from = cardFigure.getBoundingClientRect();

    gsap.set(panel, { opacity: 1 });
    gsap.set(figure, { clearProps: 'transform' });
    const to = figure!.getBoundingClientRect();

    card.classList.add('is-lifting');

    tl?.kill();
    tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => { busy = false; closeBtn?.focus({ preventScroll: true }); },
    });

    tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.05)
      .fromTo(figure, {
        x: from.left - to.left,
        y: from.top - to.top,
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
      }, {
        x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.9,
      }, 0)
      .fromTo(body!.children,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, 0.35);
  }

  function closeCard() {
    if (open < 0 || busy) return;
    const i = open;
    busy = true;

    const card = cards[i];
    const cardFigure = card.querySelector('figure') as HTMLElement;
    const from = cardFigure.getBoundingClientRect();
    const to = figure!.getBoundingClientRect();

    const finish = () => {
      root!.hidden = true;
      open = -1;
      busy = false;
      card.classList.remove('is-lifting');
      document.documentElement.classList.remove('is-locked');
      lastFocus?.focus({ preventScroll: true });
      gsap.set([scrim, panel], { clearProps: 'opacity' });
      gsap.set(figure, { clearProps: 'transform' });
    };

    tl?.kill();
    tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finish });
    tl.to(body!.children, { opacity: 0, y: 12, duration: 0.3, ease: 'power2.in' }, 0)
      .to(figure, {
        x: from.left - to.left,
        y: from.top - to.top,
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
        duration: 0.75,
      }, 0.05)
      .to(panel, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.45)
      .to(scrim, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.4);
  }
}
