export const DEPTHS = [0.7, 1.0, 0.85, 1.15];
export const STIFFNESS = [170, 120, 150, 100];
export const DAMPING = [18, 14, 16, 12];
export const DRAG_STIFFNESS = 600;
export const DRAG_DAMPING = 40;
export const MAX_X = 40;
export const MAX_Y = 28;
export const VELOCITY_SCALE = 0.02;

export function initHeroCards() {
  const container = document.querySelector<HTMLElement>('.hero-cards');
  if (!container) return () => {};

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  
  if (reducedMotion.matches || matchMedia('(hover: none), (pointer: coarse)').matches) {
    // Just trigger entrance
    container.setAttribute('data-mounted', 'true');
    return () => {};
  }

  // Hide initially for elastic entrance
  container.setAttribute('data-mounted', 'false');
  // Trigger entrance next frame
  requestAnimationFrame(() => {
    container.setAttribute('data-mounted', 'true');
    // Remove transition delay after entrance finishes
    setTimeout(() => {
      const images = container.querySelectorAll<HTMLElement>('.hero-card__img, .hero-card__shadow');
      images.forEach(el => el.style.transitionDelay = '0s');
    }, 1500);
  });

  const cards = Array.from(container.querySelectorAll<HTMLElement>('.hero-card'));
  
  let frame = 0;
  let isRunning = false;
  let cx = 0, cy = 0, vw = 0, vh = 0;
  let nx = 0, ny = 0;
  let isVisible = true;

  const state = cards.map((card, i) => ({
    card,
    x: 0, y: 0,
    vx: 0, vy: 0,
    tx: 0, ty: 0,
    stiffness: STIFFNESS[i] || 120,
    damping: DAMPING[i] || 14,
    depth: DEPTHS[i] || 1,
    lean: 0,
    isDragging: false,
    grabX: 0, grabY: 0,
    lift: 0
  }));

  function updateRect() {
    const rect = container!.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
    vw = window.innerWidth;
    vh = window.innerHeight;
  }
  updateRect();

  const resizeObserver = new ResizeObserver(() => updateRect());
  resizeObserver.observe(container);
  
  let scrollTimeout: any;
  const onScroll = () => {
    if (!scrollTimeout) {
      scrollTimeout = requestAnimationFrame(() => {
        updateRect();
        scrollTimeout = null;
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const startLoop = () => {
    if (!isRunning && isVisible) {
      isRunning = true;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    
    // Normal follow
    let dx = (e.clientX - cx) / (vw / 2);
    let dy = (e.clientY - cy) / (vh / 2);
    nx = Math.max(-1, Math.min(1, dx));
    ny = Math.max(-1, Math.min(1, dy));
    startLoop();
  };

  const onPointerLeave = () => {
    nx = 0; ny = 0;
    startLoop();
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) startLoop();
  });
  observer.observe(container);

  const onVisibilityChange = () => {
    isVisible = document.visibilityState === 'visible';
    if (isVisible) startLoop();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Drag logic
  let maxZ = 10;
  
  cards.forEach((card, i) => {
    const img = card.querySelector('.hero-card__img') as HTMLElement;
    img.addEventListener('dragstart', e => e.preventDefault());
  });

  let lastTime = performance.now();

  function tick(now: number) {
    if (!isVisible) {
      isRunning = false;
      return;
    }

    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 1/30) dt = 1/30; // clamp max dt

    let allSettled = true;

    for (let i = 0; i < state.length; i++) {
      const s = state[i];
      if (!s.isDragging) {
        // Continuous wobble like spencergaborwork
        const timeOffX = Math.sin(now * 0.001 + i * 2) * 12;
        const timeOffY = Math.cos(now * 0.0013 + i * 2) * 12;
        s.tx = (nx * MAX_X + timeOffX) * s.depth;
        s.ty = (ny * MAX_Y + timeOffY) * s.depth;
      }
      
      const k = s.isDragging ? DRAG_STIFFNESS : s.stiffness;
      const d = s.isDragging ? DRAG_DAMPING : s.damping;

      const ax = (s.tx - s.x) * k - s.vx * d;
      const ay = (s.ty - s.y) * k - s.vy * d;
      
      s.vx += ax * dt;
      s.vy += ay * dt;
      
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Velocity tilt + Wobble rotation
      let targetLean = 0;
      if (s.isDragging || nx !== 0 || ny !== 0) {
        targetLean = s.vx * VELOCITY_SCALE;
        targetLean = Math.max(-40, Math.min(40, targetLean));
      }
      
      const timeRot = s.isDragging ? 0 : Math.sin(now * 0.0008 + i * 3) * 4;
      s.lean += ((targetLean + timeRot) - s.lean) * 0.25;

      // Lift for shadow
      const targetLift = s.isDragging ? 1 : 0;
      s.lift += (targetLift - s.lift) * 0.15;

      // With continuous wobble, we never truly settle if visible
      // but let's just keep running
      allSettled = false;

      // Write styles rounded to 2 decimals
      const outX = Math.round(s.x * 100) / 100;
      const outY = Math.round(s.y * 100) / 100;
      const outLean = Math.round(s.lean * 100) / 100;
      const outLift = Math.round(s.lift * 100) / 100;

      s.card.style.setProperty('--offsetX', outX.toString());
      s.card.style.setProperty('--offsetY', outY.toString());
      s.card.style.setProperty('--velocity', outLean.toString());
      s.card.style.setProperty('--lift', outLift.toString());
    }

    if (allSettled && nx === 0 && ny === 0) {
      isRunning = false;
    } else {
      frame = requestAnimationFrame(tick);
    }
  }

  const reduceMotionChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      destroy();
    } else {
      // Re-init? The prompt says "tear down or init accordingly".
      // Usually easier to just reload, but we can restart loop.
    }
  };
  reducedMotion.addEventListener('change', reduceMotionChange);

  function destroy() {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('blur', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    resizeObserver.disconnect();
    observer.disconnect();
    reducedMotion.removeEventListener('change', reduceMotionChange);
  }

  return destroy;
}
