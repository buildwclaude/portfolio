// vite.config.ts
import { defineConfig } from "vite";

// src/lib/html.ts
var RAW = Symbol.for("html.raw");
function raw(value) {
  return { __html: value, [RAW]: true };
}
function isHtml(value) {
  return typeof value === "object" && value !== null && "__html" in value;
}
function escape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function render(value) {
  if (value === null || value === void 0 || value === false) return "";
  if (isHtml(value)) return value.__html;
  if (Array.isArray(value)) return value.map(render).join("");
  return escape(String(value));
}
function html(strings, ...values) {
  let out = strings[0] ?? "";
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + (strings[i + 1] ?? "");
  }
  return raw(out);
}

// src/content/site.ts
var site = {
  /* ---------------------------------------------------------------- meta */
  meta: {
    name: "Sony Thakuri",
    /** Used in <title>, the header mark and the footer. */
    shortName: "Sony Thakuri",
    role: "Product researcher & designer",
    description: "Portfolio of Sony Thakuri \u2014 a product researcher and designer working at the intersection of technology and human experience."
  },
  /* ------------------------------------------------------------ navigation */
  nav: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Experiments", href: "#experiments" },
    { label: "Contact", href: "#contact" }
  ],
  /* ------------------------------------------------------------------ hero */
  hero: {
    /** Small line above the display type. */
    eyebrow: "Portfolio \u2014 2026",
    /**
     * The display statement. Each array entry is one rendered line, so you
     * control the line breaks. Keep it to three or four lines.
     */
    lines: ["Hello, this is Sony \u2014", "a product researcher", "and designer."],
    /** One short paragraph. Two sentences is usually enough. */
    intro: "Passionate about creating impactful, user-centered solutions at the intersection of technology and human experience. Over three years driving consumer-facing products from concept to launch.",
    /** Margin notes. Leave any value empty to hide the row. */
    notes: [
      {
        label: "Focus",
        value: "Human\u2013computer interaction, AI-mediated communication, product design"
      },
      {
        label: "Currently",
        value: "Research Assistant, UX Research \u2014 Open XR Lab, Wichita State University"
      },
      // The source site does not state a location, so this row stays hidden.
      { label: "Located", value: "" }
    ]
  },
  /* ------------------------------------------------------------------ work */
  work: {
    title: "Featured projects",
    /**
     * The first two entries are rendered as large editorial pieces, the
     * remainder as a compact archive index. Reorder freely.
     */
    projects: [
      {
        index: "01",
        title: "Yatri Hub",
        year: "2025",
        type: "Yatri Motorcycles",
        description: "A smart companion app for Yatri electric bike riders \u2014 real-time bike monitoring, ride history, nearby charging stations and navigation. The redesign cut trip-planning uncertainty by 67% and raised first-time task success by 60%.",
        tech: ["UI/UX", "UX research", "Product design", "Design lead"],
        href: "https://sony-thakuri.xyz/8/",
        image: "/work/yatri-hub.webp",
        imageAlt: "Yatri Hub app screens: a bike status view with battery and range, a map with nearby charging stations, and riding statistics."
      },
      {
        index: "02",
        title: "AR Head-Up Display",
        year: "2026",
        type: "Open XR Lab",
        description: "A research project building augmented reality interfaces for astronaut spacesuits, helping them perform spacewalks more effectively \u2014 with future Moon-to-Mars missions in mind. Currently underway.",
        tech: ["Product design", "AI", "HITL testing", "User experience"],
        href: "https://sony-thakuri.xyz/13/",
        image: "/work/ar-hud.webp",
        imageAlt: "An augmented reality head-up display over a lunar surface, showing vehicle telemetry, a terrain map with a planned route, and suit vitals."
      },
      {
        index: "03",
        title: "Yatri Energy",
        year: "2023",
        type: "Yatri Motorcycles",
        description: "A mobile experience that reduces friction by simplifying discovery, payment and access to charging for EV users in Nepal.",
        tech: ["UI/UX", "Product design", "Collaboration"],
        href: "https://sony-thakuri.xyz/9/",
        image: "",
        imageAlt: ""
      },
      {
        index: "04",
        title: "EduQuest",
        year: "2024",
        type: "Leapfrog Technology",
        description: "A dedicated platform for structured mentorship, replacing the scattered social-media threads mentors and mentees were relying on.",
        tech: ["UI/UX", "UX research", "Product design", "Capstone"],
        href: "https://sony-thakuri.xyz/5/",
        image: "",
        imageAlt: ""
      },
      {
        index: "05",
        title: "Dynamic Dashboard",
        year: "2024",
        type: "Yatri Motorcycles",
        description: "User research and design for an interactive bike dashboard riders can actually engage with.",
        tech: ["UI/UX", "UX research", "Product design", "Collaboration"],
        href: "https://sony-thakuri.xyz/4/",
        image: "",
        imageAlt: ""
      }
    ]
  },
  /* ----------------------------------------------------------------- about */
  about: {
    title: "About",
    /** Each entry is one paragraph. */
    paragraphs: [
      "I am a product researcher and designer passionate about creating impactful, user-centered solutions at the intersection of technology and human experience. With a background in Electronics and Communication Engineering and over three years of experience driving consumer-facing products from concept to launch, I bridge technical understanding with design thinking.",
      "I am interested in how humans and computers shape each other. My work explores how technology can support human judgment, emotion and creativity \u2014 not replace it. I am especially curious about how our generation is learning to live with AI, and how design can help that relationship feel more intentional, humane and empowering.",
      "When I am not designing, you\u2019ll find me exploring new places, capturing moments through my lens, diving into a good book, or experimenting with new recipes in the kitchen. I also love the outdoors, learning new languages and cultures, and expressing my creativity through pottery."
    ],
    columns: [
      {
        label: "Practice",
        items: ["UX research", "UX design", "Interaction design", "Research facilitation"]
      },
      {
        label: "Tools",
        items: ["Figma", "FigJam", "Adobe Creative Suite", "Google AI Studio", "TouchDesigner"]
      },
      {
        label: "Beyond design",
        items: ["Photography", "Pottery", "Languages", "Cooking"]
      }
    ]
  },
  /* --------------------------------------------------------------- records
     Three lists in the About section, all rendered by the same component.
     Rows with an empty `year` simply leave the column blank. */
  records: {
    groups: [
      {
        label: "Experience",
        items: [
          {
            title: "Research Assistant, UX Research",
            meta: "Open XR Lab, Wichita State University",
            year: "2025 \u2014 Present",
            href: ""
          },
          {
            title: "Lead UX Designer",
            meta: "Yatri Motorcycles",
            year: "2021 \u2014 2025",
            href: ""
          },
          {
            title: "UX Design Intern",
            meta: "Leapfrog Technology",
            year: "Jun \u2014 Aug 2021",
            href: ""
          },
          {
            title: "Graphic Designer",
            meta: "Code Rush",
            year: "2021",
            href: ""
          }
        ]
      },
      {
        label: "Recognition",
        items: [
          {
            title: "Auto Robotic Car Competition",
            meta: "Winner \u2014 led the team that built a Bluetooth-controlled car, earning a sponsored program in Singapore",
            year: "",
            href: ""
          },
          {
            title: "EntrepreneurHer",
            meta: "Winner \u2014 $2,000 equity investment for Learn Loksewa, widening access to public sector exam preparation in Nepal",
            year: "",
            href: ""
          },
          {
            title: "Figma Warrior Award",
            meta: "Yatri Motorcycles \u2014 for advancing design standards within the team",
            year: "",
            href: ""
          },
          {
            title: "Girls to Code Bootcamp",
            meta: "Assignment winner, top five \u2014 awarded a Springboard Scholarship",
            year: "",
            href: ""
          }
        ]
      },
      {
        label: "Beyond the work",
        items: [
          {
            title: "Girls in Tech Nepal",
            meta: "Advisory board member",
            year: "",
            href: ""
          },
          {
            title: "Smart Cheli",
            meta: "Mentor \u2014 guiding a student toward a career in UX",
            year: "",
            href: "https://smartcheli.org.np/"
          },
          {
            title: "Youngpreneurs",
            meta: "Co-founder \u2014 interviews, articles and podcasts on young entrepreneurs",
            year: "",
            href: "https://www.instagram.com/youngpreneur.s/"
          },
          {
            title: "Zeno Project",
            meta: "Co-founder \u2014 a clothing store donating 10% of profits to the underserved",
            year: "",
            href: "https://www.instagram.com/zeno.project/"
          },
          {
            title: "Hult Prize Itahari",
            meta: "Speaker \u2014 Simple Design Thinking",
            year: "",
            href: ""
          },
          {
            title: "Design thinking workshops",
            meta: "Facilitator \u2014 hands-on methodology sessions for students",
            year: "",
            href: ""
          }
        ]
      }
    ]
  },
  /* ----------------------------------------------------------- experiments */
  experiments: {
    title: "Experiments",
    intro: "These projects reflect my experiments across interaction design, intelligent systems, and craft. Most of these are personal projects.",
    items: [
      {
        index: "01",
        title: "Bridging Motion & Digital Art",
        tag: "TouchDesigner",
        note: "A gesture-based system that turns hand motion into real-time visual and audio control \u2014 pinch to scale, swipe to switch media.",
        href: "https://sony-thakuri.xyz/12/"
      },
      {
        index: "02",
        title: "Socialux",
        tag: "Research probe",
        note: "A social battery that visualises the balance between AI conversations and human ones, to make invisible AI habits visible.",
        href: "https://sony-thakuri.xyz/15/"
      },
      {
        index: "03",
        title: "Treedex",
        tag: "Computer vision",
        note: "A tree intelligence companion that identifies a tree from one photo and tells you its species, ecological role and age.",
        href: "https://github.com/thakurisony111-blip/Treedex"
      },
      {
        index: "04",
        title: "Immersia",
        tag: "VR",
        note: "Immersive VR environments \u2014 Parisian caf\xE9s, Tokyo markets \u2014 for practising real conversations in a language you are learning.",
        href: "https://sony-thakuri.xyz/6/"
      }
    ]
  },
  /* ----------------------------------------------------------------- helix
     The spiral of cards that closes the Experiments section. Swap these for
     photography, drawings, anything — the component takes whatever it is
     given and the helix repeats them to fill itself. */
  helix: {
    caption: "Project imagery \u2014 CSS 3D, no library",
    images: [
      { src: "/work/cards/yatri-hub.webp", alt: "Yatri Hub app screens" },
      { src: "/work/cards/ar-hud.webp", alt: "The AR head-up display over a lunar surface" },
      { src: "/work/cards/yatri-energy.webp", alt: "Yatri Energy charging app screens" },
      { src: "/work/cards/eduquest.webp", alt: "The EduQuest mentorship platform" },
      { src: "/work/cards/dashboard.webp", alt: "The Dynamic Dashboard on a bike" }
    ]
  },
  /* --------------------------------------------------------------- contact */
  contact: {
    title: "Contact",
    line: "Thanks for stopping by!",
    email: "thakurisony111@gmail.com",
    links: [
      { label: "R\xE9sum\xE9", href: "https://sonythakuri.cv" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/sony-thakuri/" },
      { label: "GitHub", href: "https://github.com/thakurisony111-blip" },
      { label: "Behance", href: "https://www.behance.net/Sonythakuri" },
      { label: "Instagram", href: "https://www.instagram.com/treesntech/" }
    ]
  },
  /* ---------------------------------------------------------------- kodama */
  kodama: {
    /**
     * The companion clip. webm first, mp4 as the fallback; the element
     * removes itself silently if neither file is present.
     *
     * The files in /public/kodama/ were cut from the source clip in
     * /assets-source/ — see that folder's note for how.
     */
    webm: "/kodama/kodama.webm",
    mp4: "/kodama/kodama.mp4",
    poster: "/kodama/kodama.webp",
    /** Decorative by default; describe it here only if you want it announced. */
    label: ""
  }
};

// src/site/header.ts
function header() {
  return html`
    <header class="header" data-header>
      <div class="shell header__inner">
        <a class="header__mark" href="#top" aria-label="${site.meta.name} — back to top">
          <span class="header__seal" aria-hidden="true"></span>
          <span class="header__name">${site.meta.shortName}</span>
        </a>

        <nav class="nav" aria-label="Primary">
          <ul class="nav__list" id="primary-menu" data-menu>
            ${site.nav.map(
    (item2) => html`
                <li class="nav__item">
                  <a class="nav__link" href="${item2.href}" data-nav-link>${item2.label}</a>
                </li>
              `
  )}
            <li class="nav__item">
              <button class="nav__theme-btn" id="theme-toggle" aria-label="Toggle dark mode">
                <svg id="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </button>
            </li>
          </ul>
        </nav>

        <button
          class="nav__toggle"
          type="button"
          aria-expanded="false"
          aria-controls="primary-menu"
          data-menu-toggle
        >
          <span data-menu-label>Menu</span>
        </button>
      </div>
    </header>
  `;
}

// src/site/kodama.ts
function kodama() {
  const { webm, mp4, poster, label } = site.kodama;
  const describedAttrs = label ? raw(`aria-label="${label}" role="img"`) : raw('aria-hidden="true"');
  return html`
    <div class="kodama" data-kodama>
      <video
        class="kodama__video"
        ${poster ? raw(`poster="${poster}"`) : ""}
        ${describedAttrs}
        width="174"
        height="256"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        disablepictureinpicture
        tabindex="-1"
      >
        <source src="${webm}" type="video/webm" />
        <source src="${mp4}" type="video/mp4" />
      </video>
    </div>
  `;
}

// src/site/hero.ts
function hero() {
  const { eyebrow, lines, intro, notes } = site.hero;
  const shown = notes.filter((note) => note.value);
  return html`
    <section class="hero shell grid" aria-labelledby="hero-title">
      <p class="hero__eyebrow meta" data-reveal>${eyebrow}</p>

      <h1 class="hero__display display" id="hero-title">
        ${lines.map(
    (line, i) => html`
            <span class="hero__line" data-reveal-line style="--line-index:${i}">
              <span class="hero__line-inner">${line}</span>
            </span>
          `
  )}
      </h1>

      <p class="hero__intro lead" data-reveal>${intro}</p>

      ${shown.length > 0 && html`
        <dl class="hero__notes" data-reveal>
          ${shown.map(
    (note) => html`
              <div class="hero__note">
                <dt class="meta">${note.label}</dt>
                <dd>${note.value}</dd>
              </div>
            `
  )}
        </dl>
      `}

      <a class="hero__scroll meta" href="#work">
        <span>${site.work.title}</span>
        <span class="hero__scroll-rule" aria-hidden="true"></span>
      </a>
    </section>
  `;
}

// src/site/plate.ts
var W = 600;
var H = 420;
function prng(seed) {
  let t = seed * 1831565813;
  return () => {
    t = Math.imul(t ^ t >>> 15, 1 | t);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function plate(seed) {
  const rand = prng(seed + 1);
  const cx = W * (0.32 + rand() * 0.34);
  const cy = H * (0.4 + rand() * 0.08);
  const r = H * (0.19 + rand() * 0.05);
  const horizon = H * (0.58 + rand() * 0.12);
  const bias = 1.2 + rand() * 1.2;
  const flip = rand() > 0.5;
  const count = 22;
  const contours = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const eased = flip ? Math.pow(t, bias) : 1 - Math.pow(1 - t, bias);
    const y = cy - r + eased * r * 2;
    contours.push(`M${cx - r} ${y.toFixed(1)}H${cx + r}`);
  }
  const ticks = [];
  const tickCount = 12;
  for (let i = 1; i < tickCount; i++) {
    const x = W / tickCount * i;
    ticks.push(`M${x.toFixed(1)} ${horizon.toFixed(1)}v7`);
  }
  const id = `plate-${seed}`;
  return html`
    <svg
      class="plate"
      viewBox="0 0 ${W} ${H}"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      focusable="false"
    >
      <defs>
        <clipPath id="${id}">
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" />
        </clipPath>
      </defs>
      <rect width="${W}" height="${H}" class="plate__ground" />
      <g clip-path="url(#${id})" class="plate__contours">
        <path d="${raw(contours.join(""))}" />
      </g>
      <circle
        class="plate__circle"
        cx="${cx.toFixed(1)}"
        cy="${cy.toFixed(1)}"
        r="${r.toFixed(1)}"
      />
      <path class="plate__horizon" d="M0 ${horizon.toFixed(1)}H${W}" />
      <path class="plate__ticks" d="${raw(ticks.join(""))}" />
    </svg>
  `;
}

// src/site/work.ts
var FEATURED = 2;
function media(project, seed) {
  return project.image ? html`<img
        class="piece__image"
        src="${project.image}"
        alt="${project.imageAlt}"
        loading="lazy"
        decoding="async"
      />` : plate(seed);
}
function wrap(href, inner, className) {
  if (!href) return html`<div class="${className}">${inner}</div>`;
  const external = href.startsWith("http");
  return external ? html`<a class="${className}" href="${href}" target="_blank" rel="noreferrer">${inner}</a>` : html`<a class="${className}" href="${href}">${inner}</a>`;
}
function piece(project, i) {
  const body = html`
    <div class="piece__media">
      <div class="piece__media-inner">${media(project, i)}</div>
    </div>
    <div class="piece__body">
      <p class="piece__meta meta">
        <span>${project.index}</span>
        <span aria-hidden="true">·</span>
        <span>${project.type}</span>
        <span aria-hidden="true">·</span>
        <span>${project.year}</span>
      </p>
      <h3 class="piece__title title">
        <span class="piece__title-text">${project.title}</span>
      </h3>
      <p class="piece__description">${project.description}</p>
      <ul class="piece__tech meta">
        ${project.tech.map((t) => html`<li>${t}</li>`)}
      </ul>
      ${project.href && html`<span class="piece__action meta" aria-hidden="true">View <span>↗</span></span>`}
    </div>
  `;
  return html`
    <article class="piece ${i % 2 === 1 ? "piece--flip" : ""}" data-reveal>
      ${wrap(project.href, body, "piece__inner grid")}
    </article>
  `;
}
function archiveRow(project) {
  const body = html`
    <span class="archive__index meta">${project.index}</span>
    <h3 class="archive__title"><span class="archive__title-text">${project.title}</span></h3>
    <p class="archive__description">${project.description}</p>
    <span class="archive__type meta">${project.type}</span>
    <span class="archive__year meta">${project.year}</span>
  `;
  return html`
    <li class="archive__row" data-reveal>${wrap(project.href, body, "archive__link grid")}</li>
  `;
}
function work() {
  const projects = site.work.projects;
  const featured = projects.slice(0, FEATURED);
  const archive = projects.slice(FEATURED);
  return html`
    <section class="section work" id="work" aria-labelledby="work-title">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="work-title">${site.work.title}</h2>
          <span class="section__index meta">01 — ${raw(String(projects.length).padStart(2, "0"))}</span>
        </div>
      </div>

      <div class="work__pieces shell">${featured.map((p, i) => piece(p, i))}</div>

      ${archive.length > 0 && html`
        <div class="shell">
          <ol class="archive" data-reveal-stagger>
            ${archive.map((p) => archiveRow(p))}
          </ol>
        </div>
      `}
    </section>
  `;
}

// src/site/records.ts
function row(item2) {
  const body = html`
    <span class="records__title"><span class="records__title-text">${item2.title}</span></span>
    <span class="records__meta">${item2.meta}</span>
    ${item2.year && html`<span class="records__year meta">${item2.year}</span>`}
  `;
  return html`
    <li class="records__row" data-reveal>
      ${item2.href ? html`<a class="records__inner grid" href="${item2.href}" target="_blank" rel="noreferrer"
            >${body}</a
          >` : html`<div class="records__inner grid">${body}</div>`}
    </li>
  `;
}
function group(label, items, index) {
  return html`
    <div class="records__group">
      <h3 class="records__label meta" id="records-${index}">${label}</h3>
      <ol class="records__list" aria-labelledby="records-${index}" data-reveal-stagger>
        ${items.map((item2) => row(item2))}
      </ol>
    </div>
  `;
}
function records() {
  return html`
    <div class="records">
      ${site.records.groups.map((entry, i) => group(entry.label, entry.items, i + 1))}
    </div>
  `;
}

// src/site/about.ts
function about() {
  const { title, paragraphs, columns } = site.about;
  return html`
    <section class="section about" id="about" aria-labelledby="about-title">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="about-title">${title}</h2>
          <span class="section__index meta">02</span>
        </div>

        <div class="about__text" data-reveal>
          ${paragraphs.map((p) => html`<p class="lead prose">${p}</p>`)}
        </div>

        <dl class="about__columns" data-reveal>
          ${columns.map(
    (column) => html`
              <div class="about__column">
                <dt class="meta">${column.label}</dt>
                <dd>
                  <ul class="about__list">
                    ${column.items.map((item2) => html`<li>${item2}</li>`)}
                  </ul>
                </dd>
              </div>
            `
  )}
        </dl>

        ${records()}
      </div>
    </section>
  `;
}

// src/site/experiments.ts
var glyphs = [
  // Contour field
  "M2 22C10 22 10 10 18 10S26 22 34 22M2 30C10 30 10 18 18 18S26 30 34 30M2 14C10 14 10 2 18 2S26 14 34 14",
  // Dither grid
  "M4 6h2M12 6h2M20 6h2M28 6h2M8 14h2M16 14h2M24 14h2M32 14h2M4 22h2M12 22h2M20 22h2M28 22h2M8 30h2M16 30h2M24 30h2M32 30h2",
  // Port marks
  "M2 16h32M6 16v-6M14 16v-10M22 16v-4M30 16v-8M6 16v8M18 16v6M26 16v10",
  // Vertical setting
  "M8 2v30M18 2v18M28 2v24M4 2h8M14 2h8M24 2h8"
];
function item(experiment, index) {
  const glyph = glyphs[index % glyphs.length] ?? glyphs[0];
  const inner = html`
    <span class="xp__index meta">${experiment.index}</span>
    <svg class="xp__glyph" viewBox="0 0 36 34" aria-hidden="true" focusable="false">
      <path d="${raw(glyph)}" pathLength="1" />
    </svg>
    <h3 class="xp__title">${experiment.title}</h3>
    <p class="xp__note">${experiment.note}</p>
    <span class="xp__tag meta">${experiment.tag}</span>
  `;
  return html`
    <li class="xp" data-reveal>
      ${experiment.href ? html`<a class="xp__inner" href="${experiment.href}" target="_blank" rel="noreferrer"
            >${inner}</a
          >` : html`<div class="xp__inner">${inner}</div>`}
    </li>
  `;
}
function experiments() {
  const { title, intro, items } = site.experiments;
  return html`
    <section
      class="section experiments"
      id="experiments"
      aria-labelledby="experiments-title"
    >
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>
        <div class="section__head">
          <h2 class="section__title" id="experiments-title">${title}</h2>
          <span class="section__index meta">03</span>
        </div>
        <p class="experiments__intro lead" data-reveal>${intro}</p>
        <ul class="experiments__list" data-reveal-stagger>${items.map((x, i) => item(x, i))}</ul>

        <figure class="experiments__helix" data-reveal>
          <div class="experiments__helix-mount" data-helix></div>
          <figcaption class="meta">${site.helix.caption}</figcaption>
        </figure>
      </div>
    </section>
  `;
}

// src/site/footer.ts
function footer() {
  const { title, line, email, links } = site.contact;
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return html`
    <footer class="footer" id="contact">
      <div class="shell grid">
        <div class="section__rule" aria-hidden="true"></div>

        <h2 class="footer__title title" data-reveal>${title}</h2>
        <p class="footer__line" data-reveal>${line}</p>

        <p class="footer__email" data-reveal>
          <a class="link link--underlined" href="mailto:${email}">${email}</a>
        </p>

        <ul class="footer__links" data-reveal>
          ${links.map(
    (link) => html`
              <li>
                <a class="link" href="${link.href}" rel="me noreferrer" target="_blank">
                  ${link.label}
                </a>
              </li>
            `
  )}
        </ul>

        <p class="footer__legal meta">
          <span>© ${year} ${site.meta.name}</span>
          <span>${site.meta.role}</span>
        </p>
      </div>
    </footer>
  `;
}

// src/site/index.ts
function renderPage() {
  return html`
    <a class="skip-link" href="#main">Skip to content</a>

    <span id="top" class="visually-hidden"></span>
    ${header()} ${kodama()}

    <main class="page" id="main" tabindex="-1">${hero()} ${work()} ${about()} ${experiments()}</main>

    ${footer()}
  `.__html;
}

// vite.config.ts
function staticRender() {
  return {
    name: "portfolio:static-render",
    transformIndexHtml: {
      order: "pre",
      handler(html2) {
        return html2.replace("<!--page-->", renderPage()).replaceAll("%TITLE%", `${site.meta.name} \u2014 ${site.meta.role}`).replaceAll("%DESCRIPTION%", site.meta.description);
      }
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [staticRender()],
  build: {
    rollupOptions: {
      input: {
        // The portfolio itself.
        main: "index.html",
        // The Helix Carousel demo. Drop this line to stop shipping it — it
        // is a separate entry and costs the main page nothing either way.
        helix: "examples/helix.html"
      }
    },
    target: "es2020",
    cssTarget: "chrome87",
    reportCompressedSize: true
  }
});
export {
  vite_config_default as default
};
