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

          <a class="warp-card" href="#" data-speed="0.06" data-case="ar-hud">
            <figure class="media media--wide" data-gl>
              <img src="/work/ar-hud/3abae169-38f525.webp" alt="AR Head-Up Display" data-fallback="moire" />
            </figure>
            <div class="meta"><span class="title">AR Head-Up Display</span><span class="idx">02</span></div>
            <div class="meta"><span>AR · Research</span><span>2026</span></div>
          </a>

          <a class="warp-card" href="#" data-speed="0.06" data-case="yatri-energy">
            <figure class="media media--tall" data-gl>
              <img src="/work/yatri-energy/5fc7460f-f63330.webp" alt="Yatri Energy" data-fallback="rings" />
            </figure>
            <div class="meta"><span class="title">Yatri Energy</span><span class="idx">03</span></div>
            <div class="meta"><span>Product Design · UX</span><span>2023</span></div>
          </a>
        </div>

        <div class="warp-col warp-col--offset">
          <a class="warp-card" href="#" data-speed="-0.05" data-case="eduquest">
            <figure class="media media--wide" data-gl>
              <img src="/work/eduquest/59d0b409-7a3941.webp" alt="EduQuest" data-fallback="strata" />
            </figure>
            <div class="meta"><span class="title">EduQuest</span><span class="idx">04</span></div>
            <div class="meta"><span>UX Research · Product Design</span><span>2024</span></div>
          </a>

          <a class="warp-card" href="#" data-speed="-0.05" data-case="dashboard">
            <figure class="media media--tall" data-gl>
              <img src="/work/dashboard/f5f971ba-fda800.webp" alt="Dynamic Dashboard" data-fallback="dots" />
            </figure>
            <div class="meta"><span class="title">Dynamic Dashboard</span><span class="idx">05</span></div>
            <div class="meta"><span>UX Research · Product Design</span><span>2024</span></div>
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
