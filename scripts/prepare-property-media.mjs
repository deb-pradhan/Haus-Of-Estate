#!/usr/bin/env node
/**
 * Local-only preparation. This module neither imports a Sanity client nor reads
 * environment credentials. The generated draft still requires editorial review.
 */
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  lstat, stat, realpath, readFile, writeFile, mkdir, link, unlink,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

export const UNCONFIRMED_DRAFT_FIELDS = Object.freeze([
  'priceDisplay', 'rentPriceDisplay', 'priceAmount', 'priceCurrency', 'currency',
  'rentAmount', 'rentCurrency', 'rentPeriod', 'sizeDisplay', 'plotSizeDisplay',
  'paymentPlan', 'bedrooms', 'bathrooms', 'unitType', 'unitNumber', 'availability',
  'listingType', 'completionStatus', 'listingState', 'completionDate',
  'handoverDate', 'publishedAt', 'availabilityCheckedAt', 'availabilityCheckDueAt',
  'editorialApproval', 'approvals', 'approvedAt', 'approvedBy',
])

const HELP = [
  'Prepare verified property images and native Sanity drafts locally.',
  '',
  'node scripts/prepare-property-media.mjs',
  '  --manifest <v1-or-v2.json> --draft <matching-documents.ndjson>',
  '  --source-root <local-source-directory> --brochure <local.pdf>',
  '  --output <new-local-directory>',
  '',
  'The output parent must already exist. Output must be outside Git repositories,',
  'the source directory and the brochure directory. Existing output is refused.',
  'No upload, publication, database access or brochure copy is performed.',
  'V1 produces property.staging-draft.ndjson; V2 produces properties.staging-draft.ndjson.',
  'V2 input must contain exactly every manifest document, with no extras or duplicates.',
  'Generated file URLs refer to this output location; regenerate after moving it.',
].join('\n')

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0
}

function shaValid(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function portableSourcePath(value) {
  return nonempty(value) && !/[\\:\u0000-\u001f]/.test(value) &&
    !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) &&
    value.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
}

function safeOutputFile(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]*\.jpg$/.test(value) &&
    !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(value)
}

export function validateManifest(manifest) {
  requireValue([1, 2].includes(manifest?.schemaVersion), 'Unsupported manifest schemaVersion.')
  if (manifest.schemaVersion === 1) {
    validateDocumentIdentity({ ...manifest.project, title: manifest.project?.name })
  }
  const brochure = manifest.brochure
  requireValue(portableSourcePath(brochure?.sourcePath) && shaValid(brochure?.sha256) &&
    positiveInteger(brochure?.bytes) && positiveInteger(brochure?.pageCount),
  'Manifest brochure path, SHA256, byte size and page count are required.')
  requireValue(Array.isArray(manifest.images) && manifest.images.length > 0,
    'Manifest must contain images.')
  const ids = new Set()
  const outputs = new Set()
  const sources = new Set()
  let heroCount = 0
  const galleryOrders = []
  for (const image of manifest.images) {
    requireValue(typeof image.id === 'string' && /^[a-zA-Z0-9_-]{1,96}$/.test(image.id),
      'Each image needs a safe, stable id.')
    requireValue(!ids.has(image.id), 'Duplicate image id: ' + image.id)
    ids.add(image.id)
    requireValue(safeOutputFile(image.outputFile), 'Unsafe outputFile: ' + image.outputFile)
    requireValue(!outputs.has(image.outputFile), 'Duplicate outputFile: ' + image.outputFile)
    outputs.add(image.outputFile)
    requireValue(portableSourcePath(image.sourcePath), 'Unsafe sourcePath: ' + image.sourcePath)
    requireValue(/\.(jpe?g|png)$/i.test(image.sourcePath), 'Source must be JPEG or PNG: ' + image.id)
    requireValue(!sources.has(image.sourcePath.toLowerCase()), 'Duplicate sourcePath: ' + image.sourcePath)
    sources.add(image.sourcePath.toLowerCase())
    requireValue(nonempty(image.alt), 'Nonempty alt text is required: ' + image.id)
    requireValue(shaValid(image.sha256) && positiveInteger(image.bytes) &&
      positiveInteger(image.width) && positiveInteger(image.height),
    'Invalid source hash, byte size or dimensions: ' + image.id)
    requireValue(Array.isArray(image.brochurePages) &&
      image.brochurePages.every((page) => positiveInteger(page) && page <= brochure.pageCount),
    'Invalid brochure page references: ' + image.id)
    if (manifest.schemaVersion === 2) {
      requireValue(!Object.hasOwn(image, 'role') && !Object.hasOwn(image, 'galleryOrder'),
        'V2 images must not have global role or galleryOrder: ' + image.id)
    } else if (image.role === 'hero') {
      heroCount += 1
      requireValue(image.galleryOrder === null, 'Hero galleryOrder must be null.')
    } else {
      requireValue(image.role === 'gallery' && positiveInteger(image.galleryOrder),
        'Image role must be hero or an ordered gallery image: ' + image.id)
      galleryOrders.push(image.galleryOrder)
    }
  }
  if (manifest.schemaVersion === 1) {
    requireValue(heroCount === 1, 'Manifest must have exactly one hero.')
    galleryOrders.sort((a, b) => a - b)
    requireValue(galleryOrders.every((order, index) => order === index + 1),
      'Gallery orders must be unique and contiguous from 1.')
  } else {
    requireValue(Array.isArray(manifest.documents) && manifest.documents.length > 0,
      'V2 manifest must contain documents.')
    const documentIds = new Set()
    const slugs = new Set()
    for (const document of manifest.documents) {
      validateDocumentIdentity(document)
      requireValue(!documentIds.has(document.documentId), 'Duplicate documentId: ' + document.documentId)
      requireValue(!slugs.has(document.slug), 'Duplicate document slug: ' + document.slug)
      documentIds.add(document.documentId)
      slugs.add(document.slug)
      requireValue(['development', 'home-type'].includes(document.kind),
        'Document kind must be development or home-type: ' + document.documentId)
      requireValue(ids.has(document.heroImageId), 'Unknown heroImageId: ' + document.heroImageId)
      requireValue(Array.isArray(document.galleryImageIds) &&
        document.galleryImageIds.every((id) => ids.has(id)),
      'Gallery must reference known image IDs: ' + document.documentId)
      requireValue(new Set(document.galleryImageIds).size === document.galleryImageIds.length,
        'Duplicate gallery image: ' + document.documentId)
      requireValue(!document.galleryImageIds.includes(document.heroImageId),
        'Hero must not also appear in its document gallery: ' + document.documentId)
      requireValue(document.kind !== 'home-type' || document.galleryImageIds.length <= 6,
        'Home-type gallery must contain at most six images: ' + document.documentId)
      if (Object.hasOwn(document, 'confirmedPricing')) {
        requireValue(document.kind === 'home-type' && document.confirmedFacts, 'Pricing requires a confirmed home type.')
        confirmedPriceFields(document.confirmedPricing)
      }
      if (Object.hasOwn(document, 'confirmedFacts')) {
        const facts = document.confirmedFacts
        requireValue(document.kind === 'home-type' && facts && !Array.isArray(facts) &&
          Object.keys(facts).every((key) => ['unitType', 'bedrooms', 'brochurePages'].includes(key)) &&
          ['Villa', 'Townhouse'].includes(facts.unitType) && [3, 4, 5, 6].includes(facts.bedrooms) &&
          Array.isArray(facts.brochurePages) && facts.brochurePages.length > 0 &&
          facts.brochurePages.every((page) => positiveInteger(page) && page <= brochure.pageCount),
        'Invalid confirmedFacts or brochure evidence: ' + document.documentId)
      }
    }
    requireValue(manifest.documents.filter((document) => document.kind === 'development').length === 1,
      'V2 manifest must contain exactly one development overview.')
  }
  return manifest
}

export function confirmedPriceFields(pricing) {
  requireValue(pricing && pricing.currency === 'AED' &&
    positiveInteger(pricing.startingPrice) && positiveInteger(pricing.maximumPrice) &&
    pricing.maximumPrice >= pricing.startingPrice && pricing.scope === 'Clusters 1 & 2' &&
    nonempty(pricing.source?.filename) && shaValid(pricing.source?.sha256) &&
    nonempty(pricing.source?.receivedAt) && nonempty(pricing.source?.currencyConfirmation),
  'Invalid confirmed pricing evidence.')
  return {
    priceAmount: pricing.startingPrice,
    priceCurrency: pricing.currency,
    priceDisplay: `AED ${pricing.startingPrice.toLocaleString('en-GB')}–${pricing.maximumPrice.toLocaleString('en-GB')} · ${pricing.scope}`,
  }
}

function validateDocumentIdentity(document) {
  requireValue(nonempty(document?.title) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document?.slug ?? ''),
    'Manifest document title and slug are required.')
  requireValue(/^drafts\.[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(document?.documentId ?? ''),
    'Manifest documentId must be a native drafts. ID.')
}

function documentDefinitions(manifest) {
  if (manifest.schemaVersion === 2) return manifest.documents
  return [{
    documentId: manifest.project.documentId, title: manifest.project.name, slug: manifest.project.slug,
    heroImageId: manifest.images.find((image) => image.role === 'hero').id,
    galleryImageIds: manifest.images.filter((image) => image.role === 'gallery')
      .sort((a, b) => a.galleryOrder - b.galleryOrder).map((image) => image.id),
  }]
}

export function validateDraft(draft, manifest) {
  requireValue(draft && !Array.isArray(draft) && draft._type === 'property',
    'Input must be one native property document.')
  const definition = manifest.schemaVersion === 2
    ? manifest.documents.find((document) => document.documentId === draft._id)
    : { ...manifest.project, title: manifest.project.name }
  requireValue(typeof draft._id === 'string' && draft._id.startsWith('drafts.') &&
    draft._id === definition?.documentId, 'Draft ID must match the native drafts. manifest ID.')
  requireValue(draft.status === 'draft' && draft.featured === false,
    'Input must remain status draft and featured false.')
  requireValue(draft.title === definition.title && draft.slug?.current === definition.slug,
    'Draft project title and slug must match the manifest.')
  const facts = manifest.schemaVersion === 2 ? definition.confirmedFacts : undefined
  const prices = definition.confirmedPricing ? confirmedPriceFields(definition.confirmedPricing) : {}
  for (const field of UNCONFIRMED_DRAFT_FIELDS) {
    if (Object.hasOwn(prices, field)) {
      requireValue(draft[field] === prices[field], 'Draft pricing must exactly match supplied evidence: ' + field)
      continue
    }
    if (facts && ['unitType', 'bedrooms'].includes(field)) {
      requireValue(Object.hasOwn(draft, field) && draft[field] === facts[field],
        'Draft ' + field + ' must exactly match confirmedFacts: ' + draft._id)
      continue
    }
    requireValue(!Object.hasOwn(draft, field), 'Unconfirmed or release field must remain absent: ' + field)
  }
  requireValue(!Object.hasOwn(draft, 'featuredImage') && !Object.hasOwn(draft, 'gallery'),
    'Input draft already has media; refuse to replace existing work.')
  if (manifest.schemaVersion === 2 || draft.verification !== undefined) {
    requireValue(draft.verification?.status === 'unverified' &&
      Object.keys(draft.verification).every((key) => ['status', 'notes'].includes(key)),
    'Draft verification must remain unverified without approval or check dates.')
  }
  return draft
}

export function validateDrafts(drafts, manifest) {
  const definitions = documentDefinitions(manifest)
  requireValue(Array.isArray(drafts) && drafts.length === definitions.length,
    manifest.schemaVersion === 1
      ? 'Draft NDJSON must contain exactly one document.'
      : 'Draft NDJSON must contain exactly all manifest documents.')
  const byId = new Map()
  for (const draft of drafts) {
    validateDraft(draft, manifest)
    requireValue(!byId.has(draft._id), 'Duplicate draft document ID: ' + draft._id)
    byId.set(draft._id, draft)
  }
  requireValue(definitions.every((document) => byId.has(document.documentId)),
    'Draft NDJSON is missing a manifest document.')
  return definitions.map((document) => byId.get(document.documentId))
}

async function exists(filePath) {
  try { await lstat(filePath); return true } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

function localPath(value, label) {
  requireValue(nonempty(value) && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) &&
    !/^(\\\\|\/\/)/.test(value) && !value.includes('\0'), label + ' must be a local filesystem path.')
  return path.resolve(value)
}

function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!relative.startsWith('..' + path.sep) &&
    relative !== '..' && !path.isAbsolute(relative))
}

async function rejectGitAncestors(start) {
  let current = start
  while (true) {
    requireValue(!await exists(path.join(current, '.git')),
      'Output must be outside Git repositories/worktrees: ' + current)
    // Also recognise a conventional bare repository, which has no .git child.
    const bare = await exists(path.join(current, 'HEAD')) &&
      await exists(path.join(current, 'objects')) && await exists(path.join(current, 'refs')) &&
      await exists(path.join(current, 'config'))
    requireValue(!bare, 'Output must be outside bare Git repositories: ' + current)
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
}

async function validateOutput(outputArg, sourceRoot, brochureParents) {
  const requested = localPath(outputArg, 'Output')
  requireValue(!await exists(requested), 'Output already exists; choose a new directory: ' + requested)
  const requestedParent = path.dirname(requested)
  const parent = await realpath(requestedParent).catch((error) => {
    if (error.code === 'ENOENT') throw new Error('Output parent must already exist: ' + requestedParent)
    throw error
  })
  requireValue((await stat(parent)).isDirectory(), 'Output parent must be a directory.')
  const resolved = path.join(parent, path.basename(requested))
  requireValue(!await exists(resolved), 'Resolved output already exists: ' + resolved)
  for (const candidate of [requested, resolved]) {
    requireValue(!isWithin(candidate, sourceRoot), 'Output must be outside the source root.')
    for (const brochureParent of brochureParents) {
      requireValue(!isWithin(candidate, brochureParent), 'Output must be outside the brochure directory.')
    }
  }
  // Check both names: an alias within a repository is unsafe even when its target is external.
  await rejectGitAncestors(requestedParent)
  await rejectGitAncestors(parent)
  return resolved
}

export async function hashFile(filePath) {
  const hash = createHash('sha256')
  let bytes = 0
  for await (const chunk of createReadStream(filePath)) {
    bytes += chunk.length
    hash.update(chunk)
  }
  return { sha256: hash.digest('hex'), bytes }
}

async function verifiedFile(filePath, expected, label) {
  requireValue((await stat(filePath)).isFile(), label + ' must be a regular file.')
  const actual = await hashFile(filePath)
  requireValue(actual.bytes === expected.bytes, label + ' byte size mismatch.')
  requireValue(actual.sha256 === expected.sha256, label + ' SHA256 mismatch.')
  return actual
}

async function sourcePathInside(root, relativePath) {
  const resolved = await realpath(path.join(root, ...relativePath.split('/')))
  requireValue(isWithin(resolved, root), 'Source symlink/junction escapes source root: ' + relativePath)
  return resolved
}

function imageReference(image, outputRoot) {
  // Verified against @sanity/import 3.38.3 assetRefs.js and getHashedBufferForUri.js.
  // _sanityAsset belongs on the image object; importing is a separate authorized operation.
  return {
    _key: image.id, _type: 'image', alt: image.alt,
    _sanityAsset: 'image@' + pathToFileURL(path.join(outputRoot, 'images', image.outputFile)).href,
  }
}

export async function preparePropertyMedia(options) {
  const manifestPath = await realpath(localPath(options.manifest, 'Manifest'))
  const draftPath = await realpath(localPath(options.draft, 'Draft'))
  const manifest = validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')))
  const lines = (await readFile(draftPath, 'utf8')).split(/\r?\n/).filter((line) => line.trim())
  const drafts = validateDrafts(lines.map((line) => JSON.parse(line)), manifest)
  const definitions = documentDefinitions(manifest)
  const heroIds = new Set(definitions.map((document) => document.heroImageId))
  const draftFilename = manifest.schemaVersion === 2
    ? 'properties.staging-draft.ndjson' : 'property.staging-draft.ndjson'
  const sourceRoot = await realpath(localPath(options.sourceRoot, 'Source root'))
  requireValue((await stat(sourceRoot)).isDirectory(), 'Source root must be a directory.')
  const brochureInputPath = localPath(options.brochure, 'Brochure')
  const brochurePath = await realpath(brochureInputPath)
  const brochureParents = [
    await realpath(path.dirname(brochureInputPath)), path.dirname(brochurePath),
  ]
  const outputRoot = await validateOutput(options.output, sourceRoot, brochureParents)
  const images = [...manifest.images]
  if (manifest.schemaVersion === 1) {
    images.sort((a, b) =>
      (a.role === 'hero' ? 0 : a.galleryOrder) - (b.role === 'hero' ? 0 : b.galleryOrder))
  }
  const imagesById = new Map(images.map((image) => [image.id, image]))

  // Finish all source checks before creating even the output directory.
  await verifiedFile(brochurePath, manifest.brochure, 'Brochure')
  const sources = []
  for (const image of images) {
    const sourcePath = await sourcePathInside(sourceRoot, image.sourcePath)
    await verifiedFile(sourcePath, image, 'Image ' + image.id)
    const metadata = await sharp(sourcePath, { failOn: 'error' }).metadata()
    requireValue(['jpeg', 'png'].includes(metadata.format) && (metadata.pages ?? 1) === 1,
      'Only single-frame JPEG/PNG sources are supported: ' + image.id)
    requireValue(metadata.width === image.width && metadata.height === image.height,
      'Actual image dimensions mismatch: ' + image.id)
    const expectedFormat = /\.png$/i.test(image.sourcePath) ? 'png' : 'jpeg'
    requireValue(metadata.format === expectedFormat, 'Source extension/format mismatch: ' + image.id)
    sources.push({ image, sourcePath, format: metadata.format })
  }
  requireValue(await validateOutput(options.output, sourceRoot, brochureParents) === outputRoot,
    'Output location changed during preflight.')
  await mkdir(outputRoot) // exclusive: never accept an occupied output directory
  const reportPath = path.join(outputRoot, 'preparation-report.json')
  const report = {
    schemaVersion: manifest.schemaVersion, status: 'incomplete', createdAt: new Date().toISOString(),
    generator: {
      name: 'prepare-property-media', version: 2, sharpVersion: sharp.versions.sharp,
      settings: { format: 'jpeg', quality: 85, progressive: true, colourspace: 'srgb',
        heroMaxEdge: 2560, galleryMaxEdge: 2000, withoutEnlargement: true, metadata: 'stripped' },
    },
    ...(manifest.schemaVersion === 2 ? { documents: manifest.documents } : { documentId: drafts[0]._id }),
    manifestPath, draftPath, sourceRoot, outputRoot,
    brochure: { ...manifest.brochure, sourcePath: brochurePath, copied: false },
    images: [],
  }
  let reportWritten = false
  const incompleteDraftPath = path.join(outputRoot, draftFilename + '.incomplete')
  try {
    await mkdir(path.join(outputRoot, 'images'))
    for (const { image, sourcePath, format } of sources) {
      requireValue(await sourcePathInside(sourceRoot, image.sourcePath) === sourcePath,
        'Source location changed after preflight: ' + image.id)
      // Bind conversion to the exact verified bytes, even if a source changes after preflight.
      const input = await readFile(sourcePath)
      requireValue(input.length === image.bytes &&
        createHash('sha256').update(input).digest('hex') === image.sha256,
      'Source changed after preflight: ' + image.id)
      const maxEdge = heroIds.has(image.id) ? 2560 : 2000
      const { data, info } = await sharp(input, { failOn: 'error' })
        .rotate().toColourspace('srgb')
        .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true }).toBuffer({ resolveWithObject: true })
      const outputPath = path.join(outputRoot, 'images', image.outputFile)
      await writeFile(outputPath, data, { flag: 'wx' })
      report.images.push({
        id: image.id,
        ...(manifest.schemaVersion === 1 ? { role: image.role, galleryOrder: image.galleryOrder } : {}),
        source: { path: sourcePath, relativePath: image.sourcePath, sha256: image.sha256,
          bytes: image.bytes, width: image.width, height: image.height, format },
        output: { path: outputPath, relativePath: 'images/' + image.outputFile,
          sha256: createHash('sha256').update(data).digest('hex'),
          bytes: data.length, width: info.width, height: info.height, format: info.format },
      })
    }
    const preparedDrafts = drafts.map((draft, index) => ({
      ...draft,
      featuredImage: imageReference(imagesById.get(definitions[index].heroImageId), outputRoot),
      gallery: definitions[index].galleryImageIds.map((id) => imageReference(imagesById.get(id), outputRoot)),
    }))
    await writeFile(incompleteDraftPath, preparedDrafts.map((draft) => JSON.stringify(draft)).join('\n') + '\n',
      { flag: 'wx' })
    report.status = 'complete'
    report.notice = 'Local draft preparation only; no upload, approval or publication performed.'
    report.totalSourceBytes = report.images.reduce((total, image) => total + image.source.bytes, 0)
    report.totalOutputBytes = report.images.reduce((total, image) => total + image.output.bytes, 0)
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
    reportWritten = true
    // An exclusive hard link exposes only a complete NDJSON, and never replaces an existing path.
    await link(incompleteDraftPath, path.join(outputRoot, draftFilename))
    // Failure to remove a scratch link does not invalidate the complete prepared file.
    await unlink(incompleteDraftPath).catch(() => {})
    return report
  } catch (error) {
    report.status = 'incomplete'
    report.error = error.message
    report.notice = 'Preparation failed. Do not import this output; choose a new output directory to retry.'
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n',
      { flag: reportWritten ? 'w' : 'wx' }).catch(() => {})
    throw new Error('Preparation failed; output is incomplete at ' + outputRoot + ': ' + error.message,
      { cause: error })
  }
}

export function parseArgs(args) {
  if (args.length === 1 && args[0] === '--help') return { help: true }
  const names = { '--manifest': 'manifest', '--draft': 'draft', '--source-root': 'sourceRoot',
    '--brochure': 'brochure', '--output': 'output' }
  const parsed = {}
  for (let index = 0; index < args.length; index += 2) {
    const name = names[args[index]]
    requireValue(name && !Object.hasOwn(parsed, name), 'Unknown or duplicate option: ' + args[index])
    const value = args[index + 1]
    requireValue(nonempty(value) && !value.startsWith('--'), 'Missing value for ' + args[index])
    parsed[name] = value
  }
  for (const [flag, name] of Object.entries(names)) {
    requireValue(nonempty(parsed[name]), 'Required option: ' + flag)
  }
  return parsed
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2))
    if (options.help) console.log(HELP)
    else {
      const report = await preparePropertyMedia(options)
      console.log('Prepared ' + report.images.length + ' images and ' +
        (report.documents?.length ?? 1) + ' local draft(s) in ' + report.outputRoot)
      console.log('Report: ' + path.join(report.outputRoot, 'preparation-report.json'))
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
