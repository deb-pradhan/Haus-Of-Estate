import {createHash, randomUUID} from 'node:crypto'
import {readFile, writeFile, mkdir, realpath, lstat} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {isDeepStrictEqual} from 'node:util'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evidence = path.join(appRoot, '.git/manchester-sherrington-2026-09-21')
const sourceUrl = 'https://www.rightmove.co.uk/properties/93277344'
const slug = 'sherrington-street-manchester-two-bedroom-terraced-house'
const check = (ok, message) => { if (!ok) throw new Error(message) }
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const save = (name, value, options) => writeFile(path.join(evidence, name), JSON.stringify(value, null, 2), options)
const revisions = docs => docs.map(({_id, _rev}) => ({_id, _rev})).sort((a, b) => a._id.localeCompare(b._id))
const content = doc => Object.fromEntries(Object.entries(doc).filter(([key]) => !['_id', '_rev', '_createdAt', '_updatedAt'].includes(key)))

export function validatePayload(payload) {
  check(payload.version === 1 && payload.projectId === 'jdxbkry4' && payload.dataset === 'production' && payload.sourceUrl === sourceUrl, 'Unexpected Manchester source/target.')
  const doc = payload.document
  check(doc?._type === 'property' && doc.slug?.current === slug && !('_id' in doc), 'Expected a new Manchester document without a supplied identity.')
  check(doc.status === 'draft' && doc.featured === false && doc.showHausLogo === true, 'Only an unfeatured, unpublished draft is allowed.')
  check(doc.editorialApproval?.contentApproved === false && doc.editorialApproval?.seoApproved === false && doc.verification?.status === 'unverified' && doc.verification.sourceUrl === sourceUrl, 'Cannot infer verification or approval.')
  check(doc.priceAmount === 219995 && doc.priceCurrency === 'GBP' && doc.priceDisplay === '£219,995', 'Price must follow the reviewed Sonia instruction.')
  check(doc.category === 'residential' && doc.unitType === 'Terraced House' && doc.city === 'Manchester' && doc.country === 'United Kingdom', 'Wrong property classification/location.')
  check(isDeepStrictEqual(doc.availability, ['ready']) && isDeepStrictEqual(doc.listingType, ['sale']) && doc.bedrooms === 2 && doc.bathrooms === 1, 'Wrong property facts.')
  check(doc.title.length <= 140 && doc.summary.length <= 280 && doc.verification.notes.includes('195,000'), 'Missing source conflict or invalid copy.')
  for (const field of ['publishedAt', 'completionStatus', 'availabilityCheckedAt', 'listingState', 'featuredImage', 'gallery']) check(!(field in doc), `Unreviewed field: ${field}`)
  check(payload.photos?.length === 18 && new Set(payload.photos.map(photo => photo.sourceUrl)).size === 18, 'Expected eighteen reviewed original photographs.')
  for (const photo of payload.photos) {
    check(/^https:\/\/media\.rightmove\.co\.uk\/property-photo\/[a-f0-9]+\/93277344\/[a-f0-9]+\.jpeg$/.test(photo.sourceUrl), 'Unexpected photo source.')
    check(!photo.sourceUrl.includes('86c05e1f8adda26ecda688214b4a7555'), 'Neighbour number 20 cannot be included as the property photograph.')
    check(typeof photo.alt === 'string' && photo.alt.trim().length > 0, 'Descriptive alt text required.')
  }
}

export function assertNoExistingMatches(matches) {
  check(matches.length === 0, 'A Manchester match already exists. Inspect receipt/native drafts; never overwrite or blindly recreate.')
}

async function reviewMedia(payload, execute) {
  const manifest = JSON.parse(await readFile(path.join(evidence, 'media-manifest.json'), 'utf8'))
  check(manifest.version === 1 && manifest.images?.length === 18, 'Missing reviewed media manifest.')
  if (execute) check(manifest.visualReviewComplete === true, 'Visual review must be complete before upload.')
  check(manifest.images.filter(image => image.featured).length === 1 && manifest.images.find(image => image.featured).sourceUrl.includes('43ef5dfbb9ac6cfb0ef379f7ec336e80'), 'Only the reviewed red-brick house may be the hero.')
  const sharp = (await import('sharp')).default
  const root = await realpath(path.join(evidence, 'assets'))
  const seen = new Set()
  const images = []
  for (const image of manifest.images) {
    check(payload.photos.some(photo => photo.sourceUrl === image.sourceUrl && photo.alt === image.alt) && !seen.has(image.sourceUrl), 'Unexpected/duplicate photo or altered alt text.')
    seen.add(image.sourceUrl)
    const actualPath = await realpath(image.path)
    const relative = path.relative(root, actualPath)
    const stat = await lstat(image.path)
    check(path.isAbsolute(image.path) && stat.isFile() && !stat.isSymbolicLink() && relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Photo escaped its source directory.')
    const bytes = await readFile(actualPath)
    check(bytes.length === image.bytes && hash(bytes) === image.sha256, 'Reviewed original photo changed.')
    const metadata = await sharp(bytes).metadata()
    check(metadata.format === 'jpeg' && metadata.width === image.width && metadata.height === image.height, 'Original photo dimensions/format changed.')
    images.push({...image, bytes})
  }
  return images
}

export async function main() {
  const execute = process.env.HAUS_MANCHESTER_EXECUTE === 'true'
  const payloadBytes = await readFile(path.join(appRoot, 'scripts/data/manchester-sherrington-2026-09-21.json'))
  const payload = JSON.parse(payloadBytes.toString('utf8'))
  validatePayload(payload)
  const images = await reviewMedia(payload, execute)
  const {getCliClient} = await import('sanity/cli')
  const client = getCliClient({projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2025-02-19', useCdn: false, perspective: 'raw', maxRetries: 0})
  check(client.config().token, 'Run with Sanity CLI exec --with-user-token.')
  const matches = () => client.fetch('*[_type == "property" && (slug.current == $slug || verification.sourceUrl == $url || title match "*Sherrington*" || pt::text(description) match "*Sherrington*")]{_id,_rev,title}', {slug, url: sourceUrl})
  assertNoExistingMatches(await matches())
  const readProtected = () => client.fetch('*[_type in ["property", "post"]]')
  const before = await readProtected()
  check(before.filter(doc => doc._id.startsWith('drafts.') && doc.slug?.current?.startsWith('azizi-florence')).length === 6, 'Florence draft set changed; inspect.')
  check(before.filter(doc => doc._id.startsWith('drafts.') && doc.slug?.current?.startsWith('city-road-cardiff-commercial-unit-')).length === 3, 'Cardiff draft set changed; inspect.')
  const plan = {projectId: 'jdxbkry4', dataset: 'production', execute, sourceSha256: hash(payloadBytes), title: payload.document.title, price: 219995, imageCount: images.length, protectedCount: before.length, protectedRevisions: revisions(before)}
  await mkdir(evidence, {recursive: true})
  await save('latest-preflight.json', plan)
  // Temporary local validation identity only; never submitted to Sanity.
  await writeFile(path.join(evidence, 'prepared.validation.ndjson'), JSON.stringify({...payload.document, _id: `drafts.${randomUUID()}`}) + '\n')
  console.log(JSON.stringify({execute, imageCount: images.length, protectedCount: before.length, title: plan.title}))
  if (!execute) return

  await save('execution.json', {startedAt: new Date().toISOString(), plan}, {flag: 'wx'})
  await save('protected-before.json', before, {flag: 'wx'})
  const receipt = {sourceSha256: plan.sourceSha256, assets: [], documents: [], transactionId: null}
  await save('receipt.json', receipt)
  for (const image of images) {
    const asset = await client.assets.upload('image', image.bytes, {filename: path.basename(image.path), contentType: 'image/jpeg'})
    receipt.assets.push({sourceUrl: image.sourceUrl, assetId: asset._id, sha256: image.sha256, alt: image.alt, featured: image.featured})
    await save('receipt.json', receipt)
  }
  const toImage = item => ({_type: 'image', asset: {_type: 'reference', _ref: item.assetId}, alt: item.alt})
  // The trailing dot requests a Sanity-generated native draft identity.
  const draft = {...payload.document, _id: 'drafts.', featuredImage: toImage(receipt.assets.find(item => item.featured)), gallery: receipt.assets.map((item, index) => ({...toImage(item), _key: `photo-${index + 1}`}))}
  assertNoExistingMatches(await matches())
  check(isDeepStrictEqual(revisions(before), revisions(await readProtected())), 'Existing content changed during upload; inspect before creating.')
  await save('submitted-draft.json', draft, {flag: 'wx'})
  const result = await client.transaction().create(draft).commit({visibility: 'sync', returnDocuments: false})
  receipt.transactionId = result.transactionId
  receipt.documents = (result.results || []).map(item => ({_id: item.id}))
  await save('receipt.json', receipt)
  const created = await client.fetch('*[_type == "property" && slug.current == $slug]', {slug})
  check(created.length === 1 && created[0]._id.startsWith('drafts.') && created[0]._id.length > 7, 'Expected one native draft only; inspect receipt before any retry.')
  check(isDeepStrictEqual(content(created[0]), content(draft)), 'Saved content differs from reviewed draft.')
  const after = await readProtected()
  check(isDeepStrictEqual(revisions(before), revisions(after.filter(doc => doc._id !== created[0]._id))), 'Existing property/blog revisions changed; inspect.')
  const assets = await client.fetch('*[_type == "sanity.imageAsset" && _id in $ids]{_id}', {ids: receipt.assets.map(item => item.assetId)})
  check(assets.length === new Set(receipt.assets.map(item => item.assetId)).size, 'An imported image reference does not resolve.')
  receipt.documents = [{_id: created[0]._id, slug}]
  await save('receipt.json', receipt)
  await writeFile(path.join(evidence, 'created.validation.ndjson'), JSON.stringify(created[0]) + '\n')
  const verification = {verifiedAt: new Date().toISOString(), draftCount: 1, publishedCount: 0, protectedCount: before.length, allExistingRevisionsUnchanged: true, imageCount: 18, documents: receipt.documents, transactionId: receipt.transactionId}
  await save('verification.json', verification, {flag: 'wx'})
  console.log(JSON.stringify(verification))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
