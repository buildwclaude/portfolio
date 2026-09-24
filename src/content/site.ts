/**
 * All site copy lives here.
 *
 * This is the only file you need to touch to change what the site says.
 * Every field is plain data — editing it never requires touching a component.
 *
 * Fields left as an empty string are simply not rendered.
 *
 * The content is transcribed from sony-thakuri.xyz; see CONTENT.md for the
 * full extraction, the source of every line, and what the source site does
 * not state.
 */

export type Project = {
  /** Two-digit index shown in the margin. */
  index: string;
  title: string;
  year: string;
  /** Where the work was done, or the discipline. */
  type: string;
  description: string;
  /** Disciplines or tools, rendered as a small metadata list. */
  tech: string[];
  /** Optional link. Leave empty to render the row as plain text. */
  href: string;
  /**
   * Optional image path (put files in /public/work/ and reference them
   * as "/work/name.webp"). When empty, a drawn plate is used instead.
   */
  image: string;
  /** Alt text — required whenever `image` is set. */
  imageAlt: string;
};

export type Experiment = {
  index: string;
  title: string;
  tag: string;
  note: string;
  href: string;
};

/** A row in one of the About lists: a role, an award, an initiative. */
export type Entry = {
  title: string;
  /** The organisation, or a one-line description. */
  meta: string;
  /** Leave empty when the source does not state dates. */
  year: string;
  href: string;
  /** Optional longer description, shown on the About page only. */
  desc?: string;
};

/**
 * A volume on the "More about me" shelf. Its contents are the `records`
 * group with the same label, so the shelf and the About page always agree.
 */
export type Book = {
  /** A `records.groups` label. */
  group: string;
  /** Printed under the title on the cover. */
  tagline: string;
  /** The line drawing stamped on the cover. */
  motif: 'steps' | 'rosette' | 'circles' | 'waves' | 'sprout';
};

/** A photo on the About page. Files live in /public/me/. */
export type Photo = { src: string; width: number; height: number; alt: string };

export const site = {
  /* ---------------------------------------------------------------- meta */
  meta: {
    name: 'Sony Thakuri',
    /** Used in <title>, the header mark and the footer. */
    shortName: 'Sony Thakuri',
    role: 'Product researcher & designer',
    description:
      'Portfolio of Sony Thakuri — a product researcher and designer working at the intersection of technology and human experience.',
  },

  /* ------------------------------------------------------------ navigation */
  nav: [
    { label: 'Playground', href: '#playground' },
    { label: 'Work', href: '#warp-work' },
    { label: 'About', href: '#about' },
    { label: 'Experiments', href: '#experiments' },
    { label: 'Contact', href: '#contact' },
  ],

  /* ------------------------------------------------------------------ hero */
  hero: {
    eyebrow: 'Portfolio — 2026',
    /**
     * The display statement. Each array entry is one rendered line, so you
     * control the line breaks. Keep it to three or four lines.
     */
    lines: ['Hello,', 'This is Sony'],
    /** The handwritten aside that points at the avatar doodle. */
    scribble: 'that’s me!',
    /** One short paragraph. Two sentences is usually enough. */
    intro:
      'Passionate about creating impactful, user-centered solutions at the intersection of technology and human experience.<br><br>Over three years driving consumer-facing products from concept to launch.',
    /** Margin notes. Leave any value empty to hide the row. */
    notes: [
      {
        label: 'Focus\u00A0\u00A0\u00A0',
        value: 'Human–computer interaction, AI-mediated communication, product design',
      },
      {
        label: 'Currently\u00A0\u00A0\u00A0',
        value: 'Research Assistant, UX Research — Open XR Lab, Wichita State University',
      },
      // The source site does not state a location, so this row stays hidden.
      { label: 'Located', value: '' },
    ],
    /** The numbered index along the bottom of the hero. */
    index: [
      { label: 'Selected work', href: '#warp-work' },
      { label: 'About', href: '#about' },
      { label: 'Experiments', href: '#experiments' },
      { label: 'Playground', href: '#playground' },
    ],
    cards: [
      { src: '/cards/1.jpeg', width: 440, height: 440 },
      { src: '/cards/2.jpeg', width: 440, height: 440 },
      { src: '/cards/3.jpeg', width: 440, height: 440 },
      { src: '/cards/4.jpeg', width: 440, height: 440 },
    ] as Array<{ src: string; width: number; height: number }>,
  },

  /* ------------------------------------------------------------------ work */
  work: {
    title: 'Featured projects',
    /**
     * The first two entries are rendered as large editorial pieces, the
     * remainder as a compact archive index. Reorder freely.
     */
    projects: [
      {
        index: '01',
        title: 'Yatri Hub',
        year: '2025',
        type: 'Yatri Motorcycles',
        description:
          'A smart companion app for Yatri electric bike riders — real-time bike monitoring, ride history, nearby charging stations and navigation. The redesign cut trip-planning uncertainty by 67% and raised first-time task success by 60%.',
        tech: ['UI/UX', 'UX research', 'Product design', 'Design lead'],
        href: 'https://sony-thakuri.xyz/8/',
        image: '/work/yatrihub1.png',
        imageAlt:
          'Yatri Hub app screens: a bike status view with battery and range, a map with nearby charging stations, and riding statistics.',
      },
      {
        index: '02',
        title: 'AR Head-Up Display',
        year: '2026',
        type: 'Open XR Lab',
        description:
          'A research project building augmented reality interfaces for astronaut spacesuits, helping them perform spacewalks more effectively — with future Moon-to-Mars missions in mind. Currently underway.',
        tech: ['Product design', 'AI', 'HITL testing', 'User experience'],
        href: 'https://sony-thakuri.xyz/13/',
        image: '/work/ar-hud.webp',
        imageAlt:
          'An augmented reality head-up display over a lunar surface, showing vehicle telemetry, a terrain map with a planned route, and suit vitals.',
      },
      {
        index: '03',
        title: 'Yatri Energy',
        year: '2023',
        type: 'Yatri Motorcycles',
        description:
          'A mobile experience that reduces friction by simplifying discovery, payment and access to charging for EV users in Nepal.',
        tech: ['UI/UX', 'Product design', 'Collaboration'],
        href: 'https://sony-thakuri.xyz/9/',
        image: '',
        imageAlt: '',
      },
      {
        index: '04',
        title: 'EduQuest',
        year: '2024',
        type: 'Leapfrog Technology',
        description:
          'A dedicated platform for structured mentorship, replacing the scattered social-media threads mentors and mentees were relying on.',
        tech: ['UI/UX', 'UX research', 'Product design', 'Capstone'],
        href: 'https://sony-thakuri.xyz/5/',
        image: '',
        imageAlt: '',
      },
      {
        index: '05',
        title: 'Dynamic Dashboard',
        year: '2024',
        type: 'Yatri Motorcycles',
        description:
          'User research and design for an interactive bike dashboard riders can actually engage with.',
        tech: ['UI/UX', 'UX research', 'Product design', 'Collaboration'],
        href: 'https://sony-thakuri.xyz/4/',
        image: '',
        imageAlt: '',
      },
    ] satisfies Project[],
  },

  /* ----------------------------------------------------------------- about */
  about: {
    title: 'About',
    /** Each entry is one paragraph. */
    paragraphs: [
      'I am a product researcher and designer passionate about creating impactful, user-centered solutions at the intersection of technology and human experience. With a background in Electronics and Communication Engineering and over three years of experience driving consumer-facing products from concept to launch, I bridge technical understanding with design thinking to deliver solutions that are both functional and visionary.',
      'I am interested in how humans and computers shape each other. My work explores how technology can support human judgment, emotion and creativity — not replace it. I am especially curious about how our generation is learning to live with AI, and how design can help that relationship feel more intentional, humane and empowering.',
      'When I am not designing, you’ll find me exploring new places, capturing moments through my lens, diving into a good book, or experimenting with new recipes in the kitchen. I also love the outdoors, learning new languages and cultures, and expressing my creativity through pottery.',
    ],
    columns: [
      {
        label: 'Practice',
        items: ['UX research', 'UX design', 'Interaction design', 'Research facilitation'],
      },
      {
        label: 'Tools',
        items: ['Figma', 'FigJam', 'Adobe Creative Suite', 'Google AI Studio', 'TouchDesigner'],
      },
      {
        label: 'Beyond design',
        items: ['Photography', 'Pottery', 'Languages', 'Cooking'],
      },
    ],
  },

  /* --------------------------------------------------------------- records
     The lists on the About page (#me). The homepage shows only Experience;
     the page shows every group, with its photos. Rows with an empty `year`
     leave the column blank. Transcribed from sony-thakuri.xyz/3/. */
  records: {
    groups: [
      {
        label: 'Experience',
        items: [
          {
            title: 'Research Assistant, UX Research',
            meta: 'Open XR Lab, Wichita State University',
            year: '2025 — Present',
            href: '',
          },
          {
            title: 'Lead UX Designer',
            meta: 'Yatri Motorcycles',
            year: '2021 — 2025',
            href: '',
          },
          {
            title: 'UX Design Intern',
            meta: 'Leapfrog Technology',
            year: 'Jun — Aug 2021',
            href: '',
          },
          {
            title: 'Graphic Designer',
            meta: 'Code Rush',
            year: '2021',
            href: '',
          },
        ],
        photos: [],
      },
      {
        label: 'Recognition',
        items: [
          {
            title: 'Winner, Auto Robotic Car Competition',
            meta: 'Team lead',
            year: '',
            href: '',
            desc: 'Led my team to victory by designing and developing a Bluetooth-controlled car. The win earned us a sponsored program in Singapore, where I expanded my knowledge in robotics, human–computer interaction and motorsport safety.',
          },
          {
            title: 'Winner, EntrepreneurHer',
            meta: 'Learn Loksewa',
            year: '',
            href: '',
            desc: 'Part of the winning team, awarded $2,000 in equity investment for our passion project, Learn Loksewa. The funding has supported our mission to make public sector exam preparation more accessible across Nepal.',
          },
          {
            title: 'Figma Warrior Award',
            meta: 'Yatri Motorcycles',
            year: '',
            href: '',
            desc: 'Recognised as a “Figma Warrior” for my dedication to advancing design standards and pushing creative boundaries within the team.',
          },
          {
            title: 'Girls to Code Bootcamp',
            meta: 'Assignment winner, top five',
            year: '',
            href: '',
            desc: 'Awarded a Springboard Scholarship.',
          },
        ],
        photos: [
          { src: '/me/recognition-5.webp', width: 1000, height: 1097, alt: 'The Bluetooth-controlled robotic car, wired up on a table.' },
          { src: '/me/recognition-2.webp', width: 1000, height: 914, alt: 'Receiving the award certificate with the team.' },
          { src: '/me/recognition-3.webp', width: 1000, height: 522, alt: 'The team in matching blue shirts during the program in Singapore.' },
          { src: '/me/recognition-4.webp', width: 1000, height: 1124, alt: 'Driving a kart on a racing circuit.' },
          { src: '/me/recognition-1.webp', width: 1000, height: 1769, alt: 'The Supertree Grove at Gardens by the Bay, Singapore, lit up at night.' },
        ],
      },
      {
        label: 'Community',
        items: [
          {
            title: 'Advisory Board Member',
            meta: 'Girls in Tech Nepal',
            year: '',
            href: '',
            desc: 'Served on the advisory board, advocating for gender equality in tech and supporting programs that empower women through technology and skill-building.',
          },
          {
            title: 'Mentor',
            meta: 'Smart Cheli',
            year: '',
            href: 'https://smartcheli.org.np/',
            desc: 'Volunteered as a mentor through the Smart Cheli mentorship program, guiding a student into a career in UX and helping her build the skills the industry asks for.',
          },
        ],
        photos: [
          { src: '/me/community-1.webp', width: 1000, height: 519, alt: 'A group photo with mentees and mentors.' },
          { src: '/me/community-2.webp', width: 1000, height: 869, alt: 'Students working through an exercise at a table.' },
          { src: '/me/community-3.webp', width: 1000, height: 790, alt: 'A smiling group selfie at a community event.' },
          { src: '/me/community-4.webp', width: 1000, height: 551, alt: 'A large group photo from a Girls in Tech Nepal event.' },
        ],
      },
      {
        label: 'Speaking & workshops',
        items: [
          {
            title: 'Speaker, Hult Prize Itahari',
            meta: 'Simple Design Thinking',
            year: '',
            href: '',
            desc: 'Presented design thinking approaches to aspiring entrepreneurs, inspiring them to leverage design principles for impactful solutions.',
          },
          {
            title: 'Design thinking workshop',
            meta: 'Facilitator',
            year: '',
            href: '',
            desc: 'Led a hands-on workshop on core design thinking methodologies for students, guiding them in applying these techniques to real-world challenges.',
          },
        ],
        photos: [
          { src: '/me/speaking-2.webp', width: 1000, height: 765, alt: 'A screen reading “Design thinking for product design”, from a Girls in Tech Nepal session.' },
          { src: '/me/speaking-1.webp', width: 1000, height: 532, alt: 'Workshop participants on a video call.' },
        ],
      },
      {
        label: 'Initiatives',
        items: [
          {
            title: 'Co-founder, Youngpreneurs',
            meta: 'Media',
            year: '',
            href: 'https://www.instagram.com/youngpreneur.s/',
            desc: 'Highlighting the journeys of young entrepreneurs through interviews, articles and podcasts — celebrating local entrepreneurship and resilience.',
          },
          {
            title: 'Co-founder, Zeno Project',
            meta: 'Social enterprise',
            year: '',
            href: 'https://www.instagram.com/zeno.project/',
            desc: 'A socially responsible clothing store that donates 10% of its profits to the underserved, using fashion as a platform for positive impact.',
          },
        ],
        photos: [],
      },
    ] satisfies { label: string; items: Entry[]; photos: Photo[] }[],
  },

  /* -------------------------------------------------------------------- me
     The About page (#me): everything else it shows comes from `about`,
     `records` and `contact`. */
  me: {
    greeting: 'Hello,',
    portrait: { src: '/me/portrait.webp', alt: 'Portrait of Sony Thakuri, smiling, one hand raised against the sun.' },
    signoff: '/me/tree.webp',
  },

  /* ----------------------------------------------------------- experiments */
  experiments: {
    title: 'Experiments',
    intro:
      'These projects reflect my experiments across interaction design, intelligent systems, and craft. Most of these are personal projects.',
    items: [
      {
        index: '01',
        title: 'Bridging Motion & Digital Art',
        tag: 'TouchDesigner',
        note: 'A gesture-based system that turns hand motion into real-time visual and audio control — pinch to scale, swipe to switch media.',
        href: 'https://sony-thakuri.xyz/12/',
      },
      {
        index: '02',
        title: 'Socialux',
        tag: 'Research probe',
        note: 'A social battery that visualises the balance between AI conversations and human ones, to make invisible AI habits visible.',
        href: 'https://sony-thakuri.xyz/15/',
      },
      {
        index: '03',
        title: 'Treedex',
        tag: 'Computer vision',
        note: 'A tree intelligence companion that identifies a tree from one photo and tells you its species, ecological role and age.',
        href: 'https://github.com/thakurisony111-blip/Treedex',
      },
      {
        index: '04',
        title: 'Immersia',
        tag: 'VR',
        note: 'Immersive VR environments — Parisian cafés, Tokyo markets — for practising real conversations in a language you are learning.',
        href: 'https://sony-thakuri.xyz/6/',
      },
    ] satisfies Experiment[],
  },

  /* ----------------------------------------------------------------- shelf
     "More about me" in the About section: one volume per `records` group.
     Order is shelf order, left to right. */
  shelf: {
    title: 'More about me',
    hint: 'Drag to turn the shelf · click a spine to pull it out',
    books: [
      { group: 'Experience', tagline: 'Four roles, 2021 — present', motif: 'steps' },
      { group: 'Recognition', tagline: 'Awards and wins', motif: 'rosette' },
      { group: 'Community', tagline: 'Advisory and mentorship', motif: 'circles' },
      { group: 'Speaking & workshops', tagline: 'A talk and a workshop', motif: 'waves' },
      { group: 'Initiatives', tagline: 'Two ventures, co-founded', motif: 'sprout' },
    ] satisfies Book[],
  },

  /* ----------------------------------------------------------------- helix
     The spiral of cards that closes the Experiments section. Swap these for
     photography, drawings, anything — the component takes whatever it is
     given and the helix repeats them to fill itself. */
  helix: {
    caption: 'Project imagery — CSS 3D, no library',
    images: [
      { src: '/work/cards/yatri-hub.webp', alt: 'Yatri Hub app screens' },
      { src: '/work/cards/ar-hud.webp', alt: 'The AR head-up display over a lunar surface' },
      { src: '/work/cards/yatri-energy.webp', alt: 'Yatri Energy charging app screens' },
      { src: '/work/cards/eduquest.webp', alt: 'The EduQuest mentorship platform' },
      { src: '/work/cards/dashboard.webp', alt: 'The Dynamic Dashboard on a bike' },
    ],
  },

  /* --------------------------------------------------------------- contact */
  contact: {
    title: 'Contact',
    line: 'Thanks for stopping by!',
    email: 'thakurisony111@gmail.com',
    links: [
      { label: 'Résumé', href: 'https://sonythakuri.cv' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sony-thakuri/' },
      { label: 'GitHub', href: 'https://github.com/thakurisony111-blip' },
      { label: 'Behance', href: 'https://www.behance.net/Sonythakuri' },
      { label: 'Instagram', href: 'https://www.instagram.com/treesntech/' },
    ],
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
    webm: '/kodama/kodama.webm',
    mp4: '/kodama/kodama.mp4',
    poster: '/kodama/kodama.webp',
    /** Decorative by default; describe it here only if you want it announced. */
    label: '',
  },
};
