#!/usr/bin/env node
/**
 * Prepare/review the seven London + Florence drafts; NEVER publish.
 *
 * Local preflight (no credentials/network):
 * node scripts/prepare-property-publication.mjs --snapshot <full-properties.json>
 *   --london-bundle <directory> --florence-bundle <directory> --output <new-directory>
 *
 * Snapshot shape: {projectId:"jdxbkry4",dataset:"production",documents:[...]}.
 * documents must be the complete raw `*[_type == "property"]` result.
 * Inspect plan.json and review.json. Remove fields from review.json to preserve
 * later CMS edits. Execution requires that exact reviewed snapshot and source.
 *
 * npx sanity exec scripts/prepare-property-publication.mjs --with-user-token --
 *   <same arguments, NEW output directory> --review <review.json> --execute
 *
 * Execution reads Sanity again, uploads verified JPEGs, and changes native drafts
 * only. Every existing draft patch is revision guarded. Approvals, publication,
 * listing state, verification dates and existing featured flags are never set.
 */
import { createHash, randomUUID } from 'node:crypto'
import { lstat, realpath, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

export const PROJECT = Object.freeze({ projectId: 'jdxbkry4', dataset: 'production' })
export const LONDON_SLUG = 'north-london-three-bedroom-property'
export const FLORENCE_IDS = Object.freeze({
  'azizi-florence': 'drafts.9405e5db-9b61-4fd7-bb26-ef4f89eb71c8',
  'azizi-florence-4-bedroom-villas': 'drafts.0f23c71e-459d-4e00-81c3-2dfab801c247',
  'azizi-florence-5-bedroom-villas': 'drafts.413a49b8-c0f4-4e11-8e37-2c42095281cb',
  'azizi-florence-6-bedroom-villas': 'drafts.5c86a687-3e2f-40d9-aa03-7ff580313158',
  'azizi-florence-3-bedroom-townhouses': 'drafts.08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47',
  'azizi-florence-4-bedroom-townhouses': 'drafts.09828cf9-b9d5-409f-8e4a-658fcdaa75a6',
})
const SLUGS = [LONDON_SLUG, ...Object.keys(FLORENCE_IDS)]
const CONTENT_FIELDS = ['title', 'summary', 'description', 'keyFeatures', 'amenities',
  'locationBenefits', 'featuredImage', 'gallery', 'floorPlans', 'designVariants', 'interiorSchemes']
const NEW_FIELDS = [...CONTENT_FIELDS, 'slug', 'community', 'city', 'country', 'category',
  'bedrooms', 'unitType', 'listingType', 'availability', 'priceAmount', 'priceCurrency',
  'priceDisplay', 'sizeDisplay']
const IMAGE_FIELDS = ['_key', '_type', 'alt', 'label', 'caption', 'mediaKind', '_sanityAsset']
const DESIGN_FIELDS = ['_key', 'label', 'family', 'rowHomes', 'position', 'plotAreaStatus',
  'plotAreaSqFt', 'sellableAreaSqFt', 'areaNote', 'summary', 'brochureKey', 'images', 'floorPlans']
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const own = (object, field) => Object.prototype.hasOwnProperty.call(object, field)
const pick = (object, fields) => Object.fromEntries(fields.filter(key => own(object, key)).map(key => [key, object[key]]))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const canonical = value => value === undefined ? { absent: true } : Array.isArray(value)
  ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
export const valueHash = value => sha(JSON.stringify(canonical(value)))
const json = bytes => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''))
const inside = (root, candidate) => {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
}

async function noLinks(filename) {
  for (let current = path.resolve(filename);;) {
    const stat = await lstat(current)
    assert(!stat.isSymbolicLink(), `Linked path is not permitted: ${current}`)
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
}

async function readRegular(filename) {
  await noLinks(filename)
  assert((await lstat(filename)).isFile(), `Expected a regular file: ${filename}`)
  return readFile(filename)
}

export async function validateOutput(output, inputs = []) {
  assert(path.isAbsolute(output), 'Output must be an absolute, new directory outside Git.')
  const parent = path.dirname(path.resolve(output))
  await noLinks(parent)
  assert((await lstat(parent)).isDirectory(), 'Output parent must already exist.')
  let exists = false
  try { await lstat(output); exists = true } catch (error) { if (error.code !== 'ENOENT') throw error }
  assert(!exists, 'Output already exists; use a new directory and preserve previous receipts.')
  for (let current = parent;;) {
    try { await lstat(path.join(current, '.git')); throw new Error('Output must be outside Git.') }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    // Conventional bare repositories also have no .git directory.
    try {
      await lstat(path.join(current, 'HEAD')); await lstat(path.join(current, 'objects'))
      throw new Error('Output must be outside Git.')
    } catch (error) { if (error.code !== 'ENOENT') throw error }
    const next = path.dirname(current)
    if (next === current) break
    current = next
  }
  for (const input of inputs) {
    const resolved = await realpath(input)
    assert(!inside(resolved, output) && !inside(output, resolved), 'Output must not overlap an input.')
  }
  return path.resolve(output)
}

export function sanitizeFields(document, isNew) {
  const result = pick(document, isNew ? NEW_FIELDS : CONTENT_FIELDS)
  const image = value => pick(value, IMAGE_FIELDS)
  if (result.featuredImage) result.featuredImage = image(result.featuredImage)
  for (const key of ['gallery', 'floorPlans']) if (result[key]) result[key] = result[key].map(image)
  if (result.designVariants) result.designVariants = result.designVariants.map(design => ({
    ...pick(design, DESIGN_FIELDS),
    images: (design.images ?? []).map(image), floorPlans: (design.floorPlans ?? []).map(image),
  }))
  if (result.interiorSchemes) result.interiorSchemes = result.interiorSchemes.map(scheme => ({
    ...pick(scheme, ['_key', 'label']), images: (scheme.images ?? []).map(image),
  }))
  return result
}

export function collectImagePaths(value, paths = new Set()) {
  if (!value || typeof value !== 'object') return paths
  if (value._type === 'image') assert(own(value, '_sanityAsset'), 'Prepared images must have a local import reference.')
  if (own(value, '_sanityAsset')) {
    assert(value._type === 'image' && typeof value._sanityAsset === 'string' &&
      value._sanityAsset.startsWith('image@file:'), 'Expected a local prepared image reference.')
    assert(typeof value.alt === 'string' && value.alt.trim(), 'Every prepared image needs alt text.')
    paths.add(path.resolve(fileURLToPath(value._sanityAsset.slice(6))))
  }
  for (const child of Object.values(value)) collectImagePaths(child, paths)
  return paths
}

export async function readBundle(directory, kind) {
  assert(path.isAbsolute(directory), 'Bundle paths must be absolute.')
  await noLinks(directory)
  const root = await realpath(directory)
  const london = kind === 'london'
  const reportBytes = await readRegular(path.join(root, 'preparation-report.json'))
  const report = json(reportBytes)
  assert(report.status === 'complete' && report.schemaVersion === (london ? 3 : 2), 'Unexpected preparation report.')
  assert(report.images?.length === (london ? 6 : 22), 'Unexpected base image count.')
  const images = [...report.images]
  let variantBytes = Buffer.alloc(0)
  if (!london) {
    variantBytes = await readRegular(path.join(root, 'variants.json'))
    const variants = json(variantBytes)
    assert(variants.schemaVersion === 1 && variants.images?.length === 56, 'Expected the 56-image Florence variant bundle.')
    images.push(...variants.images)
  }
  const filename = london ? 'properties.staging-draft.ndjson' : 'properties.variants.staging-draft.ndjson'
  const documentBytes = await readRegular(path.join(root, filename))
  const documents = documentBytes.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).map(JSON.parse)
  const expectedSlugs = london ? [LONDON_SLUG] : Object.keys(FLORENCE_IDS)
  assert(documents.length === expectedSlugs.length && new Set(documents.map(doc => doc.slug?.current)).size === expectedSlugs.length,
    'Unexpected or duplicate prepared documents.')
  for (const document of documents) {
    assert(document._type === 'property' && document._id?.startsWith('drafts.') &&
      document.status === 'draft' && document.featured === false && expectedSlugs.includes(document.slug?.current),
    'Unexpected prepared draft identity or state.')
    assert(!document.publishedAt && !document.editorialApproval, 'Prepared inputs must not carry publication or approval metadata.')
    assert(typeof document.title === 'string' && document.title.trim() && document.title.length <= 140 &&
      typeof document.summary === 'string' && document.summary.trim() && document.summary.length <= 280, 'Invalid title/summary.')
  }
  if (london) {
    assert(documents[0].gallery?.length === 4 && documents[0].floorPlans?.length === 1 &&
      documents[0].featuredImage?.mediaKind === 'concept-comparison', 'Expected the London concept and floor-plan bundle.')
  } else {
    assert(documents.reduce((sum, doc) => sum + (doc.designVariants?.length ?? 0), 0) === 19 &&
      documents.reduce((sum, doc) => sum + (doc.interiorSchemes?.length ?? 0), 0) === 4,
    'Expected nineteen Florence designs and four interior schemes.')
  }
  const verifiedImages = new Map()
  for (const image of images) {
    assert(/^images\/[a-zA-Z0-9._-]+\.jpg$/.test(image.output?.relativePath), 'Unexpected image path.')
    const filename = path.resolve(root, image.output.relativePath)
    assert(inside(root, filename) && !verifiedImages.has(filename), 'Duplicate or escaped image path.')
    const bytes = await readRegular(filename)
    assert(bytes.length === image.output.bytes && sha(bytes) === image.output.sha256, `Image integrity failed: ${image.id}`)
    const metadata = await sharp(bytes, { failOn: 'error' }).metadata()
    assert(metadata.format === 'jpeg' && (metadata.pages ?? 1) === 1 && metadata.width === image.output.width &&
      metadata.height === image.output.height, `JPEG format/dimensions failed: ${image.id}`)
    verifiedImages.set(filename, { filename, bytes, sha256: sha(bytes), id: image.id })
  }
  const refs = collectImagePaths(documents.map(doc => sanitizeFields(doc, true)))
  for (const filename of refs) assert(verifiedImages.has(filename), 'Image reference is outside its verified bundle.')
  return { root, documents, images: verifiedImages, digest: valueHash([sha(reportBytes), sha(variantBytes), sha(documentBytes)]) }
}

function validateSnapshot(snapshot) {
  assert(snapshot?.projectId === PROJECT.projectId && snapshot?.dataset === PROJECT.dataset &&
    Array.isArray(snapshot.documents), 'Snapshot must identify jdxbkry4/production and contain full raw property documents.')
  const ids = new Set()
  for (const doc of snapshot.documents) {
    assert(doc._type === 'property' && typeof doc._id === 'string' && typeof doc._rev === 'string' &&
      !ids.has(doc._id), 'Invalid/duplicate snapshot document; use complete raw documents with revisions.')
    ids.add(doc._id)
  }
}

export function buildPlan(snapshot, bundles) {
  validateSnapshot(snapshot)
  const sources = bundles.flatMap(bundle => bundle.documents)
  assert(sources.length === 7 && new Set(sources.map(doc => doc.slug?.current)).size === 7 &&
    sources.every(doc => SLUGS.includes(doc.slug.current)), 'Exactly London and all six Florence sources are required.')
  const documents = sources.map(source => {
    const slug = source.slug.current
    const matches = snapshot.documents.filter(doc => doc.slug?.current === slug)
    assert(!matches.some(doc => doc._id.startsWith('versions.')), `Release-version document needs manual reconciliation: ${slug}`)
    const drafts = matches.filter(doc => doc._id.startsWith('drafts.'))
    assert(drafts.length <= 1, `Duplicate native drafts: ${slug}`)
    const existing = drafts[0]
    const id = existing?._id ?? 'drafts.property-north-london-three-bedroom'
    assert(matches.every(doc => doc._id === id || doc._id === id.slice(7)), `Conflicting published/source identity: ${slug}`)
    if (FLORENCE_IDS[slug]) {
      assert(existing?._id === FLORENCE_IDS[slug], `Expected existing Florence UUID draft: ${slug}`)
      assert(JSON.stringify(existing.availability) === '["off-plan"]' && JSON.stringify(existing.listingType) === '["sale"]',
        `Reconcile confirmed Florence sale/off-plan classification first: ${slug}`)
      const unitType = slug === 'azizi-florence' ? 'Development' : slug.endsWith('villas') ? 'Villa' : 'Townhouse'
      assert(existing.unitType === unitType, `Reconcile Florence unit type first: ${slug}`)
    } else if (!existing) {
      assert(matches.length === 0 && !snapshot.documents.some(doc => doc._id === id || doc._id === id.slice(7)), 'London identity already exists; reconcile manually.')
      assert(source.unitType === 'Terraced House' && source.bedrooms === 3 && source.priceAmount === 500000 &&
        source.priceCurrency === 'GBP' && JSON.stringify(source.availability) === '["ready"]' &&
        JSON.stringify(source.listingType) === '["sale"]', 'London confirmed details do not match the reviewed bundle.')
    }
    const prepared = sanitizeFields(source, !existing)
    // The approved September CMS content remains authoritative. This sync only
    // adds the October designs; it never rewrites copy/hero/gallery from a local
    // historical bundle. brochureKey is retained inside each design, not as an
    // unsupported top-level property field.
    const fields = FLORENCE_IDS[slug] ? pick(prepared, ['designVariants', 'interiorSchemes']) : prepared
    const changes = Object.entries(fields).filter(([field, after]) => valueHash(existing?.[field]) !== valueHash(after))
      .map(([field, after]) => ({ field, before: existing?.[field] ?? null, after,
        beforeSha256: valueHash(existing?.[field]), afterSha256: valueHash(after) }))
    return { slug, id, expectedRevision: existing?._rev ?? null, isNew: !existing, changes }
  })
  return { schemaVersion: 1, ...PROJECT, snapshotSha256: valueHash(snapshot),
    bundlesSha256: valueHash(bundles.map(bundle => bundle.digest)), documents }
}

export function reviewTemplate(plan) {
  return { ...pick(plan, ['schemaVersion', 'projectId', 'dataset', 'snapshotSha256', 'bundlesSha256']),
    documents: plan.documents.map(doc => ({ ...pick(doc, ['slug', 'id', 'expectedRevision']),
      fields: doc.changes.map(change => pick(change, ['field', 'beforeSha256', 'afterSha256'])) })) }
}

export function selectReviewedChanges(plan, review) {
  for (const key of ['schemaVersion', 'projectId', 'dataset', 'snapshotSha256', 'bundlesSha256']) {
    assert(review?.[key] === plan[key], `Review does not match preflight: ${key}`)
  }
  assert(review.documents?.length === 7 && new Set(review.documents.map(doc => doc.slug)).size === 7, 'Review must identify all seven documents.')
  return plan.documents.map(doc => {
    const approved = review.documents.find(item => item.slug === doc.slug)
    assert(approved?.id === doc.id && approved.expectedRevision === doc.expectedRevision && Array.isArray(approved.fields), 'Review identity/revision mismatch.')
    assert(new Set(approved.fields.map(item => item.field)).size === approved.fields.length, 'Duplicate reviewed fields.')
    const fields = Object.fromEntries(approved.fields.map(item => {
      const change = doc.changes.find(candidate => candidate.field === item.field)
      assert(change && item.beforeSha256 === change.beforeSha256 && item.afterSha256 === change.afterSha256,
        `Reviewed field differs from plan: ${doc.slug}/${item.field}`)
      return [item.field, change.after]
    }))
    assert(!doc.isNew || approved.fields.length === doc.changes.length, 'A new London draft requires every prepared field to be reviewed.')
    return { ...doc, fields }
  })
}

export function resolveImages(value, assetRefs) {
  if (Array.isArray(value)) return value.map(item => resolveImages(item, assetRefs))
  if (!value || typeof value !== 'object') return value
  if (own(value, '_sanityAsset')) {
    const filename = path.resolve(fileURLToPath(value._sanityAsset.slice(6)))
    const ref = assetRefs.get(filename)
    assert(typeof ref === 'string' && /^image-[a-f0-9]+-\d+x\d+-jpg$/.test(ref), 'Missing or invalid uploaded asset reference.')
    const rest = Object.fromEntries(Object.entries(value).filter(([key]) => key !== '_sanityAsset'))
    return { ...rest, asset: { _type: 'reference', _ref: ref } }
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolveImages(child, assetRefs)]))
}

export function assertSnapshotUnchanged(expected, actual) {
  validateSnapshot(actual)
  const revisions = snapshot => snapshot.documents.map(doc => [doc._id, doc._rev]).sort((a, b) => a[0].localeCompare(b[0]))
  assert(valueHash(revisions(expected)) === valueHash(revisions(actual)), 'Sanity changed since the reviewed snapshot; refresh the snapshot and review again.')
}

export async function executeDraftSync(client, snapshot, selected, images, output, save) {
  const before = { ...PROJECT, documents: await client.fetch('*[_type == "property"]') }
  assertSnapshotUnchanged(snapshot, before)
  await save('live-before.json', before)
  const receipt = { ...PROJECT, mode: 'draft-sync-only', state: 'uploading', createdAt: new Date().toISOString(),
    transactionId: randomUUID(), documents: selected.map(doc => pick(doc, ['slug', 'id', 'expectedRevision'])), uploads: [] }
  await save('receipt.json', receipt)
  const refs = new Map()
  for (const filename of collectImagePaths(selected.map(doc => doc.fields))) {
    const image = images.get(filename)
    assert(image, 'Reviewed image was not verified.')
    const asset = await client.assets.upload('image', image.bytes, { filename: path.basename(filename), contentType: 'image/jpeg' })
    refs.set(filename, asset._id)
    receipt.uploads.push({ sha256: image.sha256, assetId: asset._id, filename: path.basename(filename) })
    await save('receipt.json', receipt)
  }
  // Uploads can take time. Recheck all property revisions before any mutation.
  assertSnapshotUnchanged(snapshot, { ...PROJECT, documents: await client.fetch('*[_type == "property"]') })
  let transaction = client.transaction().transactionId(receipt.transactionId)
  const expectedDrafts = []
  for (const doc of selected) {
    if (!doc.isNew && Object.keys(doc.fields).length === 0) continue
    const fields = resolveImages(doc.fields, refs)
    const previous = snapshot.documents.find(item => item._id === doc.id)
    const expected = doc.isNew
      ? { _id: doc.id, _type: 'property', ...fields, status: 'draft', featured: false, verification: { status: 'unverified' } }
      : { ...previous, ...fields, status: 'draft' }
    expectedDrafts.push(expected)
    transaction = doc.isNew ? transaction.create(expected)
      : transaction.patch(doc.id, patch => patch.ifRevisionId(doc.expectedRevision).set({ ...fields, status: 'draft' }))
  }
  await save('expected-drafts.json', expectedDrafts)
  receipt.state = expectedDrafts.length ? 'commit-pending' : 'no-changes'
  await save('receipt.json', receipt)
  if (expectedDrafts.length) {
    const result = await transaction.commit({ visibility: 'sync' })
    receipt.transactionId = result.transactionId
    receipt.state = 'committed-awaiting-verification'
    await save('receipt.json', receipt)
  }
  const after = { ...PROJECT, documents: await client.fetch('*[_type == "property"]') }
  await save('live-after.json', after)
  const changedIds = new Set(expectedDrafts.map(doc => doc._id))
  const stripSystem = doc => Object.fromEntries(Object.entries(doc).filter(([key]) => !['_rev', '_createdAt', '_updatedAt'].includes(key)))
  for (const expected of expectedDrafts) {
    const actual = after.documents.find(doc => doc._id === expected._id)
    assert(actual && valueHash(stripSystem(actual)) === valueHash(stripSystem(expected)), `Draft verification failed: ${expected._id}`)
  }
  assertSnapshotUnchanged({ ...before, documents: before.documents.filter(doc => !changedIds.has(doc._id)) },
    { ...after, documents: after.documents.filter(doc => !changedIds.has(doc._id)) })
  receipt.state = 'verified'
  receipt.publishedPropertiesUnchanged = true
  await save('receipt.json', receipt)
  return { output, state: receipt.state, draftsChanged: expectedDrafts.length, imagesUploaded: refs.size, publishedPropertiesUnchanged: true }
}

export function parseArgs(args) {
  const options = { execute: false }
  const names = { '--snapshot': 'snapshot', '--london-bundle': 'londonBundle', '--florence-bundle': 'florenceBundle', '--output': 'output', '--review': 'review' }
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--') continue
    if (arg === '--execute') { assert(!options.execute, 'Duplicate --execute.'); options.execute = true; continue }
    assert(names[arg] && !options[names[arg]] && args[index + 1] && !args[index + 1].startsWith('--'), `Unknown, duplicate or incomplete option: ${arg}`)
    options[names[arg]] = args[++index]
  }
  for (const key of ['snapshot', 'londonBundle', 'florenceBundle', 'output']) assert(options[key] && path.isAbsolute(options[key]), `Provide absolute --${key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())}.`)
  assert(!options.execute || options.review && path.isAbsolute(options.review), '--execute requires an absolute --review path.')
  return options
}

export async function run(options) {
  const snapshot = json(await readRegular(options.snapshot))
  const bundles = [await readBundle(options.londonBundle, 'london'), await readBundle(options.florenceBundle, 'florence')]
  const plan = buildPlan(snapshot, bundles)
  const review = options.review ? json(await readRegular(options.review)) : reviewTemplate(plan)
  const selected = selectReviewedChanges(plan, review)
  const output = await validateOutput(options.output, [options.snapshot, options.londonBundle, options.florenceBundle, ...(options.review ? [options.review] : [])])
  await mkdir(output)
  const save = (name, value) => writeFile(path.join(output, name), JSON.stringify(value, null, 2) + '\n')
  await save('snapshot.json', snapshot)
  await save('plan.json', plan)
  await save('review.json', review)
  if (!options.execute) return { mode: 'local-preflight-only', output, documents: plan.documents.map(doc => ({ slug: doc.slug, id: doc.id, fields: doc.changes.map(change => change.field) })) }
  // No client/token is loaded at all during local preflight or module import.
  const { getCliClient } = await import('sanity/cli')
  const client = getCliClient({ ...PROJECT, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw' })
  assert(client.config().token, 'Execute using Sanity CLI exec --with-user-token.')
  try {
    return await executeDraftSync(client, snapshot, selected, new Map(bundles.flatMap(bundle => [...bundle.images])), output, save)
  } catch (error) {
    await save('failure.json', { message: error.message, occurredAt: new Date().toISOString(),
      recovery: 'Do not retry blindly. Read receipt.json, live-before.json and any live-after.json; inspect the transaction and current drafts before a new snapshot/review.' })
    throw error
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(parseArgs(process.argv.slice(2))).then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}
