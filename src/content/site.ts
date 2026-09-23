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
};

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
    { label: 'Work', href: '#work' },
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
      'I am a product researcher and designer passionate about creating impactful, user-centered solutions at the intersection of technology and human experience. With a background in Electronics and Communication Engineering and over three years of experience driving consumer-facing products from concept to launch, I bridge technical understanding with design thinking.',
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
     Three lists in the About section, all rendered by the same component.
     Rows with an empty `year` simply leave the column blank. */
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
      },
      {
        label: 'Recognition',
        items: [
          {
            title: 'Auto Robotic Car Competition',
            meta: 'Winner — led the team that built a Bluetooth-controlled car, earning a sponsored program in Singapore',
            year: '',
            href: '',
          },
          {
            title: 'EntrepreneurHer',
            meta: 'Winner — $2,000 equity investment for Learn Loksewa, widening access to public sector exam preparation in Nepal',
            year: '',
            href: '',
          },
          {
            title: 'Figma Warrior Award',
            meta: 'Yatri Motorcycles — for advancing design standards within the team',
            year: '',
            href: '',
          },
          {
            title: 'Girls to Code Bootcamp',
            meta: 'Assignment winner, top five — awarded a Springboard Scholarship',
            year: '',
            href: '',
          },
        ],
      },
      {
        label: 'Beyond the work',
        items: [
          {
            title: 'Girls in Tech Nepal',
            meta: 'Advisory board member',
            year: '',
            href: '',
          },
          {
            title: 'Smart Cheli',
            meta: 'Mentor — guiding a student toward a career in UX',
            year: '',
            href: 'https://smartcheli.org.np/',
          },
          {
            title: 'Youngpreneurs',
            meta: 'Co-founder — interviews, articles and podcasts on young entrepreneurs',
            year: '',
            href: 'https://www.instagram.com/youngpreneur.s/',
          },
          {
            title: 'Zeno Project',
            meta: 'Co-founder — a clothing store donating 10% of profits to the underserved',
            year: '',
            href: 'https://www.instagram.com/zeno.project/',
          },
          {
            title: 'Hult Prize Itahari',
            meta: 'Speaker — Simple Design Thinking',
            year: '',
            href: '',
          },
          {
            title: 'Design thinking workshops',
            meta: 'Facilitator — hands-on methodology sessions for students',
            year: '',
            href: '',
          },
        ],
      },
    ] satisfies { label: string; items: Entry[] }[],
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
