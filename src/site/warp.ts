import { html } from '../lib/html';

export function warp() {
  return html`
    <section class="warp-work" id="warp-work">
      <div class="shell sectionbar"><b>Selected work</b><span>06 pieces</span></div>
      <div class="shell warp-grid">
        <div class="warp-col">
          <a class="warp-card" href="#" data-speed="0.06" data-case="yatri-hub">
            <figure class="media media--tall media--transparent" data-gl style="background: transparent;">
              <img src="/work/yatrihub1.png" alt="Yatri Hub" data-fallback="dots" />
            </figure>
            <div class="meta"><span class="title">Yatri Hub</span><span class="idx">01</span></div>
            <div class="meta"><span>Product Design · UX Research</span><span>2025</span></div>
          </a>

          <a class="warp-card" href="#" data-speed="0.06">
            <figure class="media media--wide" data-gl>
              <img src="/img/02.jpg" alt="Moiré Records" data-fallback="moire" />
            </figure>
            <div class="meta"><span class="title">Moiré Records</span><span class="idx">02</span></div>
            <div class="meta"><span>Identity · Shop</span><span>2025</span></div>
          </a>

          <a class="warp-card" href="#" data-speed="0.06">
            <figure class="media media--tall" data-gl>
              <img src="/img/03.jpg" alt="Longwave Atlas" data-fallback="rings" />
            </figure>
            <div class="meta"><span class="title">Longwave Atlas</span><span class="idx">03</span></div>
            <div class="meta"><span>Data · Interactive</span><span>2025</span></div>
          </a>
        </div>

        <div class="warp-col warp-col--offset">
          <a class="warp-card" href="#" data-speed="-0.05">
            <figure class="media media--wide" data-gl>
              <img src="/img/04.jpg" alt="Strata Studio" data-fallback="strata" />
            </figure>
            <div class="meta"><span class="title">Strata Studio</span><span class="idx">04</span></div>
            <div class="meta"><span>Architecture · Site</span><span>2024</span></div>
          </a>

          <a class="warp-card" href="#" data-speed="-0.05">
            <figure class="media media--tall" data-gl>
              <img src="/img/05.jpg" alt="Nightshift FM" data-fallback="dots" />
            </figure>
            <div class="meta"><span class="title">Nightshift FM</span><span class="idx">05</span></div>
            <div class="meta"><span>Audio · Toy</span><span>2023</span></div>
          </a>

          <a class="warp-card" href="#" data-speed="-0.05">
            <figure class="media media--tall" data-gl>
              <img src="/img/06.jpg" alt="Paper Terminal" data-fallback="grid" />
            </figure>
            <div class="meta"><span class="title">Paper Terminal</span><span class="idx">06</span></div>
            <div class="meta"><span>Type · Experiment</span><span>2022</span></div>
          </a>
        </div>
      </div>
    </section>
  `;
}
