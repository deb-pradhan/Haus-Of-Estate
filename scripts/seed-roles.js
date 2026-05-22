// Seed Role documents into Sanity. Two modes:
//   1. With SANITY_WRITE_TOKEN set  -> createOrReplace via the API.
//   2. Without a token              -> writes scripts/roles.ndjson, which
//      you can import with your own CLI session:
//        npx sanity dataset import scripts/roles.ndjson production --replace
// Safe to re-run — documents are keyed by slug (_id = role.<slug>).

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@sanity/client');

const TOKEN = process.env.SANITY_WRITE_TOKEN;

const client = TOKEN
  ? createClient({
      projectId: 'jdxbkry4',
      dataset: 'production',
      apiVersion: '2024-01-01',
      token: TOKEN,
      useCdn: false,
    })
  : null;

const key = () => crypto.randomBytes(6).toString('hex');

function block(style, text, marksMap = {}) {
  // marksMap: { 'substring': ['strong'] }
  const children = [];
  if (Object.keys(marksMap).length === 0) {
    children.push({ _key: key(), _type: 'span', marks: [], text });
  } else {
    // Simple inline parser for **bold**
    const re = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last)
        children.push({ _key: key(), _type: 'span', marks: [], text: text.slice(last, m.index) });
      children.push({ _key: key(), _type: 'span', marks: ['strong'], text: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length)
      children.push({ _key: key(), _type: 'span', marks: [], text: text.slice(last) });
  }
  return { _key: key(), _type: 'block', style, markDefs: [], children };
}

function descPT(paragraphs) {
  // paragraphs: [{ style?: 'normal'|'h2', text }]
  return paragraphs.map((p) => block(p.style || 'normal', p.text));
}

const ROLES = [
  {
    slug: 'property-advisor-london',
    title: 'Property Advisor — London',
    department: 'Advisory',
    location: 'London (hybrid)',
    employmentType: 'Full-time',
    summary:
      'Lead enquiries from UK-based buyers and renters, qualify briefs, and route them to vetted estate agents across our network. Calm, advisor-led, no chasing commission.',
    description: descPT([
      {
        text: 'Property advisors are the calm voice clients meet first. Your job is to understand what someone actually needs, ask the questions a junior agent would skip, and decide which of our partner agencies is the right fit.',
      },
      { style: 'h2', text: 'How the work feels' },
      {
        text: 'Most of your time is conversation — discovery calls, follow-ups, and the occasional in-person walk-around. The rest is making sure every brief is captured, every agent introduction is warm, and every client knows where they stand.',
      },
    ]),
    responsibilities: [
      'Handle inbound buyer and renter enquiries across the UK with care, speed and clarity.',
      'Qualify briefs in detail — budget, timeline, must-haves, deal-breakers — and document them.',
      'Match each client to the right partner estate agent based on area, specialism and track record.',
      'Stay close to clients through their journey — they should always know what is happening and why.',
      'Feed back what you learn into how we hire, vet and brief our partner agents.',
    ],
    requirements: [
      'Three or more years in estate agency, lettings or property advisory.',
      'Real working knowledge of the UK property market — London, Manchester or Birmingham especially.',
      'Excellent written and verbal English; the patience to over-explain when it matters.',
      'Comfort holding a calm, firm line — saying no to a client when an opportunity is wrong for them.',
    ],
    niceToHave: [
      'Experience working across the UAE or international markets.',
      'Familiarity with Rent Smart Wales or Propertymark CMP frameworks.',
      'A second language relevant to our client base.',
    ],
    applyEmail: 'info@hausofestate.com',
    status: 'open',
    featured: true,
  },
  {
    slug: 'lettings-specialist-cardiff',
    title: 'Lettings Specialist — Cardiff',
    department: 'Lettings',
    location: 'Cardiff',
    employmentType: 'Full-time',
    summary:
      'Own the Welsh lettings desk: brief tenants, vet partner letting agents, and make sure every introduction we make in Cardiff is one we would stand behind.',
    description: descPT([
      {
        text: 'Cardiff is a foundational market for us. This role is for someone who already knows the city — the streets, the landlords, the lettings agents worth a referral — and who wants to set the standard for how we operate across Wales.',
      },
      { style: 'h2', text: 'How the work feels' },
      {
        text: 'You will spend a lot of time on calls with tenants and prospective tenants, and almost as much time on coffee meetings with letting agents and managing agents in the city. You will be the person whose name comes up when a Cardiff landlord asks who to trust.',
      },
    ]),
    responsibilities: [
      'Manage the full Cardiff lettings enquiry pipeline end to end.',
      'Vet and onboard partner letting agencies; review their compliance under Rent Smart Wales.',
      'Walk tenants through tenancy paperwork, deposits, holdovers and renewals.',
      'Be the local face of Haus of Estate at landlord events and trade meet-ups.',
    ],
    requirements: [
      'Rent Smart Wales licensed or able to qualify within three months.',
      'Two or more years in Cardiff or wider Welsh lettings.',
      'Confident, articulate and unflappable on tenancy law and AST disputes.',
    ],
    niceToHave: [
      'Welsh language ability.',
      'ARLA Propertymark qualification or in progress.',
    ],
    applyEmail: 'info@hausofestate.com',
    status: 'open',
    featured: false,
  },
  {
    slug: 'social-media-manager',
    title: 'Social Media Manager',
    department: 'Marketing',
    location: 'London or Remote (UK time)',
    employmentType: 'Full-time',
    summary:
      'Own Haus of Estate’s social presence end-to-end. You’ll shape a calm, premium voice across Instagram, LinkedIn, TikTok and YouTube Shorts — turning the work we do behind the scenes into content people genuinely want to follow.',
    description: descPT([
      {
        text: 'Most property social media looks the same: shouty captions, generic listings, and stock-photo confetti. Ours doesn’t. We’re building a brand people trust with the largest decision of their lives — our content should sound like a thoughtful friend, not a sales floor.',
      },
      { style: 'h2', text: 'How the work feels' },
      {
        text: 'You’ll set the editorial line for the year, plan content in clean weekly cycles, and ship hands-on with a small in-house video editor and our advisors. Some weeks are tightly produced campaigns; others are quick, reactive posts from a viewing or a market shift. You will own the calendar, the metrics and the voice.',
      },
      { style: 'h2', text: 'What we measure' },
      {
        text: 'We don’t chase vanity follower counts. We track depth of engagement, qualified enquiries from social, and brand sentiment over six-month windows. You’ll be trusted to define the rest.',
      },
    ]),
    responsibilities: [
      'Own the social media strategy across Instagram, LinkedIn, TikTok, YouTube and emerging platforms.',
      'Plan and ship a weekly content calendar, working hand-in-hand with our video editor and advisors.',
      'Write captions, hooks and short copy that sound like Haus of Estate — calm, premium, never pushy.',
      'Stay close to the data: track reach, engagement, saves, shares and qualified enquiry attribution.',
      'Spot cultural and market moments worth a reactive post; defend the brand against ones that aren’t.',
      'Build and manage a light freelancer bench for design, motion and one-off campaigns.',
    ],
    requirements: [
      'Three or more years running social media for a brand, property firm or agency.',
      'A portfolio of work you’re genuinely proud of — links to handles or campaigns required.',
      'Native-level written English with a strong instinct for short-form copy.',
      'Comfort with analytics tools (Meta Business Suite, LinkedIn analytics, TikTok analytics, plus GA4 basics).',
      'Calm under deadline pressure and the discipline to say no to off-brand briefs.',
    ],
    niceToHave: [
      'Experience in the UK or UAE property, luxury or financial-services space.',
      'A second language relevant to our client base (Arabic, Bahasa Indonesia, Mandarin or Welsh).',
      'Light hands-on motion or photo editing skills.',
    ],
    applyEmail: 'info@hausofestate.com',
    status: 'open',
    featured: true,
  },
  {
    slug: 'video-editor',
    title: 'Video Editor',
    department: 'Marketing',
    location: 'London or Remote (UK time)',
    employmentType: 'Full-time',
    summary:
      'Cut the videos that turn our work into a brand people remember. Short-form first — Reels, Shorts, TikToks — with the craft and pacing of a documentary editor, not a real-estate showreel.',
    description: descPT([
      {
        text: 'Property video is a crowded category and most of it is forgettable: drone shots, swelling music, no point of view. We want something quieter and more confident — work that earns the watch instead of demanding it.',
      },
      { style: 'h2', text: 'How the work feels' },
      {
        text: 'You’ll work directly with our Social Media Manager and advisors. Inputs vary: phone footage from a viewing, a sit-down interview with an advisor, a stock library, your own b-roll. Output is mostly short-form vertical, with occasional longer pieces for YouTube or pitch decks.',
      },
      { style: 'h2', text: 'What good looks like' },
      {
        text: 'Tight cuts. Strong opening seconds. Sound design that does real work. Captions that hold up muted. A clear visual point of view that becomes recognisable as ours.',
      },
    ]),
    responsibilities: [
      'Edit short-form vertical videos for Instagram Reels, TikTok and YouTube Shorts on a weekly rhythm.',
      'Produce occasional longer-form content: explainer videos, advisor interviews, recap films.',
      'Develop a consistent visual identity for our video output — colour, type, motion treatments.',
      'Source and license music, b-roll and stock assets responsibly.',
      'Manage your own project files, versioning and delivery; keep the team’s editorial calendar honest.',
    ],
    requirements: [
      'Three or more years cutting short-form social video for a brand, agency or independent studio.',
      'Reel required — we want to see the cuts, not the credentials.',
      'Fluent in Premiere Pro or DaVinci Resolve, plus After Effects for light motion.',
      'Strong sense of pacing, sound design and on-screen typography for muted viewing.',
      'Reliable communicator who can ship to deadlines without supervision.',
    ],
    niceToHave: [
      'Phone-camera shooting skill for fast turnarounds on viewings.',
      'Light colour grading and audio repair chops.',
      'Experience working in the property, luxury, hospitality or travel sectors.',
    ],
    applyEmail: 'info@hausofestate.com',
    status: 'open',
    featured: true,
  },
  {
    slug: 'interior-design-intern',
    title: 'Interior Design Intern',
    department: 'Operations',
    location: 'London or hybrid — UK based',
    employmentType: 'Internship',
    summary:
      'A structured 3–6 month internship supporting our interior design and property-presentation work — from mood boards and supplier research to install days — learning how design shapes the way a property is received.',
    description: descPT([
      {
        text: 'This is a learning-first placement for someone early in an interior design career. You will work alongside our design and operations team on real residential projects across our UK markets, with structured supervision throughout. It is hands-on from week one, but you are never expected to know it all — questions are welcome and expected.',
      },
      { style: 'h2', text: 'How the internship works' },
      {
        text: 'The internship runs for three to six months, agreed with you at the outset. You are paired with a named supervisor, set clear objectives for each month, and have regular review conversations. At the end of the placement you receive an honest written reference reflecting the work you have done — whether or not a permanent opening exists at the time.',
      },
      { style: 'h2', text: 'What you will learn' },
      {
        text: 'How a brief becomes a scheme; how to specify finishes, furniture and lighting responsibly; how UK residential design choices affect saleability and lettability; and how a design team runs a project from concept through to install and handover.',
      },
    ]),
    responsibilities: [
      'Support the creation of mood boards, sample palettes and design schemes for residential properties.',
      'Research furniture, finishes, lighting and materials from UK and international suppliers.',
      'Maintain the design library — fabric samples, paint references and supplier catalogues.',
      'Help prepare client-facing presentation documents and before-and-after visuals.',
      'Assist on site during measure-ups, install days and styling sessions.',
      'Keep project trackers and supplier correspondence accurate and up to date.',
      'Take part in design reviews and contribute ideas in team critiques.',
    ],
    requirements: [
      'Studying towards, or recently completed, a qualification in interior design, architecture or a related creative field.',
      'A developing portfolio or coursework you are happy to share.',
      'Eligibility to undertake an internship in the UK.',
      'Confident with at least one design tool — for example SketchUp, Canva or the Adobe Creative Suite.',
      'Strong written English and a genuine eye for detail.',
      'Organised, dependable and comfortable asking questions.',
    ],
    niceToHave: [
      'Familiarity with UK residential styles and the sales or lettings market.',
      'Basic CAD or 3D visualisation skills.',
      'Photography or styling experience.',
    ],
    applyEmail: 'hr@hausofestate.com',
    status: 'open',
    featured: false,
  },
  {
    slug: 'property-management-intern',
    title: 'Property Management Intern',
    department: 'Lettings',
    location: 'London or hybrid — UK based',
    employmentType: 'Internship',
    summary:
      'A hands-on 3–6 month internship across the day-to-day of UK property management — tenancy administration, maintenance coordination, compliance basics and client communication, all under close supervision.',
    description: descPT([
      {
        text: 'Property management is the engine room of a lettings business: detailed, deadline-driven and built on trust. This internship gives you a structured, supervised introduction to how that work is done to a professional UK standard. It suits someone organised, discreet and genuinely interested in a property career.',
      },
      { style: 'h2', text: 'How the internship works' },
      {
        text: 'The placement runs for three to six months with a named supervisor, monthly objectives and regular reviews. You will be given real responsibility in measured steps, always with someone checking your work. An honest written reference is provided at the end of the placement.',
      },
      { style: 'h2', text: 'What you will learn' },
      {
        text: 'How a tenancy runs from referencing to check-out; the key UK compliance touchpoints a managing agent must stay on top of — gas safety, electrical (EICR), EPCs, deposit protection and Right to Rent — at a working, learning level; and how to communicate clearly with landlords, tenants and contractors.',
      },
    ]),
    responsibilities: [
      'Support tenancy administration: referencing, tenancy agreements, inventories and check-ins and check-outs.',
      'Help coordinate maintenance requests with contractors and follow jobs through to completion.',
      'Assist with compliance tracking — gas safety certificates, EICRs, EPCs and deposit-protection deadlines.',
      'Maintain accurate property and tenancy records in our systems.',
      'Help prepare routine property inspection reports.',
      'Respond to straightforward tenant and landlord queries under supervision.',
      'Support rent tracking and arrears administration.',
    ],
    requirements: [
      'A genuine interest in a career in UK property, lettings or operations.',
      'Eligibility to undertake an internship in the UK.',
      'Strong organisation and accuracy with administrative tasks.',
      'Clear, professional written and spoken English.',
      'Discretion when handling confidential information.',
      'Comfortable with spreadsheets and quick to learn new software.',
    ],
    niceToHave: [
      "Awareness of UK lettings legislation — Right to Rent, deposit protection and the Renters' Rights framework.",
      'Studying towards a property, business or law-related qualification.',
      'A full UK driving licence, useful for property visits.',
    ],
    applyEmail: 'hr@hausofestate.com',
    status: 'open',
    featured: false,
  },
  {
    slug: 'staging-interiors-intern',
    title: 'Staging Interiors Intern',
    department: 'Operations',
    location: 'London or hybrid — UK based',
    employmentType: 'Internship',
    summary:
      'A practical 3–6 month internship in property staging — preparing, styling and presenting homes so they show at their best for viewings, photography and marketing.',
    description: descPT([
      {
        text: 'Staging is where design meets logistics. Unlike full interior design, the goal is to present a property so prospective buyers and tenants can picture themselves living there — quickly, on a schedule, and on shoot days that do not move. This internship is a practical, hands-on introduction to that craft.',
      },
      { style: 'h2', text: 'How the internship works' },
      {
        text: 'The placement runs for three to six months with a named supervisor, clear monthly objectives and regular review conversations. Expect a mix of planning days and active install and shoot days. You receive an honest written reference at the end of the placement.',
      },
      { style: 'h2', text: 'What you will learn' },
      {
        text: 'How to plan a staging scheme to a brief and a budget; how furniture placement, soft furnishings and finishing details change how a room reads; how a property shoot is run; and how viewing and photography feedback is used to refine a presentation.',
      },
    ]),
    responsibilities: [
      'Help plan and prepare staging schemes for properties going to market.',
      'Assist with styling on shoot days — furniture placement, dressing rooms and finishing details.',
      'Source and manage staging inventory: furniture, soft furnishings, props and accessories.',
      'Support load-in and load-out logistics for staging projects.',
      'Help maintain the staging store — cleaning, cataloguing and condition-checking items.',
      'Assist the team in reviewing photography and viewing feedback to refine schemes.',
      'Keep project checklists and supplier records accurate.',
    ],
    requirements: [
      'A genuine interest in interiors, styling or property presentation.',
      'Eligibility to undertake an internship in the UK.',
      'Practical, hands-on and happy to be on your feet on install and shoot days.',
      'A good eye for detail, colour and composition.',
      'Reliable, punctual and a strong team player.',
      'Able to travel to properties across the relevant region.',
    ],
    niceToHave: [
      'Previous styling, retail visual-merchandising or set-dressing experience.',
      'Basic photography skills.',
      'A full UK driving licence.',
    ],
    applyEmail: 'hr@hausofestate.com',
    status: 'open',
    featured: false,
  },
  {
    slug: 'international-markets-associate-remote',
    title: 'International Markets Associate — Remote',
    department: 'Advisory',
    location: 'Remote (UK / UAE time zones)',
    employmentType: 'Full-time',
    summary:
      'Help international buyers move capital into the UK, UAE and Southeast Asia. Async-first, advisor-led, with a strong support team behind you.',
    description: descPT([
      {
        text: 'Our international clients are typically managing property purchases across borders and time zones, often while running businesses, raising families or relocating. They need someone who is responsive, calm and unafraid to slow them down when a decision needs more thought.',
      },
      { style: 'h2', text: 'How the work feels' },
      {
        text: 'Mostly written communication — WhatsApp, email, the occasional video call. Async by default. You will work closely with our advisors in the UK and UAE to make sure no client falls between the cracks.',
      },
    ]),
    responsibilities: [
      'Manage cross-border enquiries spanning UK, UAE and Southeast Asia.',
      'Coordinate timing across regions for completions, exchanges and viewings.',
      'Translate jargon for clients who are new to UK or UAE property law.',
      'Spot and escalate anything that smells off — opaque fees, rushed exchanges, mismatched briefs.',
    ],
    requirements: [
      'Experience working with international buyers, ideally in real estate, private banking or relocation services.',
      'Strong written English. Calm, precise tone.',
      'Comfort with async work and ownership over outcomes rather than hours.',
    ],
    niceToHave: [
      'Working knowledge of UAE freehold zones.',
      'Familiarity with Bali property leasehold structures.',
      'A second language: Arabic, Bahasa Indonesia or Mandarin.',
    ],
    applyEmail: 'info@hausofestate.com',
    status: 'open',
    featured: false,
  },
];

function buildDoc(r) {
  return {
    _id: `role-${r.slug}`,
    _type: 'role',
    title: r.title,
    slug: { _type: 'slug', current: r.slug },
    department: r.department,
    location: r.location,
    employmentType: r.employmentType,
    summary: r.summary,
    description: r.description,
    responsibilities: r.responsibilities,
    requirements: r.requirements,
    niceToHave: r.niceToHave,
    applyEmail: r.applyEmail,
    publishedAt: new Date().toISOString(),
    status: r.status,
    featured: r.featured,
  };
}

(async () => {
  // ── No token: emit an NDJSON import file ──────────────────────────────
  if (!client) {
    const outPath = path.join(__dirname, 'roles.ndjson');
    const ndjson = ROLES.map((r) => JSON.stringify(buildDoc(r))).join('\n');
    fs.writeFileSync(outPath, ndjson + '\n', 'utf8');
    console.log(`No SANITY_WRITE_TOKEN set — wrote ${ROLES.length} roles to:`);
    console.log(`  ${outPath}`);
    console.log('\nImport it with your own Sanity CLI session:');
    console.log(
      '  npx sanity dataset import scripts/roles.ndjson production --replace',
    );
    return;
  }

  // ── Token present: write via the API ──────────────────────────────────
  const me = await client.request({ uri: '/users/me' }).catch((e) => {
    console.error('Token check failed:', e.message);
    process.exit(1);
  });
  console.log(`Authenticated as: ${me?.name || me?.email || me?.id}`);

  const results = [];
  for (const r of ROLES) {
    try {
      const out = await client.createOrReplace(buildDoc(r));
      console.log(`✓ ${out.title} (${out._id})`);
      results.push(out);
    } catch (e) {
      console.error(`✗ ${r.title}: ${e.message}`);
      if (e.responseBody) console.error(e.responseBody);
      process.exit(1);
    }
  }
  console.log(`\nSeeded ${results.length} roles.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
