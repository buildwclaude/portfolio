/**
 * The paper (with lib/arm): a sheet lying on the floor by the arm, with
 * "hello" written on it in one joined-up stroke, for the arm to pick up and
 * show. Its top edge, where the arm takes it, is the sheet's local +Y edge;
 * its written face looks along local +Z.
 */
import * as THREE from 'three';

type P = [number, number];

/**
 * "hello" in script, as cubic curves end to end, in units of the x-height:
 * the baseline is y = 0, the loops of h and l rise to about 2.4.
 */
const HELLO: [P, P, P, P][] = [
  // h: up into the loop, down the stem, over the arch.
  [[0, 0], [0.4, 0.6], [0.9, 1.8], [0.62, 2.25]],
  [[0.62, 2.25], [0.38, 2.55], [0.12, 2.05], [0.28, 1.2]],
  [[0.28, 1.2], [0.33, 0.8], [0.34, 0.4], [0.33, 0]],
  [[0.33, 0], [0.42, 0.62], [0.62, 1.0], [0.8, 0.95]],
  [[0.8, 0.95], [1.02, 0.9], [1.0, 0.5], [1.0, 0.2]],
  [[1.0, 0.2], [1.0, 0.0], [1.1, 0.0], [1.28, 0.12]],
  // e
  [[1.28, 0.12], [1.52, 0.3], [1.78, 0.55], [1.72, 0.8]],
  [[1.72, 0.8], [1.66, 1.02], [1.4, 0.96], [1.38, 0.7]],
  [[1.38, 0.7], [1.35, 0.4], [1.5, 0.0], [1.76, 0.02]],
  [[1.76, 0.02], [1.92, 0.03], [2.02, 0.1], [2.12, 0.2]],
  // l
  [[2.12, 0.2], [2.42, 0.6], [2.62, 1.7], [2.47, 2.2]],
  [[2.47, 2.2], [2.37, 2.47], [2.15, 2.22], [2.2, 1.6]],
  [[2.2, 1.6], [2.25, 1.0], [2.25, 0.3], [2.4, 0.05]],
  [[2.4, 0.05], [2.5, -0.06], [2.62, 0.05], [2.72, 0.2]],
  // l
  [[2.72, 0.2], [3.02, 0.6], [3.22, 1.7], [3.07, 2.2]],
  [[3.07, 2.2], [2.97, 2.47], [2.75, 2.22], [2.8, 1.6]],
  [[2.8, 1.6], [2.85, 1.0], [2.85, 0.3], [3.0, 0.05]],
  [[3.0, 0.05], [3.1, -0.06], [3.26, 0.05], [3.36, 0.3]],
  // o, and a flick out of it.
  [[3.36, 0.3], [3.42, 0.6], [3.52, 0.9], [3.72, 0.92]],
  [[3.72, 0.92], [3.97, 0.95], [4.07, 0.6], [3.97, 0.3]],
  [[3.97, 0.3], [3.87, 0.0], [3.57, -0.05], [3.52, 0.25]],
  [[3.52, 0.25], [3.47, 0.55], [3.62, 0.85], [3.82, 0.9]],
  [[3.82, 0.9], [4.02, 0.95], [4.22, 0.9], [4.38, 0.84]],
];

// The word's middle and size, in word units.
const MID: P = [2.19, 1.25];
const WORD: P = [4.4, 2.6];

/** The written face: off-white paper, "hello" in a cobalt marker across it. */
function face() {
  const w = 1024, h = 683;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  // Paper, a touch warmer toward the middle.
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, '#FFFEFB');
  g.addColorStop(1, '#F2F0EA');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // The word, filling most of the sheet.
  const unit = Math.min((w * 0.74) / WORD[0], (h * 0.66) / WORD[1]);
  const at = ([x, y]: P): P => [w / 2 + (x - MID[0]) * unit, h / 2 - (y - MID[1]) * unit];
  c.lineCap = c.lineJoin = 'round';
  c.strokeStyle = '#1D3CC9';
  c.lineWidth = unit * 0.15;
  c.beginPath();
  c.moveTo(...at(HELLO[0]![0]));
  for (const [, b, cc, d] of HELLO) c.bezierCurveTo(...at(b), ...at(cc), ...at(d));
  c.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** The sheet, `width` across, its back plain, curling a touch at its sides. */
export function createPaper(width: number) {
  const height = width / 1.5;
  const sheet = new THREE.PlaneGeometry(width, height, 24, 1);
  const p = sheet.attributes.position!;
  for (let i = 0; i < p.count; i++) p.setZ(i, (p.getX(i) / width) ** 2 * width * 0.05);
  sheet.computeVertexNormals();

  const paper = new THREE.Group();
  const front = new THREE.Mesh(sheet, new THREE.MeshStandardMaterial({ map: face(), roughness: 0.92 }));
  const back = new THREE.Mesh(sheet, new THREE.MeshStandardMaterial({ color: '#EFEDE7', roughness: 0.95, side: THREE.BackSide }));
  for (const m of [front, back]) {
    m.castShadow = true;
    m.receiveShadow = true;
    paper.add(m);
  }
  return { paper, width, height };
}
