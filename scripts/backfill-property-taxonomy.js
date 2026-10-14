// Inspect or backfill the property taxonomy fields without overwriting editor
// changes. The default mode is read-only. Writes require --apply, a Sanity
// write token, and an additional confirmation when targeting production.
//
// Required configuration (environment variables or CLI flags):
//   NEXT_PUBLIC_SANITY_PROJECT_ID / --project-id <id>
//   NEXT_PUBLIC_SANITY_DATASET    / --dataset <name>
//
// Optional read-only configuration:
//   SANITY_API_READ_TOKEN (needed only for private datasets)
//
// Apply mode:
//   SANITY_WRITE_TOKEN=<token> node scripts/backfill-property-taxonomy.js --apply
//
// Production apply mode (after backup and live-schema comparison):
//   SANITY_WRITE_TOKEN=<token> node scripts/backfill-property-taxonomy.js \
//     --apply --confirm-production

const API_VERSION = process.env.SANITY_API_VERSION || '2026-02-01';

// These values describe the two known showcase documents. Review the source
// data with Marketing before applying them to any dataset.
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

function printHelp() {
  console.log(`Usage:
  node scripts/backfill-property-taxonomy.js [options]

Options:
  --project-id <id>       Override NEXT_PUBLIC_SANITY_PROJECT_ID
  --dataset <name>        Override NEXT_PUBLIC_SANITY_DATASET
  --apply                 Apply setIfMissing patches (default: dry-run)
  --confirm-production    Required with --apply when dataset is production
  --help                  Show this help

The script never replaces a field that already exists.`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    confirmProduction: false,
    projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--apply') {
      options.apply = true;
      continue;
    }

    if (argument === '--confirm-production') {
      options.confirmProduction = true;
      continue;
    }

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (argument === '--project-id' || argument === '--dataset') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value.`);
      }

      if (argument === '--project-id') options.projectId = value;
      if (argument === '--dataset') options.dataset = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

function validateOptions(options) {
  if (!options.projectId) {
    throw new Error(
      'Set NEXT_PUBLIC_SANITY_PROJECT_ID (or SANITY_PROJECT_ID), or pass --project-id.',
    );
  }

  if (!options.dataset) {
    throw new Error(
      'Set NEXT_PUBLIC_SANITY_DATASET (or SANITY_DATASET), or pass --dataset.',
    );
  }

  if (!/^[a-z0-9-]+$/i.test(options.projectId)) {
    throw new Error('The configured Sanity project ID is invalid.');
  }

  if (!/^[a-z0-9_-]+$/i.test(options.dataset)) {
    throw new Error('The configured Sanity dataset name is invalid.');
  }

  if (!options.apply) return;

  if (!process.env.SANITY_WRITE_TOKEN) {
    throw new Error('SANITY_WRITE_TOKEN is required with --apply.');
  }

  if (options.dataset.toLowerCase() === 'production' && !options.confirmProduction) {
    throw new Error(
      'Production writes are blocked. After backup, comparison, and approval, rerun with --apply --confirm-production.',
    );
  }
}

function missingFields(document, expected) {
  return Object.fromEntries(
    Object.entries(expected).filter(([field]) => !Object.prototype.hasOwnProperty.call(document, field)),
  );
}

function summarise(fields) {
  return Object.entries(fields)
    .map(([field, value]) => `${field}=${JSON.stringify(value)}`)
    .join(', ');
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  try {
    validateOptions(options);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const token = options.apply
    ? process.env.SANITY_WRITE_TOKEN
    : process.env.SANITY_API_READ_TOKEN ||
      process.env.SANITY_READ_TOKEN ||
      process.env.SANITY_WRITE_TOKEN;

  const { createClient } = await import('@sanity/client');
  const client = createClient({
    projectId: options.projectId,
    dataset: options.dataset,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
  });

  console.log(
    `${options.apply ? 'APPLY' : 'DRY-RUN'}: project=${options.projectId}, dataset=${options.dataset}`,
  );

  let changeCount = 0;

  for (const { _id, ...expected } of BACKFILL) {
    let document;
    try {
      document = await client.getDocument(_id);
    } catch (error) {
      throw new Error(`Could not read ${_id}: ${error.message}`);
    }

    if (!document) {
      console.warn(`SKIP ${_id}: document not found`);
      continue;
    }

    const fields = missingFields(document, expected);
    if (Object.keys(fields).length === 0) {
      console.log(`UNCHANGED ${_id}: all target fields already exist`);
      continue;
    }

    changeCount += 1;
    if (!options.apply) {
      console.log(`WOULD SET ${_id}: ${summarise(fields)}`);
      continue;
    }

    const result = await client.patch(_id).setIfMissing(fields).commit();
    console.log(`UPDATED ${result._id}: ${summarise(fields)}`);
  }

  if (!options.apply) {
    console.log(`Dry-run complete. ${changeCount} document(s) would be updated; no writes were made.`);
    return;
  }

  console.log(`Apply complete. ${changeCount} document(s) required a patch.`);
}

main().catch((error) => {
  console.error(`Backfill failed: ${error.message}`);
  process.exitCode = 1;
});
