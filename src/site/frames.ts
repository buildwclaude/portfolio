import { html } from '../lib/html';
import { site } from '../content/site';
import { resolveHref } from './paths';

/**
 * Under the landing text: a fan of frames, each a picture in a soft coloured
 * mount with its title and a small label, the middle one in front. They fan
 * out as they come into view, lean a little toward the pointer, and the one
 * under it straightens and lifts (lib/frames). A round sticker, its words
 * turning, sits on the corner of the fan. Content: site.frames.
 */
export function frames() {
  const list = site.frames;
  const mid = (list.length - 1) / 2;

  return html`
    <div class="frames" data-frames>
      <ul class="frames__fan">
        ${list.map((f, i) => {
          const at = i - mid;
          const style = `--c:${f.color}; --at:${at}; --d:${Math.abs(at)}; --z:${10 - Math.abs(Math.round(at))}`;
          const inner = html`
            <span class="frame__pic"><img src="${f.image}" alt="" loading="lazy" decoding="async" /></span>
            <span class="frame__cap"><b>${f.title}</b><small>${f.label}</small></span>
          `;
          return html`
            <li class="frames__slot" style="${style}">
              ${f.case
                ? html`<a class="frame" href="#warp-work" data-case="${f.case}" data-frame>${inner}</a>`
                : html`<a class="frame" href="${resolveHref(f.href ?? '#intro', 'home')}" data-frame>${inner}</a>`}
            </li>
          `;
        })}
      </ul>

      <span class="sticker" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <defs><path id="sticker-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
          <text><textPath href="#sticker-ring" textLength="270" lengthAdjust="spacing">${site.meta.role} ·</textPath></text>
        </svg>
        <img src="${site.me.signoff}" alt="" width="294" height="370" />
      </span>
    </div>
  `;
}
