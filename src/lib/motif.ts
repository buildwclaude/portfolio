import type { Book } from '../content/site';

/**
 * The line drawing for each chapter: stamped on its volume's cover on the
 * shelf, and drawn again on its spread in the sketchbook. Strokes one path
 * in the context's current style, centred on (cx, cy) at radius r.
 */
export function motif(ctx: CanvasRenderingContext2D, kind: Book['motif'], cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (kind === 'steps') {
    // A staircase: one role, then the next.
    const n = 5;
    const w = (2 * r) / n;
    ctx.moveTo(cx - r, cy + r * 0.8);
    for (let k = 0; k < n; k++) {
      const y = cy + r * 0.8 - ((k + 1) * 1.6 * r) / n;
      ctx.lineTo(cx - r + k * w, y);
      ctx.lineTo(cx - r + (k + 1) * w, y);
    }
    ctx.lineTo(cx + r, cy + r * 0.8);
    ctx.closePath();
  } else if (kind === 'rosette') {
    // An award rosette: a ring of petals round a medal, two ribbons below.
    const petals = 16;
    for (let k = 0; k < petals; k++) {
      const a = (k / petals) * Math.PI * 2;
      const px = cx + Math.cos(a) * r * 0.62;
      const py = cy - r * 0.2 + Math.sin(a) * r * 0.62;
      ctx.moveTo(px + r * 0.2, py);
      ctx.arc(px, py, r * 0.2, 0, Math.PI * 2);
    }
    ctx.moveTo(cx + r * 0.42, cy - r * 0.2);
    ctx.arc(cx, cy - r * 0.2, r * 0.42, 0, Math.PI * 2);
    for (const s of [-1, 1]) {
      ctx.moveTo(cx + s * r * 0.15, cy + r * 0.3);
      ctx.lineTo(cx + s * r * 0.4, cy + r * 1.05);
      ctx.lineTo(cx + s * r * 0.22, cy + r * 0.92);
      ctx.lineTo(cx + s * r * 0.05, cy + r * 1.05);
      ctx.lineTo(cx + s * r * 0.03, cy + r * 0.34);
    }
  } else if (kind === 'circles') {
    // People in overlapping circles.
    const ring = 5;
    for (let k = 0; k < ring; k++) {
      const a = (k / ring) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * r * 0.42;
      const py = cy + Math.sin(a) * r * 0.42;
      ctx.moveTo(px + r * 0.5, py);
      ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
    }
  } else if (kind === 'waves') {
    // A voice carrying out to a room.
    ctx.moveTo(cx - r * 0.72, cy);
    ctx.arc(cx - r * 0.8, cy, r * 0.08, 0, Math.PI * 2);
    for (let k = 1; k <= 5; k++) {
      const rr = (r * 1.6 * k) / 5;
      ctx.moveTo(cx - r * 0.8 + Math.cos(-0.7) * rr, cy + Math.sin(-0.7) * rr);
      ctx.arc(cx - r * 0.8, cy, rr, -0.7, 0.7);
    }
  } else {
    // A sprout: something started and still growing.
    ctx.moveTo(cx, cy + r);
    ctx.bezierCurveTo(cx, cy + r * 0.3, cx - r * 0.1, cy - r * 0.2, cx + r * 0.05, cy - r * 0.8);
    ctx.moveTo(cx - r * 0.02, cy + r * 0.05);
    ctx.bezierCurveTo(cx - r * 0.3, cy - r * 0.35, cx - r * 0.85, cy - r * 0.2, cx - r * 0.95, cy - r * 0.55);
    ctx.bezierCurveTo(cx - r * 0.55, cy - r * 0.75, cx - r * 0.15, cy - r * 0.45, cx - r * 0.02, cy + r * 0.05);
    ctx.moveTo(cx + r * 0.02, cy - r * 0.35);
    ctx.bezierCurveTo(cx + r * 0.3, cy - r * 0.75, cx + r * 0.75, cy - r * 0.7, cx + r * 0.85, cy - r * 1.0);
    ctx.bezierCurveTo(cx + r * 0.45, cy - r * 1.1, cx + r * 0.1, cy - r * 0.8, cx + r * 0.02, cy - r * 0.35);
    ctx.moveTo(cx - r * 0.9, cy + r);
    ctx.lineTo(cx + r * 0.9, cy + r);
  }
  ctx.stroke();
}
