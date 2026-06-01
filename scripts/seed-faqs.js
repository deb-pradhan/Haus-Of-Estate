// Seed FAQ documents. Two modes:
//   1. With SANITY_WRITE_TOKEN set  -> createOrReplace via the API.
//   2. Without a token              -> writes scripts/faqs.ndjson,
//      importable with: npx sanity dataset import scripts/faqs.ndjson production --replace

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

function paragraph(text) {
  return {
    _key: key(),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: key(), _type: 'span', marks: [], text }],
  };
}

function answer(paragraphs) {
  return paragraphs.map(paragraph);
}

const FAQS = [
  {
    slug: 'how-do-i-start-the-buying-process',
    question: 'How do I start the buying process with Haus of Estate?',
    category: 'Buying',
    featured: true,
    answer: answer([
      'Start with a free, no-obligation enquiry — tell us where you’re looking, your budget, timeframe and what kind of home you’re after.',
      'A specialist advisor will introduce you to one or two vetted estate agents who fit your brief. From there, viewings, offers and conveyancing are handled in the normal way, with us on hand whenever you need a second opinion.',
    ]),
    order: 10,
  },
  {
    slug: 'how-does-the-selling-process-work',
    question: 'How does the selling process work?',
    category: 'Selling',
    featured: true,
    answer: answer([
      'We start with a free market appraisal. Share your property’s details and we’ll provide a realistic guide price, comparable evidence and the likely timeline for your area.',
      'If you proceed, we introduce you to a vetted estate agent who lists the property, manages viewings and negotiates offers. Throughout the process we stay involved as an honest second pair of eyes — at no additional cost.',
    ]),
    order: 20,
  },
  {
    slug: 'how-are-viewings-arranged',
    question: 'How are viewings arranged?',
    category: 'Viewings',
    featured: true,
    answer: answer([
      'Viewings are arranged directly with the listing agent at a time that suits you. Where helpful, we’ll join the first viewing or arrange a video tour for clients based abroad.',
      'For overseas buyers we can coordinate a viewing day — back-to-back appointments at properties that genuinely match your brief, so a single trip is enough to make a confident shortlist.',
    ]),
    order: 30,
  },
  {
    slug: 'what-fees-do-i-pay',
    question: 'What fees do I pay to Haus of Estate?',
    category: 'Fees & Documentation',
    featured: true,
    answer: answer([
      'Buyers and renters pay nothing to enquire and nothing to use our advisory service — our partner estate and letting agents pay us when a transaction completes.',
      'Sellers and landlords agree fees with the listing agent in the normal way; we’ll tell you upfront what to expect for your area, including any add-ons (photography, EPCs, referencing).',
    ]),
    order: 40,
  },
  {
    slug: 'documents-needed-to-rent-in-the-uk',
    question: 'What documents do I need to rent in the UK?',
    category: 'Renting',
    featured: true,
    answer: answer([
      'Most UK lettings require proof of identity (passport or driving licence), proof of address (recent utility bill or bank statement), proof of right to rent in the UK, an employer reference and a recent payslip or accountant’s letter.',
      'Your letting agent will run formal referencing and may ask for a guarantor if you’re early in your career or new to the UK. We can walk you through each step and what to prepare in advance.',
    ]),
    order: 50,
  },
  {
    slug: 'documents-needed-to-buy-in-the-uk',
    question: 'What documents do I need to buy a property in the UK?',
    category: 'Fees & Documentation',
    featured: false,
    answer: answer([
      'You’ll need photo ID (passport or UK driving licence) and proof of address dated within the last three months. For the deposit, your solicitor will need a clear paper trail showing the source of funds — bank statements, sale proceeds, gift letters or business accounts.',
      'If you’re using a mortgage you’ll also need an Agreement in Principle and, for self-employed buyers, two to three years of accounts or SA302s.',
    ]),
    order: 60,
  },
  {
    slug: 'how-long-does-a-uk-sale-take',
    question: 'How long does a UK property sale typically take?',
    category: 'Selling',
    featured: false,
    answer: answer([
      'From accepted offer to completion, most UK sales take eight to twelve weeks. Chains, mortgage applications and searches drive the timeline. Cash buyers in a no-chain position can complete in four to six weeks.',
      'We’ll set a realistic timetable at the start and flag risks early — most delays are predictable if you’re paying attention.',
    ]),
    order: 70,
  },
  {
    slug: 'do-you-work-with-international-buyers',
    question: 'Do you work with international buyers?',
    category: 'General',
    featured: true,
    answer: answer([
      'Yes — a large share of our clients buy from outside the UK. We handle introductions to property lawyers experienced with overseas purchases, FX guidance through our partners, and viewing days designed for a single visit.',
      'Wherever you live, the process is the same: one enquiry, the right vetted agent, no hidden fees.',
    ]),
    order: 80,
  },
];

function buildDoc(f) {
  return {
    _id: `faq-${f.slug}`,
    _type: 'faq',
    question: f.question,
    slug: { _type: 'slug', current: f.slug },
    category: f.category,
    answer: f.answer,
    order: f.order,
    featured: f.featured,
    status: 'published',
  };
}

(async () => {
  if (!client) {
    const out = path.join(__dirname, 'faqs.ndjson');
    fs.writeFileSync(out, FAQS.map((f) => JSON.stringify(buildDoc(f))).join('\n') + '\n', 'utf8');
    console.log(`Wrote ${FAQS.length} FAQs to ${out}`);
    console.log('Import: npx sanity dataset import scripts/faqs.ndjson production --replace');
    return;
  }
  for (const f of FAQS) {
    const out = await client.createOrReplace(buildDoc(f));
    console.log(`✓ ${out.question} (${out._id})`);
  }
  console.log(`\nSeeded ${FAQS.length} FAQs.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
