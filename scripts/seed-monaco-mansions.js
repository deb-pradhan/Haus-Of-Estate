// Seed the single Azizi Monaco Mansions development showcase into Sanity.
//
// Two modes:
//   1. With SANITY_WRITE_TOKEN set  -> createOrReplace via API + asset upload.
//   2. Without a token              -> writes scripts/monaco-mansions.ndjson,
//      importable with:
//        npx sanity dataset import scripts/monaco-mansions.ndjson production --replace
//
// One document represents the whole mansion collection — no per-unit listings,
// no unit numbers. Price, size and bedrooms are presented as ranges derived from
// the full unit mix. Specific availability is confirmed on enquiry.
//
// Image flow: drop the Monaco-Mansions renders into
//   public/properties/monaco-mansions/
// then run the seed + import. The NDJSON uses _sanityAsset file refs so the
// Sanity importer uploads them automatically.

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

function block(style, text) {
  return {
    _key: key(),
    _type: 'block',
    style,
    markDefs: [],
    children: [{ _key: key(), _type: 'span', marks: [], text }],
  };
}

function descPT(paragraphs) {
  return paragraphs.map((p) => block(p.style || 'normal', p.text));
}

// ── Development data (from FACTSHEET - MM.pdf) ─────────────────────────

const COMMUNITY = 'Azizi Monaco Mansions';
const MASTER_DEVELOPMENT = 'Azizi Venice';
const CITY = 'Dubai';
const COUNTRY = 'United Arab Emirates';
const DEVELOPER = 'Azizi Developments';
const SLUG = 'monaco-mansions';

// Full unit mix, used to derive display ranges. Not seeded per-unit.
const UNIT_MIX = [
  { bedrooms: 6, sizeSqft: 20383.36, priceAED: 50039000 },
  { bedrooms: 6, sizeSqft: 20383.36, priceAED: 50474000 },
  { bedrooms: 6, sizeSqft: 20383.36, priceAED: 50911000 },
  { bedrooms: 6, sizeSqft: 20383.36, priceAED: 51348000 },
  { bedrooms: 6, sizeSqft: 20383.36, priceAED: 52214000 },
  { bedrooms: 6, sizeSqft: 21272.46, priceAED: 55927000 },
  { bedrooms: 7, sizeSqft: 29333.95, priceAED: 96730000 },
  { bedrooms: 7, sizeSqft: 27610.84, priceAED: 113666000 },
  { bedrooms: 8, sizeSqft: 32393.4, priceAED: 142310000 },
  { bedrooms: 8, sizeSqft: 38695.72, priceAED: 176259000 },
  { bedrooms: 8, sizeSqft: 36430.11, priceAED: 182103000 },
  { bedrooms: 8, sizeSqft: 39003.57, priceAED: 203983000 },
];

const formatInt = (n) =>
  Math.round(n).toLocaleString('en-GB', { useGrouping: true });

const minPrice = Math.min(...UNIT_MIX.map((u) => u.priceAED));
const minSize = Math.min(...UNIT_MIX.map((u) => u.sizeSqft));
const maxSize = Math.max(...UNIT_MIX.map((u) => u.sizeSqft));
const bedCounts = [...new Set(UNIT_MIX.map((u) => u.bedrooms))].sort(
  (a, b) => a - b,
);
const bedroomsRange =
  bedCounts.length === 1 ? `${bedCounts[0]}` : `${bedCounts[0]}–${bedCounts[bedCounts.length - 1]}`;

const PRICE_DISPLAY = `From AED ${formatInt(minPrice)}`;
const SIZE_DISPLAY = `${formatInt(minSize)}–${formatInt(maxSize)} sq ft (BUA)`;
const BEDROOMS_DISPLAY = `${bedroomsRange} bedrooms`;
const UNIT_COUNT = UNIT_MIX.length;

const KEY_FEATURES = [
  `${UNIT_COUNT} bespoke water-inspired mansions across the Azizi Venice lagoon community`,
  `Choice of ${bedroomsRange}-bedroom mansions`,
  'Plot sizes from 10,000 – 20,000 sq ft',
  'Four expansive levels connected by a private elevator',
  'Two swimming pools — ground floor and rooftop',
  'Rooftop terrace with seating areas and al-fresco dining',
  'State-of-the-art home cinema and dedicated home office',
  'Fully landscaped gardens with curated outdoor lounges and sunken seating',
  'Direct beach access onto the Venice-inspired swimmable lagoon',
];

const AMENITIES = [
  'Fully-equipped fitness centre',
  'Exclusive spa with sauna, steam, ice shower and massage rooms',
  'State-of-the-art jacuzzi and Turkish Hammam',
  'Multiple kitchens — show kitchen, kitchenette and production kitchen',
  'Staff accommodation for maids and drivers',
  'Spacious and secure private garage',
  'Cultural District designed by Zaha Hadid Architects',
  'K-12 school, nursery and kindergarten on the community masterplan',
  'Clubhouse, multipurpose halls and mosque',
  'Infinity pools overlooking the crystal lagoon',
  '18 km of swimmable beaches and boardwalks',
  '40 acres of parks and green spaces',
  '5.5 km recreational cycling and jogging track',
  'Water sports — kayaking and sailing on the lagoon',
  'Private hospital and five-star family lifestyle hotels nearby',
];

const LOCATION_BENEFITS = [
  ['Emirates Road', '5 mins'],
  ['Al Maktoum International Airport (DWC)', '7 mins'],
  ['Dubai Parks and Resorts', '15 mins'],
  ['Dubai Marina', '30 mins'],
  ['The Palm Jebel Ali', '30 mins'],
].map(([destination, time]) => ({
  _type: 'locationBenefit',
  destination,
  time,
}));

const INTRO =
  'Azizi Monaco Mansions sits at the heart of Dubai South, within the Azizi Venice masterplan — a Venice-inspired waterfront community organised around a 18 km swimmable lagoon, 40 acres of parks, and a Zaha Hadid-designed cultural district. The mansion collection itself is the rarest, most exclusive water-inspired residential tier in the masterplan.';

const COMMUNITY_PARA =
  `The collection comprises ${UNIT_COUNT} hand-finished mansions, each set across four expansive levels with a private elevator, two swimming pools (one on the rooftop), a state-of-the-art home cinema, dedicated home office, and a private spa zone with sauna, steam and Hammam. Plot sizes range from 10,000 to 20,000 sq ft, with road-facing and lagoon-facing aspects, and a choice between ${bedroomsRange}-bedroom layouts.`;

// ── Images: shared community renders ───────────────────────────────────
// Drop the following files into public/properties/monaco-mansions/ before
// running the import. Filenames must match exactly.

const IMG = {
  aerial: {
    file: 'monaco-mansions-aerial.jpg',
    alt: 'Azizi Monaco Mansions — aerial view of the lagoon community',
  },
  exterior: {
    file: 'monaco-mansions-exterior-front.jpg',
    alt: 'Azizi Monaco Mansions — front-side mansion exterior at dusk',
  },
  pool: {
    file: 'monaco-mansions-pool.jpg',
    alt: 'Azizi Monaco Mansions — private pool with lagoon access',
  },
  rooftopPool: {
    file: 'monaco-mansions-rooftop-pool.jpg',
    alt: 'Azizi Monaco Mansions — rooftop pool with skyline views',
  },
  terrace: {
    file: 'monaco-mansions-terrace.jpg',
    alt: 'Azizi Monaco Mansions — landscaped private terrace',
  },
  formalLiving: {
    file: 'monaco-mansions-formal-living.jpg',
    alt: 'Azizi Monaco Mansions — formal living room with sculptural staircase',
  },
  masterBedroom: {
    file: 'monaco-mansions-master-bedroom.jpg',
    alt: 'Azizi Monaco Mansions — master bedroom suite',
  },
  cinema: {
    file: 'monaco-mansions-cinema.jpg',
    alt: 'Azizi Monaco Mansions — private home cinema',
  },
  entertainment: {
    file: 'monaco-mansions-entertainment.jpg',
    alt: 'Azizi Monaco Mansions — entertainment lounge and bar',
  },
};

const GALLERY = [
  IMG.aerial,
  IMG.exterior,
  IMG.pool,
  IMG.rooftopPool,
  IMG.terrace,
  IMG.formalLiving,
  IMG.masterBedroom,
  IMG.cinema,
  IMG.entertainment,
];

const FEATURED_IMAGE = IMG.aerial;

function sanityImage(img, assetMap, withKey) {
  const base = assetMap
    ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetMap[img.file] },
        alt: img.alt,
      }
    : {
        _type: 'image',
        _sanityAsset: `image@file://./../public/properties/monaco-mansions/${img.file}`,
        alt: img.alt,
      };
  if (withKey) base._key = key();
  return base;
}

async function uploadAssets(c) {
  const map = {};
  for (const img of GALLERY) {
    const filePath = path.join(
      __dirname,
      '..',
      'public',
      'properties',
      'monaco-mansions',
      img.file,
    );
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ missing image (skipped): ${img.file}`);
      continue;
    }
    const asset = await c.assets.upload(
      'image',
      fs.createReadStream(filePath),
      { filename: img.file },
    );
    map[img.file] = asset._id;
    console.log(`  ↑ uploaded ${img.file}`);
  }
  return map;
}

function buildDoc(assetMap) {
  return {
    _id: `property-${SLUG}`,
    _type: 'property',
    title: 'Azizi Monaco Mansions',
    slug: { _type: 'slug', current: SLUG },
    community: COMMUNITY,
    masterDevelopment: MASTER_DEVELOPMENT,
    city: CITY,
    country: COUNTRY,
    developer: DEVELOPER,
    unitType: 'Mansion',
    bedrooms: bedCounts[0],
    sizeDisplay: SIZE_DISPLAY,
    plotSizeDisplay: '10,000 – 20,000 sq ft (plot)',
    priceDisplay: PRICE_DISPLAY,
    paymentPlan: 'Standard',
    view: 'Lagoon',
    completionStatus: 'completed-offplan',
    summary: `${UNIT_COUNT} bespoke mansions at Azizi Monaco Mansions in Dubai South — ${bedroomsRange} bedrooms, lagoon views, four levels, private spa and rooftop pool. Completed and off-plan availability.`,
    description: descPT([
      {
        text: `${COMMUNITY} is a collection of ${UNIT_COUNT} hand-finished mansions within the Azizi Venice masterplan. Sizes range from ${formatInt(minSize)} to ${formatInt(maxSize)} sq ft of built-up area, with ${bedroomsRange}-bedroom layouts, lagoon views, and four expansive levels connected by a private elevator.`,
      },
      { style: 'h2', text: 'About Azizi Monaco Mansions' },
      { text: INTRO },
      { text: COMMUNITY_PARA },
      { style: 'h2', text: 'Enquire' },
      {
        text: `Pricing, payment-plan options and the available mansion design types (eight distinct interiors) are confirmed on enquiry. Speak to a Haus of Estate advisor and we will introduce you to the right vetted agent for this development.`,
      },
    ]),
    keyFeatures: KEY_FEATURES,
    amenities: AMENITIES,
    locationBenefits: LOCATION_BENEFITS.map((b) => ({ ...b, _key: key() })),
    featuredImage: sanityImage(FEATURED_IMAGE, assetMap, false),
    gallery: GALLERY.map((img) => sanityImage(img, assetMap, true)),
    enquiryEmail: 'info@hausofestate.com',
    publishedAt: new Date().toISOString(),
    status: 'published',
    featured: true,
  };
}

(async () => {
  if (!client) {
    const outPath = path.join(__dirname, 'monaco-mansions.ndjson');
    const ndjson = JSON.stringify(buildDoc(null));
    fs.writeFileSync(outPath, ndjson + '\n', 'utf8');
    console.log('Wrote 1 Monaco Mansions showcase doc to:');
    console.log(`  ${outPath}`);
    console.log('\nNext steps:');
    console.log(
      '  1. Drop the renders into public/properties/monaco-mansions/',
    );
    console.log('     (filenames must match those listed in IMG at the top)');
    console.log('  2. Import with your CLI session:');
    console.log(
      '     npx sanity dataset import scripts/monaco-mansions.ndjson production --replace',
    );
    return;
  }

  console.log('Uploading images...');
  const assetMap = await uploadAssets(client);

  const out = await client.createOrReplace(buildDoc(assetMap));
  console.log(`✓ ${out.title}`);
  console.log('\nSeeded 1 Monaco Mansions showcase doc.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
