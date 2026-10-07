import {createHash, randomUUID} from 'node:crypto'
import {readFile, writeFile, mkdir, lstat, realpath} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

// Run with `sanity exec scripts/import-florence-drafts.mjs --with-user-token`.
// HAUS_FLORENCE_IMPORT_BUNDLE selects the reviewed local preparation directory.
// Read-only by default; HAUS_FLORENCE_IMPORT_EXECUTE=true permits draft creation.
const projectId = 'jdxbkry4'
const dataset = 'production'
const slugs = [
  'azizi-florence', 'azizi-florence-4-bedroom-villas',
  'azizi-florence-5-bedroom-villas', 'azizi-florence-6-bedroom-villas',
  'azizi-florence-3-bedroom-townhouses', 'azizi-florence-4-bedroom-townhouses',
]
const execute = process.env.HAUS_FLORENCE_IMPORT_EXECUTE === 'true'
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

async function run() {
  const configured = process.env.HAUS_FLORENCE_IMPORT_BUNDLE
  requireValue(configured && path.isAbsolute(configured), 'Set HAUS_FLORENCE_IMPORT_BUNDLE to the reviewed bundle directory.')
  const root = await realpath(configured)
  const report = JSON.parse(await readFile(path.join(root, 'preparation-report.json'), 'utf8'))
  requireValue(report.schemaVersion === 2 && report.status === 'complete', 'Expected a complete v2 preparation report.')
  requireValue(report.documents.length === 6 && report.images.length === 22, 'Expected six Florence entries and 22 prepared images.')
  const documentBytes = await readFile(path.join(root, 'properties.staging-draft.ndjson'))
  const sourceDocs = documentBytes.toString('utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  requireValue(sourceDocs.length === 6, 'Expected exactly six prepared documents.')
  requireValue(new Set(sourceDocs.map(doc => doc.slug?.current)).size === 6, 'Duplicate source slugs.')
  for (const doc of sourceDocs) {
    requireValue(doc._type === 'property' && doc._id?.startsWith('drafts.') &&
      doc.status === 'draft' && doc.featured === false && slugs.includes(doc.slug?.current), 'Unexpected or non-draft document.')
    requireValue(doc.summary?.length <= 280 && doc.title?.length <= 140, `Copy exceeds schema limits: ${doc.slug.current}`)
    requireValue(!doc.publishedAt, 'Publication metadata is not permitted in this import.')
  }

  // Verify all images before any upload. Keep source filenames and absolute paths local.
  const imagesByPath = new Map()
  for (const image of report.images) {
    const relativePath = image.output?.relativePath
    requireValue(/^images\/[a-zA-Z0-9._-]+\.jpg$/.test(relativePath), 'Unexpected image path.')
    const filename = path.resolve(root, relativePath)
    const info = await lstat(filename)
    requireValue(info.isFile() && !info.isSymbolicLink() &&
      (await realpath(filename)) === filename && filename.startsWith(root + path.sep), 'Image path escaped the reviewed bundle.')
    const bytes = await readFile(filename)
    requireValue(bytes.length === image.output.bytes && sha256(bytes) === image.output.sha256, `Image integrity failed: ${image.id}`)
    imagesByPath.set(filename, {id: image.id, filename, bytes, sha256: image.output.sha256})
  }
  for (const doc of sourceDocs) {
    for (const image of [doc.featuredImage, ...(doc.gallery ?? [])]) {
      requireValue(image?._type === 'image' && typeof image.alt === 'string' &&
        image._sanityAsset?.startsWith('image@file:'), `Missing prepared image: ${doc.title}`)
      requireValue(imagesByPath.has(fileURLToPath(image._sanityAsset.slice('image@'.length))), 'Image reference is outside the verified image set.')
    }
  }

  const client = getCliClient({projectId, dataset, apiVersion: '2025-02-19', useCdn: false, perspective: 'raw'})
  requireValue(client.config().token, 'Run using Sanity CLI exec --with-user-token after sanity login.')
  const existing = await client.fetch('*[_type == "property" && slug.current in $slugs]{_id,_rev,title,"slug":slug.current}', {slugs})
  const publishedBefore = await client.fetch('*[_type == "property" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{_id,_rev}')
  const backupDirectory = path.join(appRoot, '.git', 'florence-sanity-import-2026-09-14')
  let prior
  try { prior = JSON.parse(await readFile(path.join(backupDirectory, 'receipt.json'), 'utf8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (existing.length) {
    const importedIds = new Set(prior?.documents?.map(doc => doc._id) ?? [])
    requireValue(existing.length === 6 && existing.every(doc => importedIds.has(doc._id) && doc._id.startsWith('drafts.')),
      'Florence records already exist. Inspect them before changing or creating anything; this importer never replaces existing documents.')
    console.log(JSON.stringify({projectId, dataset, status: 'already-imported', documents: existing}, null, 2))
    return
  }
  const plan = {projectId, dataset, execute, documentCount: sourceDocs.length, imageCount: imagesByPath.size,
    imageBytes: [...imagesByPath.values()].reduce((sum, image) => sum + image.bytes.length, 0),
    documentSha256: sha256(documentBytes), documents: sourceDocs.map(doc => ({title: doc.title, slug: doc.slug.current})),
    publishedPropertyCount: publishedBefore.length}
  console.log(JSON.stringify(plan, null, 2))
  if (!execute) return

  await mkdir(backupDirectory, {recursive: true})
  await writeFile(path.join(backupDirectory, 'preflight.json'), JSON.stringify({plan, publishedBefore}, null, 2))
  await writeFile(path.join(backupDirectory, 'source.ndjson'), documentBytes)
  const assetRefs = new Map()
  for (const image of imagesByPath.values()) {
    const asset = await client.assets.upload('image', image.bytes, {filename: path.basename(image.filename), contentType: 'image/jpeg'})
    assetRefs.set(image.filename, asset._id)
    console.log(`Uploaded ${image.id} (${assetRefs.size}/${imagesByPath.size})`)
  }
  function importImage(image) {
    const {_sanityAsset, ...fields} = image
    return {...fields, asset: {_type: 'reference', _ref: assetRefs.get(fileURLToPath(_sanityAsset.slice('image@'.length)))}}
  }
  const docs = sourceDocs.map(doc => ({...doc,
    // Native draft IDs use random UUIDs; source identifiers remain only in the local receipt.
    _id: `drafts.${randomUUID()}`,
    featuredImage: importImage(doc.featuredImage), gallery: doc.gallery.map(importImage),
  }))
  const receipt = {projectId, dataset, createdAt: new Date().toISOString(), documentSha256: plan.documentSha256,
    documents: docs.map((doc, index) => ({_id: doc._id, sourceId: sourceDocs[index]._id, slug: doc.slug.current, title: doc.title})),
    assetIds: [...assetRefs.values()], transactionId: null}
  // Save generated identities before commit, so an uncertain response is recoverable.
  await writeFile(path.join(backupDirectory, 'receipt.json'), JSON.stringify(receipt, null, 2))
  const transaction = client.transaction()
  for (const doc of docs) transaction.create(doc)
  const result = await transaction.commit({visibility: 'sync'})
  receipt.transactionId = result.transactionId
  await writeFile(path.join(backupDirectory, 'receipt.json'), JSON.stringify(receipt, null, 2))
  const verified = await client.fetch('*[_id in $ids]{_id,_rev,title,status,featured,"slug":slug.current,"hero":featuredImage.asset->._id,"gallery":gallery[].asset->._id}', {ids: docs.map(doc => doc._id)})
  requireValue(verified.length === 6 && verified.every(doc => doc._id.startsWith('drafts.') && doc.status === 'draft' &&
    doc.featured === false && doc.hero && doc.gallery.length > 0 && doc.gallery.every(Boolean)), 'Post-import draft/image verification failed.')
  const publishedAfter = await client.fetch('*[_type == "property" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{_id,_rev}')
  const sort = rows => [...rows].sort((a, b) => a._id.localeCompare(b._id))
  requireValue(JSON.stringify(sort(publishedBefore)) === JSON.stringify(sort(publishedAfter)), 'Published property records changed during the import; inspect before continuing.')
  await writeFile(path.join(backupDirectory, 'verification.json'), JSON.stringify({verified, publishedUnchanged: true}, null, 2))
  console.log(JSON.stringify({status: 'verified', draftCount: verified.length, imageCount: assetRefs.size,
    publishedUnchanged: true, documents: receipt.documents}, null, 2))
}

run().catch(error => { console.error(error.message); process.exitCode = 1 })
