import { gsap } from 'gsap';
import { ITEMS } from './playground/items';

export function initWarpDetail() {
  const root = document.getElementById('warp-detail');
  if (!root) return;
  const scrim = root.querySelector('.detail__scrim');
  const panel = root.querySelector('.detail__panel');
  const body = root.querySelector('.detail__body');
  const closeBtn = root.querySelector('.detail__close') as HTMLElement;
  const richContent = root.querySelector('#detail-rich-content') as HTMLElement;
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
    
    // Find the item data
    const itemData = ITEMS.find(item => item.title === title);
    
    // The meta info is in the second .meta block
    const metaBlocks = card.querySelectorAll('.meta');
    let metaText = '';
    if (metaBlocks.length > 1) {
      const spans = metaBlocks[1].querySelectorAll('span');
      if (spans.length >= 2) {
        metaText = `${spans[0].textContent} · ${spans[1].textContent}`;
      }
    }

    root.querySelector('#detail-num')!.textContent = num;
    root.querySelector('#detail-title')!.textContent = title;
    root.querySelector('#detail-meta')!.textContent = metaText;
    
    if (itemData && itemData.detail) {
      root.querySelector('#detail-note')!.textContent = itemData.desc;
      
      let html = '';
      if (itemData.detail.meta) {
        html += '<div class="panel-meta-grid" style="margin-bottom: 40px;">' + 
          itemData.detail.meta.map(m => `
            <div class="meta-item">
              <strong>${m.label}</strong>
              <span>${m.value}</span>
            </div>
          `).join('') + '</div>';
      }
      
      if (itemData.detail.sections) {
        html += itemData.detail.sections.map(sec => {
          if (sec.type === 'text') {
            return `
              <div class="panel-section" style="margin-top: 40px;">
                <h3>${sec.heading}</h3>
                <p style="font-size: 16px; line-height: 1.6; color: var(--ink-secondary); margin-top: 12px;">${sec.body}</p>
              </div>
            `;
          }
          if (sec.type === 'stats') {
            const stats = sec.items.map(stat => `
              <div class="stat-item">
                <h4 style="font-size: 36px; font-weight: bold; color: var(--accent); margin-bottom: 8px;">${stat.value}</h4>
                <span style="color: var(--ink-secondary);">${stat.label}</span>
              </div>
            `).join('');
            return `<div class="panel-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; background: rgba(0,0,0,0.03); padding: 32px; border-radius: 8px;">${stats}</div>`;
          }
          if (sec.type === 'image') {
            return `
              <div class="panel-section" style="margin-top: 40px; text-align: center;">
                <img src="${sec.src}" alt="Case study image" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
              </div>
            `;
          }
          return '';
        }).join('');
      }
      
      richContent.innerHTML = html;
      richContent.style.display = 'block';
    } else {
      root.querySelector('#detail-note')!.textContent = 'A beautiful piece of work featured in the gallery.';
      richContent.style.display = 'none';
      richContent.innerHTML = '';
    }

    root.hidden = false;
    document.documentElement.classList.add('is-locked');
    
    // Reset scroll position so it's always at the top when opening
    if (panel) {
      panel.scrollTop = 0;
    }

    

    tl?.kill();
    tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => { busy = false; closeBtn?.focus({ preventScroll: true }); },
    });

    // Make sure panel is visible
    gsap.set(panel, { opacity: 1, visibility: 'visible' });
    gsap.set(body!.children, { opacity: 1, y: 0 });

    tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(panel, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.1);
  }

  function closeCard() {
    if (open < 0 || busy) return;
    const i = open;
    busy = true;

    const card = cards[i];

    const finish = () => {
      root!.hidden = true;
      open = -1;
      busy = false;
      
      document.documentElement.classList.remove('is-locked');
      lastFocus?.focus({ preventScroll: true });
      gsap.set([scrim, panel], { clearProps: 'all' });
    };

    tl?.kill();
    tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: finish });
    tl.to(panel, { opacity: 0, y: 20, duration: 0.35, ease: 'power2.in' }, 0)
      .to(scrim, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.1);
  }
}
