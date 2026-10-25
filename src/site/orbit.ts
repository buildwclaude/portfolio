import { html } from '../lib/html';

/**
 * The right of the landing screen: a bracelet of glass tiles, each bearing
 * a design tool's logo, turning slowly around a point of light, lit cobalt
 * from within. The scene is built and drawn by `lib/orbit`.
 */
export function orbit() {
  return html`
    <div class="orbit" data-orbit>
      <canvas class="orbit__canvas" data-orbit-canvas role="img" aria-label="A ring of glass tiles bearing design-tool logos — Figma, Illustrator, Slack, FigJam, Creative Cloud, Jira, TouchDesigner and Google AI Studio — turning slowly around a point of blue light"></canvas>
    </div>
  `;
}
