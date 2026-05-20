// Seed 3 sample Role documents into Sanity. Safe to re-run — uses
// createOrReplace keyed by slug. Requires SANITY_WRITE_TOKEN in env.

const crypto = require('node:crypto');
const { createClient } = require('@sanity/client');

const TOKEN = process.env.SANITY_WRITE_TOKEN;
if (!TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN env var');
  process.exit(1);
}

const client = createClient({
  projectId: 'jdxbkry4',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
});

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

(async () => {
  // Auth check
  const me = await client.request({ uri: '/users/me' }).catch((e) => {
    console.error('Token check failed:', e.message);
    process.exit(1);
  });
  console.log(`Authenticated as: ${me?.name || me?.email || me?.id}`);

  const results = [];
  for (const r of ROLES) {
    const doc = {
      _id: `role.${r.slug}`,
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
    try {
      const out = await client.createOrReplace(doc);
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
