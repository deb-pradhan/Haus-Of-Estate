import {createHash, randomUUID} from 'node:crypto'
import {readFile, writeFile, mkdir, lstat, realpath} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {isDeepStrictEqual} from 'node:util'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backupRoot = path.join(appRoot, '.git/cardiff-commercial-2026-09-21')
const payloadPath = path.join(appRoot, 'scripts/data/cardiff-commercial-2026-09-21.json')
const coverIds = [
  'e47414d1-9e76-47ea-bd1f-f5f779fbbe7d', 'bb71f0a5-7940-4743-8566-3e9dfa092164',
  '5410e3be-c9e0-42f1-8d45-84c69c68e836', 'df3a7fe3-e81c-416f-807d-b994dd543306',
].flatMap(id => [id, `drafts.${id}`])
const sourceSpecs = new Map([
  ['HP-37595-property', {rent: 1250, size: 285, photos: 4}],
  ['HP-37590-property', {rent: 1500, size: 240, photos: 3}],
  ['HP-37584-property', {rent: 2000, size: 325, photos: 2}],
])
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const requireValue = (condition, message) => { if (!condition) throw new Error(message) }
const asJson = value => JSON.stringify(value, null, 2)
const withoutSystemFields = doc => Object.fromEntries(Object.entries(doc).filter(([field]) => !['_id', '_rev', '_createdAt', '_updatedAt'].includes(field)))
const revisions = docs => docs.map(({_id, _rev}) => ({_id, _rev})).sort((a, b) => a._id.localeCompare(b._id))

export function validatePayload(payload) {
  requireValue(payload.version === 1 && payload.projectId === 'jdxbkry4' && payload.dataset === 'production', 'Unexpected Cardiff target or payload version.')
  requireValue(payload.entries?.length === 3, 'Exactly the three matched Cardiff premises are permitted.')
  requireValue(new Set(payload.entries.map(entry => entry.sourceId)).size === 3, 'Duplicate Cardiff source identity.')
  requireValue(new Set(payload.entries.map(entry => entry.slug)).size === 3, 'Duplicate Cardiff slug.')
  for (const entry of payload.entries) {
    const expected = sourceSpecs.get(entry.sourceId)
    requireValue(expected && entry.rentAmount === expected.rent && entry.headlineSqFt === expected.size, `Unreviewed Cardiff source/pricing: ${entry.sourceId}`)
    requireValue(entry.photoUrls?.length === expected.photos && new Set(entry.photoUrls).size === expected.photos, `Wrong image count: ${entry.sourceId}`)
    requireValue(entry.sourceUrl === `https://www.hafrenproperties.co.uk/property/${entry.rentAmount}-pcm-a1-a3-ground-floor-commercial-unit-in-city-road-roath-cardiff-cf24-3bp/`, 'Unexpected source page.')
    requireValue(entry.photoUrls.every(url => /^https:\/\/www\.hafrenproperties\.co\.uk\/wp-content\/uploads\/2026\/04\/[123]-\d+\.jpeg$/.test(url)), 'Unexpected photograph source.')
    requireValue(/^city-road-cardiff-commercial-unit-\d+-sq-ft$/.test(entry.slug), 'Unexpected Cardiff slug.')
    requireValue(entry.title.length <= 140 && ['City Road', 'Tavistock Street'].includes(entry.accessStreet), 'Invalid listing copy.')
  }
}

const paragraph = (key, text) => ({_key: key, _type: 'block', style: 'normal', markDefs: [], children: [{_key: `${key}-text`, _type: 'span', marks: [], text}]})

export function buildDraft(entry) {
  const metric = (entry.headlineSqFt * 0.09290304).toFixed(2)
  const amount = entry.rentAmount.toLocaleString('en-GB')
  return {
    // The trailing dot asks Sanity to generate the actual draft identity.
    _id: 'drafts.', _type: 'property',
    title: entry.title, slug: {_type: 'slug', current: entry.slug},
    community: 'Roath', city: 'Cardiff', country: 'United Kingdom',
    category: 'commercial', availability: ['ready'], listingType: ['rent'], unitType: 'Retail Unit',
    rentAmount: entry.rentAmount, rentCurrency: 'GBP', rentPeriod: 'month',
    rentPriceDisplay: `£${amount} per calendar month`,
    sizeDisplay: `${entry.headlineSqFt} sq ft (approximately ${metric} m²), advertised total`,
    summary: `Ground-floor commercial premises advertised at £${amount} per calendar month in Roath, Cardiff CF24 3BP, with access from ${entry.accessStreet}. Advertised total area: ${entry.headlineSqFt} sq ft. Current availability and letting terms are subject to confirmation.`,
    description: [
      paragraph('premises', `Ground-floor commercial premises in the City Road area of Roath, Cardiff CF24 3BP. Access is from ${entry.accessStreet}. The advertised total area is ${entry.headlineSqFt} sq ft (approximately ${metric} m²).`),
      paragraph('layout', `The agent separately lists a ${entry.shopFloorSqFt} sq ft shop floor and a ${entry.wcSqFt} sq ft WC. These component figures total ${entry.shopFloorSqFt + entry.wcSqFt} sq ft, which differs from the headline area. The measurements and applicable floor-area basis need confirmation.`),
      paragraph('terms', `The advertised rent is £${amount} per calendar month, with a new lease on terms to be agreed. Current availability, condition, fit-out requirements and suitability for the proposed business should be confirmed before proceeding. EPC information, business rates, VAT, deposit and other charges remain to be confirmed.`),
    ],
    keyFeatures: ['Ground-floor commercial premises', `Access from ${entry.accessStreet}`, 'Separate WC', 'New lease terms to be agreed'],
    enquiryEmail: 'info@hausofestate.com', showHausLogo: true,
    status: 'draft', featured: false,
    verification: {
      status: 'unverified', sourceUrl: entry.sourceUrl,
      notes: `H21 source identity ${entry.sourceId}. Matched to Sonia's supplied three-unit screenshot and Hafren's current public advertisement checked 21 September 2026. The public advertisement is not fresh agent confirmation of availability. Source headline ${entry.headlineSqFt} sq ft; source components shop floor ${entry.shopFloorSqFt} sq ft / ${entry.shopFloorSourceSqM} sq m plus WC ${entry.wcSqFt} sq ft / ${entry.wcSourceSqM} sq m. Component total is five sq ft below the headline; preserve both, do not resolve by assumption. Metric total is derived at 0.09290304 m² per sq ft, not a survey measurement. The source says available from 15 May 2026 and advertises A1/A3 uses; permitted use/planning was not independently verified. Source photographs show fit-out work: ready means existing property rather than off-plan, not a claim of finished/ready-to-occupy condition. The source does not identify a street number or Unit A/B/C; do not infer Haus's Unit A office from the shared postcode. No bedrooms, bathrooms, unit number, sale price, active listing state, verification date or publication approval is inferred. Sonia's forwarded instruction authorises preparing these source photos with Haus branding; original images remain intact and showHausLogo enables a separate website overlay. Publication remains separate.`,
    },
    editorialApproval: {contentApproved: false, seoApproved: false, notes: 'Prepared for review only. Reconcile areas and confirm current condition, availability and commercial terms before publication.'},
  }
}

export function assertDraftSafe(doc) {
  requireValue(doc._id === 'drafts.' && doc._type === 'property' && doc.status === 'draft' && doc.featured === false, 'Only new, unfeatured native drafts may be created.')
  requireValue(doc.category === 'commercial' && isDeepStrictEqual(doc.availability, ['ready']) && isDeepStrictEqual(doc.listingType, ['rent']) && doc.unitType === 'Retail Unit', 'Only the reviewed ready commercial rentals are permitted.')
  requireValue(doc.rentCurrency === 'GBP' && doc.rentPeriod === 'month' && doc.rentAmount > 0, 'Complete GBP monthly rental pricing is required.')
  requireValue(doc.title.length <= 140 && doc.summary.length <= 280, 'Listing copy exceeds schema limits.')
  requireValue(doc.verification?.status === 'unverified' && doc.editorialApproval?.contentApproved === false && doc.editorialApproval?.seoApproved === false, 'Approval or verification cannot be inferred.')
  for (const field of ['publishedAt', 'bedrooms', 'bathrooms', 'unitNumber', 'developer', 'priceAmount', 'priceCurrency', 'priceDisplay', 'availabilityCheckedAt', 'listingState', 'completionStatus']) {
    requireValue(!(field in doc), `Unsupported or misleading field: ${field}`)
  }
}

export function assertNoExistingMatches(existing) {
  requireValue(existing.length === 0, 'A matched Cardiff property already exists. Inspect its native draft/published state and receipt; this importer never replaces, patches or blindly recreates it.')
}

async function prepareMedia(payload, execute) {
  const manifestPath = process.env.HAUS_CARDIFF_MEDIA_MANIFEST || path.join(backupRoot, 'media-manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  requireValue(manifest.version === 1 && manifest.entries?.length === 3, 'Expected the reviewed three-property media manifest.')
  if (execute) requireValue(manifest.visualReviewComplete === true, 'Visual media review is required before any upload.')
  const sharp = (await import('sharp')).default
  const assetRoot = await realpath(path.join(backupRoot, 'assets'))
  const output = []
  for (const entry of payload.entries) {
    const media = manifest.entries.find(item => item.sourceId === entry.sourceId)
    requireValue(media?.images.length === entry.photoUrls.length, `Missing matched media: ${entry.sourceId}`)
    requireValue(Number.isInteger(media.featuredIndex) && media.featuredIndex >= 0 && media.featuredIndex < media.images.length, 'Invalid featured image selection.')
    const seenUrls = new Set()
    for (const image of media.images) {
      requireValue(entry.photoUrls.includes(image.sourceUrl) && !seenUrls.has(image.sourceUrl), 'Image belongs to another source or is duplicated.')
      seenUrls.add(image.sourceUrl)
      requireValue(path.isAbsolute(image.path), 'Image path must be absolute.')
      const stat = await lstat(image.path)
      const actualPath = await realpath(image.path)
      const relativePath = path.relative(assetRoot, actualPath)
      requireValue(stat.isFile() && !stat.isSymbolicLink() && relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath), 'Image path escaped the prepared asset directory.')
      const bytes = await readFile(actualPath)
      requireValue(bytes.length === image.bytes && sha256(bytes) === image.sha256, 'Original photo hash/length changed since review.')
      const metadata = await sharp(bytes).metadata()
      requireValue(metadata.format === 'jpeg' && metadata.width === image.width && metadata.height === image.height, 'Original photo dimensions or format changed.')
      requireValue(typeof image.alt === 'string' && image.alt.trim().length > 0, 'Alt text is required.')
      output.push({...image, bytes, sourceId: entry.sourceId, featured: media.images.indexOf(image) === media.featuredIndex})
    }
  }
  return {images: output, visualReviewComplete: manifest.visualReviewComplete === true}
}

export async function main() {
  const execute = process.env.HAUS_CARDIFF_EXECUTE === 'true'
  const sourceBytes = await readFile(payloadPath)
  const payload = JSON.parse(sourceBytes.toString('utf8'))
  validatePayload(payload)
  const drafts = payload.entries.map(buildDraft)
  drafts.forEach(assertDraftSafe)
  const media = await prepareMedia(payload, execute)
  const {getCliClient} = await import('sanity/cli')
  // No automated retry of create-with-generated-ID mutations after an uncertain response.
  const client = getCliClient({projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2025-02-19', useCdn: false, perspective: 'raw', maxRetries: 0})
  requireValue(client.config().token, 'Run through Sanity CLI exec --with-user-token.')
  const params = {slugs: payload.entries.map(entry => entry.slug), urls: payload.entries.map(entry => entry.sourceUrl)}
  const findMatches = () => client.fetch('*[_type == "property" && (slug.current in $slugs || verification.sourceUrl in $urls)]{_id,_rev,title,"slug":slug.current}', params)
  assertNoExistingMatches(await findMatches())
  const getProtected = () => client.fetch('*[_type == "property" || _id in $ids]', {ids: coverIds})
  const before = await getProtected()
  requireValue(coverIds.every(id => before.some(doc => doc._id === id)), 'A protected blog document is missing; inspect before proceeding.')
  requireValue(before.filter(doc => doc._type === 'property' && doc.slug?.current?.startsWith('azizi-florence') && doc._id.startsWith('drafts.')).length === 6, 'Florence draft set changed; inspect before proceeding.')
  const plan = {projectId: payload.projectId, dataset: payload.dataset, execute, visualReviewComplete: media.visualReviewComplete, sourceSha256: sha256(sourceBytes), propertyCount: drafts.length, imageCount: media.images.length, protectedCount: before.length, protectedRevisions: revisions(before), properties: drafts.map(({title, slug, rentAmount, sizeDisplay}) => ({title, slug: slug.current, rentAmount, sizeDisplay}))}
  await mkdir(backupRoot, {recursive: true})
  await writeFile(path.join(backupRoot, 'latest-preflight.json'), asJson(plan))
  // These random IDs only identify local validation records; they are never submitted.
  await writeFile(path.join(backupRoot, 'prepared.validation.ndjson'), drafts.map(doc => JSON.stringify({...doc, _id: `drafts.${randomUUID()}`})).join('\n') + '\n')
  console.log(asJson(plan))
  if (!execute) return

  // A prior or uncertain attempt cannot be silently overwritten, even if its response was lost.
  await writeFile(path.join(backupRoot, 'execution.json'), asJson({startedAt: new Date().toISOString(), plan}), {flag: 'wx'})
  await writeFile(path.join(backupRoot, 'protected-before.json'), asJson(before), {flag: 'wx'})
  const assetMap = new Map()
  const receipt = {projectId: payload.projectId, dataset: payload.dataset, sourceSha256: plan.sourceSha256, assets: [], documents: [], transactionId: null}
  const saveReceipt = () => writeFile(path.join(backupRoot, 'receipt.json'), asJson(receipt))
  await saveReceipt()
  for (const image of media.images) {
    let assetId = assetMap.get(image.sha256)
    if (!assetId) {
      const asset = await client.assets.upload('image', image.bytes, {filename: path.basename(image.path), contentType: 'image/jpeg'})
      assetId = asset._id
      assetMap.set(image.sha256, assetId)
    }
    receipt.assets.push({sourceId: image.sourceId, sourceUrl: image.sourceUrl, sha256: image.sha256, assetId, alt: image.alt, featured: image.featured})
    await saveReceipt()
  }
  for (let index = 0; index < drafts.length; index++) {
    const items = receipt.assets.filter(image => image.sourceId === payload.entries[index].sourceId)
    const makeImage = item => ({_type: 'image', alt: item.alt, asset: {_type: 'reference', _ref: item.assetId}})
    drafts[index].featuredImage = makeImage(items.find(item => item.featured))
    drafts[index].gallery = items.map((item, imageIndex) => ({...makeImage(item), _key: `photo-${imageIndex + 1}`}))
    assertDraftSafe(drafts[index])
  }
  assertNoExistingMatches(await findMatches())
  requireValue(isDeepStrictEqual(revisions(before), revisions(await getProtected())), 'Protected content changed during preflight/upload; stop before creation.')
  await writeFile(path.join(backupRoot, 'submitted-drafts.json'), asJson(drafts), {flag: 'wx'})
  let transaction = client.transaction()
  for (const draft of drafts) transaction = transaction.create(draft)
  const result = await transaction.commit({visibility: 'sync', returnDocuments: false})
  receipt.transactionId = result.transactionId
  receipt.documents = (result.results || []).map(item => ({_id: item.id}))
  await saveReceipt()

  const created = await client.fetch('*[_type == "property" && slug.current in $slugs]', params)
  requireValue(created.length === 3, 'Expected exactly three new native drafts; inspect receipt before any retry.')
  for (const draft of drafts) {
    const actual = created.find(doc => doc.slug?.current === draft.slug.current)
    requireValue(actual?._id.startsWith('drafts.') && actual._id.length > 'drafts.'.length && isDeepStrictEqual(withoutSystemFields(actual), withoutSystemFields(draft)), `Draft read-back mismatch: ${draft.slug.current}`)
  }
  const after = await getProtected()
  const createdIds = new Set(created.map(doc => doc._id))
  requireValue(isDeepStrictEqual(revisions(before), revisions(after.filter(doc => !createdIds.has(doc._id)))), 'Existing content revisions changed; inspect before proceeding.')
  const validAssets = await client.fetch('*[_type == "sanity.imageAsset" && _id in $ids]{_id}', {ids: [...assetMap.values()]})
  requireValue(validAssets.length === assetMap.size, 'An imported image asset did not resolve.')
  receipt.documents = created.map(doc => ({_id: doc._id, slug: doc.slug.current}))
  await saveReceipt()
  await writeFile(path.join(backupRoot, 'created.validation.ndjson'), created.map(doc => JSON.stringify(doc)).join('\n') + '\n')
  await writeFile(path.join(backupRoot, 'verification.json'), asJson({verifiedAt: new Date().toISOString(), draftCount: created.length, publishedUnchanged: true, allExistingRevisionsUnchanged: true, protectedRevisions: revisions(before), documents: receipt.documents, imageAssociations: receipt.assets.length, uniqueImageAssets: assetMap.size}), {flag: 'wx'})
  console.log(asJson({status: 'verified', draftCount: 3, publishedUnchanged: true, imageAssociations: receipt.assets.length, documents: receipt.documents}))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
