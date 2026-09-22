import * as THREE from 'three';

const loader = new THREE.TextureLoader();

/**
 * Try the real image. If it 404s (you haven't dropped your work in
 * /public/img yet), fall back to a generated sketch so the scene
 * still renders. Delete `generate()` once you have real images.
 */
export function loadTexture(img) {
  return new Promise((resolve) => {
    const done = (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      resolve(t);
    };

    loader.load(
      img.getAttribute('src'),
      done,
      undefined,
      () => done(new THREE.CanvasTexture(generate(img.dataset.fallback)))
    );
  });
}

/* ------------------------------------------------------------------ */
/* generative placeholders                                             */
/* ------------------------------------------------------------------ */
const PAL = ['#E5B25D', '#49D4E8', '#F0567F', '#EDE8DE'];
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

function generate(kind = 'field') {
  const w = 900, h = 1120;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  const r = seeded(kind.length * 977 + 13);

  c.fillStyle = '#14181F';
  c.fillRect(0, 0, w, h);

  const draw = {
    field() {
      c.lineWidth = 1.4;
      for (let i = 0; i < 340; i++) {
        let x = r() * w, y = r() * h;
        c.strokeStyle = PAL[(i * 7) % 4] + '55';
        c.beginPath(); c.moveTo(x, y);
        for (let s = 0; s < 70; s++) {
          const a = Math.sin(x * 0.006) * 2 + Math.cos(y * 0.005) * 2;
          x += Math.cos(a) * 7; y += Math.sin(a) * 7;
          c.lineTo(x, y);
        }
        c.stroke();
      }
    },
    moire() {
      c.lineWidth = 2;
      for (const [cx, cy, col] of [[w * 0.38, h * 0.45, '#EDE8DE30'], [w * 0.62, h * 0.55, '#49D4E840']]) {
        c.strokeStyle = col;
        for (let i = 1; i < 110; i++) { c.beginPath(); c.arc(cx, cy, i * 14, 0, 7); c.stroke(); }
      }
    },
    rings() {
      for (let i = 0; i < 60; i++) {
        c.strokeStyle = PAL[i % 4] + (i % 3 ? '40' : '99');
        c.lineWidth = r() * 5 + 0.6;
        c.beginPath();
        c.arc(w * 0.5, h * 1.05, 60 + i * (h / 52), Math.PI * 1.12, Math.PI * 1.88);
        c.stroke();
      }
    },
    strata() {
      let y = 0;
      while (y < h) {
        const band = 10 + r() * 44;
        c.fillStyle = PAL[Math.floor(r() * 4)] + (r() > 0.78 ? 'CC' : '22');
        c.beginPath(); c.moveTo(0, y);
        for (let x = 0; x <= w; x += 24) c.lineTo(x, y + Math.sin(x * 0.01 + y * 0.05) * 9);
        c.lineTo(w, y + band); c.lineTo(0, y + band); c.fill();
        y += band;
      }
    },
    dots() {
      const step = w / 26;
      for (let x = step / 2; x < w; x += step)
        for (let y = step / 2; y < h; y += step) {
          const d = Math.hypot(x - w * 0.5, y - h * 0.62) / w;
          const rad = Math.max(0.6, (Math.sin(d * 15 - 1) * 0.5 + 0.5) * step * 0.42);
          c.fillStyle = r() > 0.93 ? '#F0567F' : '#EDE8DEAA';
          c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill();
        }
    },
    grid() {
      c.strokeStyle = '#EDE8DE22'; c.lineWidth = 1.5;
      for (let i = 0; i <= 16; i++) {
        c.beginPath(); c.moveTo((w / 16) * i, 0); c.lineTo((w / 16) * i, h); c.stroke();
        c.beginPath(); c.moveTo(0, (h / 20) * i); c.lineTo(w, (h / 20) * i); c.stroke();
      }
      c.font = `700 ${w * 0.32}px 'Space Mono', monospace`;
      c.fillStyle = '#E5B25D'; c.fillText('06', w * 0.1, h * 0.56);
      c.strokeStyle = '#49D4E8'; c.lineWidth = 2;
      c.strokeText('06', w * 0.1 + 10, h * 0.56 + 12);
    }
  };

  (draw[kind] || draw.field)();
  return cv;
}
