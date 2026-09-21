/* ══════════════════════════════════════════════════════════════════════
   Generated placeholder art. Deliberately free of any Three.js import so
   the homepage can draw previews without pulling in WebGL.
   ══════════════════════════════════════════════════════════════════════ */

// near-monochrome, with the one accent used sparingly — the placeholders
// should read as paper studies, not as decoration
const PAL = ['#14150f', '#6d6f66', '#a3a49c', '#4a7a5c'];
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

export function generate(kind = 'field', label = '') {
  const w = 720, h = 900;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  const r = seeded(label.length * 977 + kind.length * 31 + 13);

  // flat warm paper with the faintest tonal shift top to bottom
  const wash = c.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, '#faf9f6');
  wash.addColorStop(1, '#e7e5df');
  c.fillStyle = wash;
  c.fillRect(0, 0, w, h);

  const draw = {
    field() {
      c.lineWidth = 1;
      for (let i = 0; i < 220; i++) {
        let x = r() * w, y = r() * h;
        c.strokeStyle = PAL[i % 12 === 0 ? 3 : (i * 7) % 3] + '33';
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
      for (const [cx, cy, col] of [[w * 0.38, h * 0.45, '#14150f26'], [w * 0.62, h * 0.55, '#4a7a5c26']]) {
        c.strokeStyle = col;
        for (let i = 1; i < 90; i++) { c.beginPath(); c.arc(cx, cy, i * 14, 0, 7); c.stroke(); }
      }
    },
    rings() {
      for (let i = 0; i < 60; i++) {
        c.strokeStyle = PAL[i % 9 === 0 ? 3 : 1] + (i % 3 ? '2e' : '77');
        c.lineWidth = r() * 3 + 0.6;
        c.beginPath();
        c.arc(w * 0.5, h * 1.05, 60 + i * (h / 52), Math.PI * 1.12, Math.PI * 1.88);
        c.stroke();
      }
    },
    strata() {
      let y = 0;
      while (y < h) {
        const band = 10 + r() * 44;
        c.fillStyle = PAL[r() > 0.9 ? 3 : Math.floor(r() * 3)] + (r() > 0.82 ? '99' : '18');
        c.beginPath(); c.moveTo(0, y);
        for (let x = 0; x <= w; x += 24) c.lineTo(x, y + Math.sin(x * 0.01 + y * 0.05) * 9);
        c.lineTo(w, y + band); c.lineTo(0, y + band); c.fill();
        y += band;
      }
    },
    dots() {
      const st = w / 26;
      for (let x = st / 2; x < w; x += st)
        for (let y = st / 2; y < h; y += st) {
          const d = Math.hypot(x - w * 0.5, y - h * 0.62) / w;
          const rad = Math.max(0.6, (Math.sin(d * 15 - 1) * 0.5 + 0.5) * st * 0.42);
          c.fillStyle = r() > 0.94 ? '#4a7a5c' : '#14150f66';
          c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill();
        }
    },
    grid() {
      c.strokeStyle = '#14150f1a'; c.lineWidth = 1;
      for (let i = 0; i <= 20; i++) {
        c.beginPath(); c.moveTo((w / 16) * i, 0); c.lineTo((w / 16) * i, h); c.stroke();
        c.beginPath(); c.moveTo(0, (h / 20) * i); c.lineTo(w, (h / 20) * i); c.stroke();
      }
      c.font = `600 ${w * 0.13}px Syne, sans-serif`;
      c.fillStyle = '#14150f';
      c.fillText(label.slice(0, 6).toUpperCase(), w * 0.08, h * 0.55);
      c.fillStyle = '#4a7a5c';
      c.fillRect(w * 0.08, h * 0.6, w * 0.16, 3);
    }
  };

  (draw[kind] || draw.field)();
  return cv;
}
