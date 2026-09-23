// ─────────────────────────────────────────────────────────────────────
// YOUR PIECES
// ─────────────────────────────────────────────────────────────────────
// One entry per thing hanging in the room. These do not have to be
// software projects — the playground is a wall of images, so photographs,
// paintings, prints or posters suit it better than screenshots do.
// Add or remove freely; the grid re-flows and the endless wrap adjusts.
//
//   title    shown big on hover + in the detail panel
//   tag      whatever the category is for you — a medium ("35mm", "Oil on
//            linen"), a series ("Night Walks"), or a discipline ("WebGL")
//   year     number
//   role     OPTIONAL. what you did. Omit it for photographs and artwork —
//            the panel hides the line entirely when it's absent
//   desc     1–3 sentences. For a photo this is the story of the shot;
//            for a project, the brief
//   url      OPTIONAL. where the link goes. Omit to hide the button.
//            Pair with `linkLabel` to change its wording ("Buy a print")
//   src      path to a real image in /public/img — this is the important
//            one for photography. Falls back to generated art if missing
//   fallback which pattern to draw when there's no `src` yet:
//            field · moire · rings · strata · dots · grid
//   ratio    width / height. 0.667 = portrait 2:3 · 1.0 square ·
//            1.5 = landscape 3:2 · 0.78 tall · 1.42 wide
//   featured mark 3–4 to fill the homepage's "Selected work" list.
//            With none marked, the first four are used
//
// → Replace the placeholder copy below with your own work.
// ─────────────────────────────────────────────────────────────────────

export const ITEMS = [
  {
    title: 'Yatri Hub', tag: 'Product Design', year: 2025, role: 'UI/UX & Research', type: 'project',
    desc: 'How I redesigned the rider experience to build confidence and reduced trip-planning uncertainty by 67% for e-bike riders.',
    url: 'https://sony-thakuri.xyz/8/', linkLabel: 'View on Portfolio', src: '/work/yatrihub1.png', featured: true, fallback: 'dots', ratio: 0.78,
    detail: {
      hero: '/work/yatrihub1.png',
      meta: [
        { label: 'Role', value: 'UX Researcher, UI/UX Designer' },
        { label: 'Timeline', value: 'Dec 2024 – May 2025' },
        { label: 'Team', value: '1 UI/UX Designer, 1 Team Lead, 4 Developers' },
        { label: 'Client', value: 'Yatri Motorcycles' }
      ],
      sections: [
        { 
          type: 'text', 
          heading: '/01 About Project', 
          body: 'The goal of this project was to refine and redesign an app for bike and scooter riders that connects their phones with their motorcycles, creating an ecosystem for monitoring and accessing bike data and statistics.' 
        },
        { 
          type: 'text', 
          heading: '/02 What is Yatri Hub?', 
          body: 'Yatri Hub is a smart companion app for Yatri electric bike riders, offering real-time bike monitoring, ride history, and quick access to essential stats. It enhances the user experience by providing features like nearby charging station locations, navigation routes, and seamless connectivity, promoting a sustainable and connected lifestyle.' 
        },
        {
          type: 'image',
          src: 'https://i-p.rmcdn.net/694871157f642afe77a867b2/6021618/image-55f633e0-41d4-49a0-ab38-8dd2788c4b18.png'
        },
        { 
          type: 'stats', 
          items: [
            { value: '60%', label: 'Higher user confidence to start longer trips' },
            { value: '67%', label: 'Reduced trip-planning uncertainty' },
            { value: '47%', label: 'Increase in first-time task success' },
            { value: '38%', label: 'Increase in feature engagement' }
          ]
        },
        { 
          type: 'text', 
          heading: '/03 Problem Statement', 
          body: 'Through user research and usability testing, I identified several core issues limiting the effectiveness of the bike companion app:<br><br>• The map experience was limited, showing only the user’s location and bike location, offering little actionable insight for riders.<br>• The home screen lacked visual hierarchy, making it difficult for users to quickly understand the bike’s status at a glance.<br>• Overall, the interface felt unintuitive and shallow, requiring users to navigate multiple screens to access essential information and reducing confidence in the app during real-world use.<br><br>As a result, users struggled to quickly assess their bike’s readiness, performance, and connection status, especially while on the go.' 
        },
        { 
          type: 'text', 
          heading: '/04 Research & Process', 
          body: 'We conducted a series of surveys and user interviews. The objective was to gather insights on riders\' experiences, their expectations from a digital companion app, and the features they prioritize when monitoring their bikes.<br><br><strong>Insights from 110 responders:</strong><br>• 63% wanted features like ride tracking.<br>• 40% wanted detailed charging statistics.' 
        },
        {
          type: 'image',
          src: 'https://i-p.rmcdn.net/6687dddd14f673006559aaaa/4891755/image-eefc8aff-32e2-46e2-b075-79250a7a75b4.png'
        },
        {
          type: 'image',
          src: 'https://i-p.rmcdn.net/6687dddd14f673006559aaaa/4891755/image-dd4485a6-541e-46f9-913e-91448d1e8289.png'
        },
        {
          type: 'text',
          heading: 'Key Opportunities',
          body: '1. Users want to use an integrated app with real-time monitoring and remote control features.<br><em>→ Develop integrated features like remote locking/unlocking, geo-fencing, and real-time notifications.</em><br><br>2. Users want to know nearby charging stations and their bike’s reachable range on the map.<br><em>→ Develop features like bike\'s reachable range with existing charge percentage.</em>'
        },
        {
          type: 'text',
          heading: '/05 Emotional Journey',
          body: 'I used journey mapping techniques to create a visual journey of persona, covering all the different interactions during the move and map out the emotions the persona went through. This made it clear where our users were running into issues and help me pinpoint where I should concentrate on.'
        },
        {
          type: 'image',
          src: 'https://c-p.rmcdn1.net/694871157f642afe77a867b2/69487205abaf9f8efb67c103/RasterizedImage-b8fe07ec-42f6-41e9-a0a3-8aac29276d73.png'
        },
        {
          type: 'text',
          heading: '/06 Challenges and Reflections',
          body: 'One of the primary challenges in designing Yatri Hub was balancing the need for rich, data-heavy functionality with a clean and intuitive user experience. Riders wanted access to detailed bike statistics, ride history, and system alerts, but presenting too much information at once risked overwhelming users—especially while riding. This pushed me to prioritize information hierarchy, progressive disclosure, and contextual surfaces so that critical information was always accessible without cognitive overload.<br><br>Working on Yatri Hub significantly shaped my approach to product design. I learned how critical it is to design within real constraints, hardware limitations, safety considerations, and technical dependencies while still advocating for user needs. The project strengthened my ability to work cross-functionally, make informed design trade-offs, and think beyond screens to the broader ecosystem in which a product lives. Most importantly, it reaffirmed my passion for creating seamless interactions between humans and connected devices, especially in mobility-driven experiences.'
        }
      ]
    }
  },
  {
    title: 'Moiré Records', tag: 'Identity', year: 2025, role: 'Art Direction', type: 'project',
    desc: 'Visual identity and sleeve system for an independent record label. The logo shimmers as it moves — a printed moiré you can feel.',
    url: 'https://example.com', src: '/img/02.jpg', featured: true, fallback: 'moire', ratio: 1.42,
  },
  {
    title: 'Longwave Atlas', tag: 'Data', year: 2025, role: 'Design + Build', type: 'project',
    desc: 'A radio-astronomy dashboard turning decades of signal into a navigable map. Shortlisted, Information is Beautiful Awards.',
    url: 'https://example.com', src: '/img/03.jpg', featured: true, fallback: 'rings', ratio: 0.78,
  },
  {
    title: 'Strata Studio', tag: 'Website', year: 2024, role: 'Design + Build', type: 'project',
    desc: 'Portfolio site for an architecture practice — the page peels back in geological layers as you scroll.',
    url: 'https://example.com', src: '/img/04.jpg', featured: true, fallback: 'strata', ratio: 1.42,
  },
  {
    title: 'Nightshift FM', tag: 'Audio', year: 2023, role: 'Creative Dev', type: 'project',
    desc: 'A generative late-night radio station. The visuals breathe with the music via the Web Audio API.',
    url: 'https://example.com', src: '/img/05.jpg', fallback: 'dots', ratio: 0.78,
  },
  {
    title: 'Paper Terminal', tag: 'Type', year: 2022, role: 'Type + Code', type: 'project',
    desc: 'A monospace typeface and terminal theme designed to feel like warm paper instead of cold glass.',
    url: 'https://example.com', src: '/img/06.jpg', fallback: 'grid', ratio: 1.0,
  },
  {
    title: 'Kernel Garden', tag: 'Generative', year: 2024, role: 'Solo Project', type: 'art',
    desc: 'An ever-growing garden of cellular automata. No two visits bloom the same way.',
    url: 'https://example.com', src: '/img/07.jpg', fallback: 'field', ratio: 1.0,
  },
  {
    title: 'Slow Signal', tag: 'Installation', year: 2023, role: 'Concept + Build', type: 'art',
    desc: 'A gallery installation translating the room\'s ambient sound into slow ripples of light across a 4-metre wall.',
    url: 'https://example.com', src: '/img/08.jpg', fallback: 'rings', ratio: 1.42,
  },
  {
    title: 'Dust Protocol', tag: 'Toy', year: 2022, role: 'Solo Project', type: 'art',
    desc: 'A tiny falling-sand playground for the browser. Pure procrastination, lovingly optimised.',
    url: 'https://example.com', src: '/img/09.jpg', fallback: 'dots', ratio: 0.78,
  },
  {
    title: 'Half Light', tag: 'Film', year: 2021, role: 'Title Design', type: 'art',
    desc: 'Opening titles for a short film — hand-drawn frames composited over volumetric fog.',
    url: 'https://example.com', src: '/img/10.jpg', fallback: 'strata', ratio: 1.42,
  },
  {
    title: 'Verso', tag: 'Editorial', year: 2021, role: 'Design', type: 'art',
    desc: 'A digital reading experience for long-form essays that respects the reader\'s attention above all else.',
    url: 'https://example.com', src: '/img/11.jpg', fallback: 'moire', ratio: 0.78,
  },
  {
    title: 'Cold Open', tag: 'Motion', year: 2020, role: 'Motion Design', type: 'art',
    desc: 'A broadcast title package built around a single unbroken camera move through paper sets.',
    url: 'https://example.com', src: '/img/12.jpg', fallback: 'grid', ratio: 1.0,
  },
];

export const PROJECT_ITEMS = ITEMS.filter(i => i.type === 'project');
export const ART_ITEMS = ITEMS.filter(i => i.type === 'art');

// ─────────────────────────────────────────────────────────────────────
// YOU  — shown in the corners and the intro card. Edit these.
// ─────────────────────────────────────────────────────────────────────
export const ME = {
  name:    'Your Name',
  role:    'Designer & Creative Developer',
  tagline: 'I build small, strange, beautiful things for the web.',
  email:   'you@example.com',
  status:  'Available for new work',
  location: 'Somewhere, Earth',

  // shown in the footer — add, remove or reorder freely
  links: [
    { label: 'GitHub',   url: 'https://github.com/' },
    { label: 'Are.na',   url: 'https://are.na/' },
    { label: 'LinkedIn', url: 'https://linkedin.com/' },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// ABOUT — the centre of the homepage. Write this in your own voice; it is
// the one place on the site that sounds like a person rather than a CV.
// Each string is its own paragraph. Two or three is usually plenty.
// ─────────────────────────────────────────────────────────────────────
export const ABOUT = [
  `I design and build for the web, mostly in the seam between the two — the
   places where an interface stops being a document and starts being a space
   you can move around in.`,

  `I care about work that rewards attention: things that look calm at a glance
   and turn out to have been made carefully. Lately that has meant a lot of
   WebGL, a lot of typography, and a long-running argument with myself about
   how much motion is too much.`,

  `Before this I studied architecture, which is probably why every site I make
   eventually wants to become a room.`,
];

// ─────────────────────────────────────────────────────────────────────
// EXPERIENCE — newest first. Delete the array entirely and the section
// removes itself from the page.
// ─────────────────────────────────────────────────────────────────────
export const EXPERIENCE = [
  { role: 'Independent',            org: 'Freelance',        period: '2023 — now',  note: 'Design and creative development for studios and small teams.' },
  { role: 'Senior Product Designer', org: 'Northlight',      period: '2021 — 2023', note: 'Design system, marketing site, and the odd shader.' },
  { role: 'Designer',               org: 'Field Studio',     period: '2019 — 2021', note: 'Brand and interface work for cultural clients.' },
  { role: 'BA Architecture',        org: 'University',       period: '2015 — 2019', note: '' },
];
