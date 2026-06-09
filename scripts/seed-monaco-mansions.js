// Seed the 13 Azizi Monaco Mansions units into Sanity.
//
// Two modes:
//   1. With SANITY_WRITE_TOKEN set  -> createOrReplace via API + asset upload.
//   2. Without a token              -> writes scripts/monaco-mansions.ndjson,
//      importable with:
//        npx sanity dataset import scripts/monaco-mansions.ndjson production --replace
//
// All units share the same community + developer + amenities (sourced from the
// Monaco Mansions factsheet PDF). Each unit has its own size, price, unit
// number and bedroom count from the unit-listing snapshot.
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

// ── Shared development data (from FACTSHEET - MM.pdf) ──────────────────

const COMMUNITY = 'Azizi Monaco Mansions';
const MASTER_DEVELOPMENT = 'Azizi Venice';
const CITY = 'Dubai';
const COUNTRY = 'United Arab Emirates';
const DEVELOPER = 'Azizi Developments';

const KEY_FEATURES = [
  'Bespoke water-inspired mansions across the Azizi Venice lagoon community',
  'Plot sizes from 10,000 – 20,000 sq ft with 6, 7 or 8 bedrooms',
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
  'Each mansion is hand-finished across four expansive levels, with a private elevator, two swimming pools (one on the rooftop), a state-of-the-art home cinema, dedicated home office, and a private spa zone with sauna, steam and Hammam. Plot sizes range from 10,000 to 20,000 sq ft, with road-facing and lagoon-facing aspects, and a choice between six, seven and eight bedrooms.';

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

// Gallery shown on every listing: exterior story first, then interiors.
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

// Every unit uses the aerial as the featured hero — strongest, most consistent
// brand image. (Unit-specific design renders can be swapped in the Studio
// once units are mapped to one of the 8 Monaco mansion design types.)
function featuredFor(_index) {
  return IMG.aerial;
}

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

// ── The 13 units from the snapshot ─────────────────────────────────────

const UNITS = [
  // 6-bedroom Mansions
  { unit: '047', bedrooms: 6, sizeSqft: 20383.36, priceAED: 50039000 },
  { unit: '035', bedrooms: 6, sizeSqft: 20383.36, priceAED: 50474000 },
  { unit: '046', bedrooms: 6, sizeSqft: 20383.36, priceAED: 50911000 },
  { unit: '008', bedrooms: 6, sizeSqft: 20383.36, priceAED: 51348000 },
  { unit: '023', bedrooms: 6, sizeSqft: 20383.36, priceAED: 52214000 },
  { unit: '002', bedrooms: 6, sizeSqft: 21272.46, priceAED: 55927000 },
  // 7-bedroom Mansions
  { unit: '076', bedrooms: 7, sizeSqft: 29333.95, priceAED: 96730000 },
  { unit: '066', bedrooms: 7, sizeSqft: 27610.84, priceAED: 113666000 },
  // 8-bedroom Mansions
  { unit: '102', bedrooms: 8, sizeSqft: 32393.4, priceAED: 142310000 },
  { unit: '081', bedrooms: 8, sizeSqft: 38695.72, priceAED: 176259000 },
  { unit: '093', bedrooms: 8, sizeSqft: 36430.11, priceAED: 182103000 },
  { unit: '096', bedrooms: 8, sizeSqft: 39003.57, priceAED: 203983000 },
];

const formatInt = (n) =>
  Math.round(n).toLocaleString('en-GB', { useGrouping: true });

function unitSummary(u) {
  return `A ${u.bedrooms}-bedroom Mansion in Azizi Monaco Mansions, set across four levels with rooftop pool, private spa and direct access to the Azizi Venice lagoon. Lagoon view, completed and off-plan availability.`;
}

function buildDoc(u, index, assetMap) {
  const slug = `monaco-mansions-unit-${u.unit}`;
  const lead = `Unit ${u.unit} is a ${u.bedrooms}-bedroom Mansion in the Azizi Monaco collection — ${formatInt(u.sizeSqft)} sq ft of built-up area, lagoon view, and four expansive levels connected by a private elevator. Move-in ready with full developer finishings.`;

  return {
    _id: `property-${slug}`,
    _type: 'property',
    title: `Mansion ${u.unit} — Azizi Monaco Mansions`,
    slug: { _type: 'slug', current: slug },
    community: COMMUNITY,
    masterDevelopment: MASTER_DEVELOPMENT,
    city: CITY,
    country: COUNTRY,
    developer: DEVELOPER,
    unitType: 'Mansion',
    unitNumber: u.unit,
    bedrooms: u.bedrooms,
    sizeDisplay: `${formatInt(u.sizeSqft)} sq ft (BUA)`,
    plotSizeDisplay: '10,000 – 20,000 sq ft (plot)',
    priceDisplay: `AED ${formatInt(u.priceAED)}`,
    paymentPlan: 'Standard',
    view: 'Lagoon',
    completionStatus: 'completed-offplan',
    summary: unitSummary(u),
    description: descPT([
      { text: lead },
      { style: 'h2', text: 'About Azizi Monaco Mansions' },
      { text: INTRO },
      { text: COMMUNITY_PARA },
      { style: 'h2', text: 'Enquire' },
      {
        text: 'Pricing, payment-plan options and the available mansion design types (eight distinct interiors) are confirmed on enquiry. Speak to a Haus of Estate advisor and we will introduce you to the right vetted agent for this development.',
      },
    ]),
    keyFeatures: KEY_FEATURES,
    amenities: AMENITIES,
    locationBenefits: LOCATION_BENEFITS.map((b) => ({ ...b, _key: key() })),
    featuredImage: sanityImage(featuredFor(index), assetMap, false),
    gallery: GALLERY.map((img) => sanityImage(img, assetMap, true)),
    enquiryEmail: 'info@hausofestate.com',
    publishedAt: new Date().toISOString(),
    status: 'published',
    featured: index < 3,
  };
}

(async () => {
  if (!client) {
    const outPath = path.join(__dirname, 'monaco-mansions.ndjson');
    const ndjson = UNITS.map((u, i) =>
      JSON.stringify(buildDoc(u, i)),
    ).join('\n');
    fs.writeFileSync(outPath, ndjson + '\n', 'utf8');
    console.log(`Wrote ${UNITS.length} Monaco Mansions units to:`);
    console.log(`  ${outPath}`);
    console.log('\nNext steps:');
    console.log(
      '  1. Drop the 4 images into public/properties/monaco-mansions/',
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

  for (const [i, u] of UNITS.entries()) {
    const out = await client.createOrReplace(buildDoc(u, i, assetMap));
    console.log(`✓ ${out.title}`);
  }
  console.log(`\nSeeded ${UNITS.length} Monaco Mansions units.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
