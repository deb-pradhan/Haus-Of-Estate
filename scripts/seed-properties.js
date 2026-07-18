// Seed the single Al Furjan community showcase into Sanity. Two modes:
//   1. With SANITY_WRITE_TOKEN set  -> createOrReplace via the API.
//   2. Without a token              -> writes scripts/properties.ndjson,
//      importable with your own CLI session:
//        npx sanity dataset import scripts/properties.ndjson production --replace
//
// One document represents the whole Al Furjan community offering — no per-unit
// listings, no per-unit-type prices. Apartment types (studio, 1, 2 bed, terrace)
// are surfaced as a key feature; specific pricing and availability are confirmed
// on enquiry. The brand shows prices in GBP (£).
//
// Source: "AlFurjan Factsheet.pdf" (Azizi Developments). The factsheet is a
// community-level brochure — it has no per-unit prices, sizes, bed/bath counts
// or building names. Images are added in the Studio (drag-and-drop) or via the
// _sanityAsset file refs below.

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

// ── Al Furjan community data (from the factsheet) ────────────────────────

const COMMUNITY = 'Al Furjan';
const CITY = 'Dubai';
const COUNTRY = 'United Arab Emirates';
const DEVELOPER = 'Azizi Developments';
const SLUG = 'al-furjan';

const AMENITIES = [
  'Swimming pools',
  'Fully-equipped gym',
  'Sauna & steam rooms',
  'Lush open spaces',
  'Entertainment facilities',
  'Shops, cafes & restaurants',
  "Kids' play areas",
  'Concierge services',
  'Nurseries & schools',
  'Recreational areas',
];

const KEY_FEATURES = [
  'In the growth corridor of new Dubai',
  'On the metro line — 1 minute to Al Furjan Metro Station',
  'A choice of studios, 1, 2 and 3-bedroom apartments and terrace apartments',
  'Serene views of the Dubai skyline',
  'Direct access to Sheikh Zayed Road and Mohammed Bin Zayed Road',
  'A vibrant, family-friendly community',
  'Close to Expo 2020, Dubai Marina and Ibn Battuta Mall',
];

const LOCATION_BENEFITS = [
  ['Mohammed Bin Zayed Road', '1 min'],
  ['Al Furjan Metro Station', '1 min'],
  ['Jafza & Ibn Battuta Mall', '7 mins'],
  ['Dubai Marina & JBR', '10 mins'],
  ['Dubai Expo 2020', '12 mins'],
  ['The Palm Jumeirah', '15 mins'],
  ['Al Maktoum International Airport (DWC)', '15 mins'],
  ['DIFC & Business Bay', '25 mins'],
].map(([destination, time]) => ({
  _key: key(),
  _type: 'locationBenefit',
  destination,
  time,
}));

const INTRO =
  'Al Furjan is one of new Dubai’s most established community addresses — a vibrant residential district built around the true spirit of community life, by Azizi Developments. It sits on the metro line, moments from Ibn Battuta Mall, Dubai Marina, Bluewaters Island and Expo 2020.';

const COMMUNITY_PARA =
  'Residents have an abundance of amenities on their doorstep: swimming pools, a fully-equipped gym, sauna and steam rooms, lush open spaces, nurseries and schools, plus shops, cafes and restaurants throughout the community. It is a calm, well-served place to live, with completed and off-plan apartments and retail outlets available.';

const SUMMARY =
  'A connected, family-friendly community in new Dubai — one minute from the metro, with a choice of studios, 1, 2 and 3-bedroom apartments and terrace apartments. Completed and off-plan options.';

// ── Images (from photos/, copied to public/properties/) ────────────────

const IMG = {
  community: {
    file: 'al-furjan-community-01.jpg',
    alt: 'Al Furjan community — street view at dusk',
  },
  retail1: {
    file: 'al-furjan-retail-01.jpg',
    alt: 'Al Furjan — retail promenade at dusk',
  },
  retail2: {
    file: 'al-furjan-retail-02.jpg',
    alt: 'Al Furjan — street-level retail frontage',
  },
  retail3: {
    file: 'al-furjan-retail-03.jpg',
    alt: 'Al Furjan — retail and dining at street level',
  },
};

const GALLERY = [IMG.community, IMG.retail1, IMG.retail2, IMG.retail3];
const FEATURED_IMAGE = IMG.community;

// In NDJSON mode (no token), reference local files with _sanityAsset so
// `sanity dataset import` uploads them. In token mode, assetMap holds the
// uploaded asset ids and we build a normal asset reference.
function sanityImage(img, assetMap, withKey) {
  const base = assetMap
    ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetMap[img.file] },
        alt: img.alt,
      }
    : {
        _type: 'image',
        _sanityAsset: `image@file://./../public/properties/${img.file}`,
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
      img.file,
    );
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
    title: 'Al Furjan',
    slug: { _type: 'slug', current: SLUG },
    community: COMMUNITY,
    city: CITY,
    country: COUNTRY,
    developer: DEVELOPER,
    unitType: 'Apartment',
    sizeDisplay: 'On application',
    priceDisplay: 'Price on application',
    completionStatus: 'completed-offplan',
    summary: SUMMARY,
    description: descPT([
      {
        text: 'Al Furjan offers a choice of studios, 1, 2 and 3-bedroom apartments and terrace apartments in one of new Dubai’s most established, well-connected communities — ideal as a first home, a family base, or a straightforward buy-to-let.',
      },
      { style: 'h2', text: 'The community' },
      { text: INTRO },
      { text: COMMUNITY_PARA },
      { style: 'h2', text: 'Enquire' },
      {
        text: 'Pricing, exact sizes and current availability are confirmed on enquiry. Speak to a Haus of Estate advisor and we will connect you with the right vetted agent for this community.',
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
    const outPath = path.join(__dirname, 'properties.ndjson');
    const ndjson = JSON.stringify(buildDoc(null));
    fs.writeFileSync(outPath, ndjson + '\n', 'utf8');
    console.log('No SANITY_WRITE_TOKEN set — wrote 1 showcase doc to:');
    console.log(`  ${outPath}`);
    console.log('\nImport it with your own Sanity CLI session:');
    console.log(
      '  npx sanity dataset import scripts/properties.ndjson production --replace',
    );
    return;
  }

  const me = await client.request({ uri: '/users/me' }).catch((e) => {
    console.error('Token check failed:', e.message);
    process.exit(1);
  });
  console.log(`Authenticated as: ${me?.name || me?.email || me?.id}`);

  console.log('Uploading images...');
  const assetMap = await uploadAssets(client).catch((e) => {
    console.error('Image upload failed:', e.message);
    process.exit(1);
  });

  const out = await client.createOrReplace(buildDoc(assetMap));
  console.log(`✓ ${out.title} (${out._id})`);
  console.log('\nSeeded 1 Al Furjan showcase doc.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
