import { html, raw } from '../lib/html';

/**
 * The interaction loop, drafted as a plate for the right of the first
 * screen: what a UI/UX engineer works on, drawn as HCI draws it.
 *
 * Above, an interface in wireframe: an image placeholder, text lines, a
 * button with its tap-target callout, and a dimension across the window.
 * Below, the person: an eye at the centre of the loop Norman describes —
 * intent, action, feedback, evaluation — with a marker going round it.
 *
 * One nine-second cycle, all CSS, all on one clock: the eye looks to the
 * button (intent); the cursor leaves the loop and clicks it (action); the
 * button answers with a ripple, a fill and a confirmation (feedback); the
 * eye reads the confirmation (evaluation). Plain SVG, built once.
 */
const W = 400;
const H = 800;

/** The window. */
const WIN = { x: 56, y: 78, w: 288, h: 344 };
/** The button, and where the cursor lands on it. */
const BTN = { x: 80, y: 330, w: 156, h: 40 };
const CLICK = { x: BTN.x + BTN.w * 0.62, y: BTN.y + BTN.h * 0.55 };
/** The confirmation that appears once the button is pressed. */
const TOAST = { x: 170, y: 384, w: 150, h: 24 };
/** The loop. */
const LOOP = { x: 200, y: 614, r: 96 };

const f = (n: number) => n.toFixed(1);

const STEPS = [
  { label: 'Intent', angle: -90 },
  { label: 'Action', angle: 0 },
  { label: 'Feedback', angle: 90 },
  { label: 'Evaluate', angle: 180 },
];

function node(step: (typeof STEPS)[number], i: number) {
  const a = (step.angle * Math.PI) / 180;
  const x = LOOP.x + Math.cos(a) * LOOP.r;
  const y = LOOP.y + Math.sin(a) * LOOP.r;
  // Labels sit outside the ring, on the side they belong to.
  const out = 16;
  const lx = x + Math.cos(a) * out;
  const ly = y + Math.sin(a) * out + (Math.abs(Math.sin(a)) > 0.5 ? (Math.sin(a) > 0 ? 8 : -2) : 3);
  const anchor = Math.cos(a) > 0.5 ? 'start' : Math.cos(a) < -0.5 ? 'end' : 'middle';
  return `
    <g class="hci__step hci__step--${i + 1}">
      <circle class="hci__node" cx="${f(x)}" cy="${f(y)}" r="5"/>
      <text class="hci__step-label" x="${f(lx)}" y="${f(ly)}" text-anchor="${anchor}">${String(i + 1).padStart(2, '0')} ${step.label.toUpperCase()}</text>
    </g>`;
}

/** Small chevrons on the ring, pointing the way round. */
function chevrons() {
  return [-45, 45, 135, 225]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      const x = LOOP.x + Math.cos(a) * LOOP.r;
      const y = LOOP.y + Math.sin(a) * LOOP.r;
      // Tangent direction for clockwise travel.
      const rot = deg + 90;
      return `<path class="hci__line" d="M-4 -4L0 0L-4 4" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"/>`;
    })
    .join('');
}

/**
 * The cursor's route, handed to the stylesheet: it sets off from the Action
 * node, swings out past the window's corner, and lands on the button.
 */
function cursorVars() {
  const from = { x: LOOP.x + LOOP.r, y: LOOP.y };
  const via = { x: 322, y: 470 };
  return [
    ['x0', from.x],
    ['y0', from.y],
    ['x1', via.x],
    ['y1', via.y],
    ['x2', CLICK.x],
    ['y2', CLICK.y],
  ]
    .map(([k, n]) => `--${k}:${f(n as number)}px`)
    .join(';');
}

export function interaction() {
  const textLines = [
    [248, 0.86],
    [262, 0.72],
    [276, 0.8],
    [298, 0.55],
  ]
    .map(([y, k]) => `<path class="hci__faint" d="M${WIN.x + 24} ${y}H${f(WIN.x + 24 + (WIN.w - 48) * k!)}"/>`)
    .join('');

  const img = { x: WIN.x + 24, y: WIN.y + 40, w: WIN.w - 48, h: 108 };

  return html`
    <figure class="hero__hci" aria-hidden="true">
      <svg viewBox="0 0 ${String(W)} ${String(H)}" preserveAspectRatio="xMidYMax meet">
        <!-- width dimension over the window -->
        <g class="hci__note">
          <path d="M${WIN.x} ${WIN.y - 26}V${WIN.y - 12}M${WIN.x + WIN.w} ${WIN.y - 26}V${WIN.y - 12}M${WIN.x} ${WIN.y - 19}H${WIN.x + WIN.w}"/>
          <path class="hci__arrow" d="M${WIN.x} ${WIN.y - 19}l8 -3v6zM${WIN.x + WIN.w} ${WIN.y - 19}l-8 -3v6z"/>
          <text x="${WIN.x + WIN.w / 2}" y="${WIN.y - 24}" text-anchor="middle">360 PT</text>
        </g>

        <!-- the interface -->
        <rect class="hci__line hci__paper" x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}"/>
        <path class="hci__line" d="M${WIN.x} ${WIN.y + 22}H${WIN.x + WIN.w}"/>
        ${raw([0, 1, 2].map((k) => `<circle class="hci__line" cx="${WIN.x + 14 + k * 11}" cy="${WIN.y + 11}" r="3"/>`).join(''))}
        <rect class="hci__line" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}"/>
        <path class="hci__faint" d="M${img.x} ${img.y}L${img.x + img.w} ${img.y + img.h}M${img.x + img.w} ${img.y}L${img.x} ${img.y + img.h}"/>
        ${raw(textLines)}

        <!-- the button: outline, its pressed fill, and both labels -->
        <rect class="hci__line hci__paper" x="${BTN.x}" y="${BTN.y}" width="${BTN.w}" height="${BTN.h}"/>
        <rect class="hci__press" x="${BTN.x}" y="${BTN.y}" width="${BTN.w}" height="${BTN.h}"/>
        <text class="hci__btn-label" x="${BTN.x + 16}" y="${BTN.y + 24}">CONTINUE →</text>
        <text class="hci__btn-label hci__btn-label--on" x="${BTN.x + 16}" y="${BTN.y + 24}">CONTINUE →</text>
        <g class="hci__note">
          <circle cx="${BTN.x + 30}" cy="${BTN.y + BTN.h}" r="1.8"/>
          <path d="M${BTN.x + 30} ${BTN.y + BTN.h}V${WIN.y + WIN.h + 26}H${BTN.x + 46}"/>
          <text x="${BTN.x + 50}" y="${WIN.y + WIN.h + 29}">TAP TARGET ≥ 44 PT</text>
        </g>

        <!-- the ripple where the cursor presses -->
        ${raw(
          [0, 1].map((k) => `<circle class="hci__ripple hci__ripple--${k + 1}" cx="${f(CLICK.x)}" cy="${f(CLICK.y)}" r="26"/>`).join(''),
        )}

        <!-- feedback -->
        <g class="hci__toast">
          <rect class="hci__line hci__paper" x="${TOAST.x}" y="${TOAST.y}" width="${TOAST.w}" height="${TOAST.h}"/>
          <path class="hci__line" d="M${TOAST.x + 10} ${TOAST.y + 12}l4 4l8 -9"/>
          <text class="hci__small" x="${TOAST.x + 30}" y="${TOAST.y + 16}">DONE · 120 MS</text>
        </g>

        <!-- the loop -->
        <circle class="hci__orbit" cx="${LOOP.x}" cy="${LOOP.y}" r="${LOOP.r}"/>
        ${raw(chevrons())}
        ${raw(STEPS.map(node).join(''))}
        <g class="hci__runner"><circle cx="${LOOP.x}" cy="${LOOP.y - LOOP.r}" r="3.2"/></g>

        <!-- the person: an eye at the loop's centre, and where it looks -->
        <path class="hci__sight hci__sight--intent" d="M${LOOP.x} ${LOOP.y}L${f(CLICK.x)} ${f(CLICK.y + 22)}"/>
        <path class="hci__sight hci__sight--eval" d="M${LOOP.x} ${LOOP.y}L${TOAST.x + TOAST.w / 2} ${TOAST.y + TOAST.h}"/>
        <g class="hci__eye">
          <path class="hci__line hci__paper" d="M${LOOP.x - 36} ${LOOP.y}Q${LOOP.x} ${LOOP.y - 30} ${LOOP.x + 36} ${LOOP.y}Q${LOOP.x} ${LOOP.y + 30} ${LOOP.x - 36} ${LOOP.y}Z"/>
          <g class="hci__pupil">
            <circle class="hci__line hci__paper" cx="${LOOP.x}" cy="${LOOP.y}" r="11"/>
            <circle class="hci__ink" cx="${LOOP.x}" cy="${LOOP.y}" r="4.5"/>
          </g>
          <path class="hci__centre" d="M${LOOP.x - 48} ${LOOP.y}H${LOOP.x + 48}M${LOOP.x} ${LOOP.y - 26}V${LOOP.y + 26}"/>
        </g>

        <!-- the cursor, which travels from Action to the button -->
        <g class="hci__cursor" style="${raw(cursorVars())}">
          <path class="hci__line hci__paper" d="M0 0L0 18L4.6 13.6L7.8 20.6L10.6 19.4L7.4 12.6L13.4 12.6Z"/>
        </g>

        <text class="hci__title" x="20" y="${H - 14}">FIG. H — THE INTERACTION LOOP · HUMAN ↔ INTERFACE</text>
      </svg>
    </figure>
  `;
}
