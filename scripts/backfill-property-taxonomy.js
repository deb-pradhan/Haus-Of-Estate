// Backfill the property taxonomy fields (category / availability / listingType)
// onto the two live showcase documents, WITHOUT overwriting anything an editor
// may already have set. Uses `setIfMissing`, so it is safe to re-run.
//
// Two modes:
//   1. With SANITY_WRITE_TOKEN set -> patches the live documents via the API.
//   2. Without a token             -> prints the manual instructions and exits.
//
// This script never prints the token value.
//
// Usage (token mode):
//   SANITY_WRITE_TOKEN=... node scripts/backfill-property-taxonomy.js

const { createClient } = require('@sanity/client');

const TOKEN = process.env.SANITY_WRITE_TOKEN;

// The two live per-development showcases. Both are residential, ready+off-plan
// and sale-only. `setIfMissing` guards against clobbering editor changes.
const BACKFILL = [
  {
    _id: 'property-al-furjan',
    category: 'residential',
    availability: ['ready', 'off-plan'],
    listingType: ['sale'],
  },
  {
    _id: 'property-monaco-mansions',
    category: 'residential',
    availability: ['ready', 'off-plan'],
    listingType: ['sale'],
  },
];

if (!TOKEN) {
  console.log('No SANITY_WRITE_TOKEN set — nothing was written.\n');
  console.log('This script backfills these fields on the live documents when unset:');
  for (const doc of BACKFILL) {
    console.log(
      `  • ${doc._id}: category=${doc.category}, availability=[${doc.availability.join(
        ', ',
      )}], listingType=[${doc.listingType.join(', ')}]`,
    );
  }
  console.log('\nTo apply, run with a write token (do not commit it):');
  console.log('  SANITY_WRITE_TOKEN=<your-token> node scripts/backfill-property-taxonomy.js');
  console.log(
    '\nCreate a token at https://www.sanity.io/manage → project → API → Tokens (Editor role).',
  );
  process.exit(0);
}

const client = createClient({
  projectId: 'jdxbkry4',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
});

(async () => {
  const me = await client.request({ uri: '/users/me' }).catch((e) => {
    console.error('Token check failed:', e.message);
    process.exit(1);
  });
  console.log(`Authenticated as: ${me?.name || me?.email || me?.id}`);

  for (const { _id, ...fields } of BACKFILL) {
    // Only touch documents that already exist; skip cleanly otherwise.
    const existing = await client.getDocument(_id).catch(() => null);
    if (!existing) {
      console.warn(`  ⚠ ${_id} not found — skipped`);
      continue;
    }
    const result = await client
      .patch(_id)
      .setIfMissing(fields)
      .commit();
    console.log(
      `  ✓ ${_id}: category=${result.category}, availability=[${(result.availability || []).join(
        ', ',
      )}], listingType=[${(result.listingType || []).join(', ')}]`,
    );
  }

  console.log('\nBackfill complete.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
