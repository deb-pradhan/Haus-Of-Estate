import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '../app/dev/property-previews/media/[filename]/route'
import {
  loadPropertyPreview,
  loadPropertyPreviewMedia,
  loadPropertyPreviews,
  type PropertyPreviewOptions,
} from './property-previews'

type JsonObject = Record<string, unknown>

let temporaryRoot: string
let outputRoot: string
let jpeg: Buffer
let report: JsonObject
let documents: JsonObject[]
let options: PropertyPreviewOptions

function imageReference(id: string) {
  return {
    _key: id, _type: 'image', alt: id + ' architectural rendering',
    _sanityAsset: 'image@' + pathToFileURL(path.join(outputRoot, 'images', id + '.jpg')).href,
  }
}

async function saveFixture() {
  await writeFile(path.join(outputRoot, 'preparation-report.json'), JSON.stringify(report))
  await writeFile(
    path.join(outputRoot, 'properties.staging-draft.ndjson'),
    documents.map((document) => JSON.stringify(document)).join('\n') + '\n',
  )
}

beforeEach(async () => {
  temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'haus-property-preview-test-'))
  outputRoot = path.join(temporaryRoot, 'prepared')
  await mkdir(path.join(outputRoot, 'images'), { recursive: true })
  jpeg = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#557755' },
  }).jpeg().toBuffer()
  const definitions = [
    {
      documentId: 'drafts.property-florence', title: 'Florence', slug: 'florence',
      kind: 'development', heroImageId: 'aerial', galleryImageIds: ['villa'],
    },
    {
      documentId: 'drafts.property-florence-villas', title: 'Florence Villas',
      slug: 'florence-villas', kind: 'home-type', heroImageId: 'villa',
      galleryImageIds: ['aerial'],
      confirmedFacts: { unitType: 'Villa', bedrooms: 4, brochurePages: [36, 60, 63] },
    },
  ]
  documents = definitions.map((definition) => ({
    _id: definition.documentId, _type: 'property', title: definition.title,
    slug: { _type: 'slug', current: definition.slug }, status: 'draft', featured: false,
    community: 'Florence', city: 'Sharjah', country: 'United Arab Emirates',
    summary: 'Brochure-based design collection.',
    verification: { status: 'unverified', notes: 'Local fixture.' },
    ...(definition.confirmedFacts ? { unitType: 'Villa', bedrooms: 4 } : {}),
    featuredImage: imageReference(definition.heroImageId),
    gallery: definition.galleryImageIds.map(imageReference),
  }))
  report = {
    schemaVersion: 2, status: 'complete', outputRoot, documents: definitions,
    images: ['aerial', 'villa'].map((id) => ({
      id,
      output: {
        path: path.join(outputRoot, 'images', id + '.jpg'),
        relativePath: 'images/' + id + '.jpg',
        bytes: jpeg.length, sha256: createHash('sha256').update(jpeg).digest('hex'),
        width: 2, height: 2, format: 'jpeg',
      },
    })),
  }
  await Promise.all(['aerial', 'villa'].map((id) =>
    writeFile(path.join(outputRoot, 'images', id + '.jpg'), jpeg)))
  options = { env: { NODE_ENV: 'development', HAUS_PROPERTY_PREVIEW_DIR: outputRoot } }
  await saveFixture()
})

afterEach(async () => {
  vi.unstubAllEnvs()
  // Every fixture, including junction targets, is inside this one owned temp directory.
  expect(path.dirname(temporaryRoot)).toBe(path.resolve(os.tmpdir()))
  expect(path.basename(temporaryRoot)).toMatch(/^haus-property-preview-test-/)
  await rm(temporaryRoot, { recursive: true, force: true })
})

describe('local property preview bundles', () => {
  it('resolves ordered local media and preserves the original draft slug shape', async () => {
    documents.reverse()
    await saveFixture()
    const previews = await loadPropertyPreviews(options)

    expect(previews.map((preview) => preview.document.slug.current))
      .toEqual(['florence', 'florence-villas'])
    expect(previews[0].media).toEqual({
      hero: { src: '/dev/property-previews/media/aerial.jpg', alt: 'aerial architectural rendering' },
      gallery: [{ src: '/dev/property-previews/media/villa.jpg', alt: 'villa architectural rendering' }],
    })
    expect(previews[1].kind).toBe('home-type')
    expect(previews[1].document.bedrooms).toBe(4)
    expect(previews[1].document).not.toHaveProperty('priceDisplay')
    expect(previews[1].document).not.toHaveProperty('sizeDisplay')
    expect(await loadPropertyPreview('florence-villas', options)).toEqual(previews[1])
    expect(await loadPropertyPreview('../florence', options)).toBeNull()
  })

  it.each(['production', 'test', undefined])('disables reads in %s mode', async (mode) => {
    const disabled = { env: { NODE_ENV: mode, HAUS_PROPERTY_PREVIEW_DIR: outputRoot } }
    expect(await loadPropertyPreviews(disabled)).toEqual([])
    expect(await loadPropertyPreviewMedia('aerial.jpg', disabled)).toBeNull()
  })

  it('requires an explicit absolute local folder without a working-directory fallback', async () => {
    for (const directory of [undefined, '', 'prepared', '../prepared', '\\\\server\\share', 'https://example.com']) {
      expect(await loadPropertyPreviews({
        env: { NODE_ENV: 'development', HAUS_PROPERTY_PREVIEW_DIR: directory },
      })).toEqual([])
    }
  })

  it('rejects missing, malformed and incomplete report or NDJSON files', async () => {
    report.status = 'incomplete'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    report.status = 'complete'
    report.schemaVersion = 1
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    report.schemaVersion = 2
    await saveFixture()
    await writeFile(path.join(outputRoot, 'preparation-report.json'), '{')
    expect(await loadPropertyPreviews(options)).toEqual([])
    await saveFixture()
    await writeFile(path.join(outputRoot, 'properties.staging-draft.ndjson'), '{')
    expect(await loadPropertyPreviews(options)).toEqual([])
    await rename(
      path.join(outputRoot, 'properties.staging-draft.ndjson'),
      path.join(outputRoot, 'properties.staging-draft.ndjson.incomplete'),
    )
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it.each([
    ['published draft', (docs: JsonObject[]) => { docs[0].status = 'published' }],
    ['featured draft', (docs: JsonObject[]) => { docs[0].featured = true }],
    ['unconfirmed price', (docs: JsonObject[]) => { docs[0].priceAmount = 0 }],
    ['wrong bedroom count', (docs: JsonObject[]) => { docs[1].bedrooms = 6 }],
    ['mismatched title', (docs: JsonObject[]) => { docs[1].title = 'Different' }],
    ['duplicate document', (docs: JsonObject[]) => { docs[1] = docs[0] }],
    ['extra document', (docs: JsonObject[]) => { docs.push(docs[0]) }],
    ['malformed feature list', (docs: JsonObject[]) => { docs[0].keyFeatures = 'Not an array' }],
    ['malformed amenity list', (docs: JsonObject[]) => { docs[0].amenities = [{}] }],
    ['approval metadata', (docs: JsonObject[]) => {
      docs[0].verification = { status: 'unverified', checkedAt: '2026-09-10' }
    }],
  ])('rejects %s instead of displaying fallback content', async (_label, mutate) => {
    mutate(documents)
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it('projects display fields and plain text without private metadata or contact links', async () => {
    documents[0].sourcePath = 'private-source-path'
    documents[0].videoUrl = 'https://www.youtube.com/watch?v=example'
    documents[0].enquiryEmail = 'private@example.com'
    documents[0].verification = { status: 'unverified', notes: 'private-verification-notes' }
    documents[0].description = [{
      _key: 'paragraph', _type: 'block', style: 'normal',
      sourcePath: 'private-block-path',
      markDefs: [{ _key: 'contact', _type: 'link', href: 'mailto:private@example.com' }],
      children: [{
        _key: 'text', _type: 'span', text: 'Design collection',
        sourcePath: 'private-span-path', marks: ['strong', 'contact'],
      }],
    }]
    await saveFixture()
    const preview = await loadPropertyPreview('florence', options)
    expect(preview?.document.description).toEqual([{
      _key: 'paragraph', _type: 'block', style: 'normal', markDefs: [],
      children: [{ _key: 'text', _type: 'span', text: 'Design collection', marks: ['strong'] }],
    }])
    const serialized = JSON.stringify(preview)
    for (const excluded of ['private-', 'mailto:', '_sanityAsset', 'verification', 'youtube.com', 'sourcePath']) {
      expect(serialized).not.toContain(excluded)
    }
  })

  it('rejects a report image that escapes the output folder', async () => {
    const image = (report.images as JsonObject[])[0]
    const output = image.output as JsonObject
    output.relativePath = '../private.jpg'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it('rejects unrelated absolute paths and external asset references', async () => {
    const image = (report.images as JsonObject[])[0]
    const output = image.output as JsonObject
    output.path = path.join(temporaryRoot, 'private.jpg')
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    output.path = path.join(outputRoot, 'images', 'aerial.jpg')
    ;(documents[0].featuredImage as JsonObject)._sanityAsset = 'image@https://example.com/private.jpg'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it('rejects a configured root junction and an escaping image-directory junction', async () => {
    const rootAlias = path.join(temporaryRoot, 'alias')
    await symlink(outputRoot, rootAlias, process.platform === 'win32' ? 'junction' : 'dir')
    expect(await loadPropertyPreviews({
      env: { NODE_ENV: 'development', HAUS_PROPERTY_PREVIEW_DIR: rootAlias },
    })).toEqual([])
    const outsideImages = path.join(temporaryRoot, 'outside-images')
    await rename(path.join(outputRoot, 'images'), outsideImages)
    await symlink(outsideImages, path.join(outputRoot, 'images'),
      process.platform === 'win32' ? 'junction' : 'dir')
    expect(await loadPropertyPreviews(options)).toEqual([])
    expect(await loadPropertyPreviewMedia('aerial.jpg', options)).toBeNull()
  })
})

describe('local preview media', () => {
  it('serves only assigned JPEGs and refuses traversal or unlisted neighbouring files', async () => {
    expect(await loadPropertyPreviewMedia('aerial.jpg', options)).toEqual(new Uint8Array(jpeg))
    await writeFile(path.join(outputRoot, 'images', 'private.jpg'), jpeg)
    for (const filename of ['private.jpg', '../private.jpg', '..\\private.jpg', '%2e%2e%2fprivate.jpg', 'aerial.jpg:secret', 'aerial.png']) {
      expect(await loadPropertyPreviewMedia(filename, options)).toBeNull()
    }
  })

  it('refuses an image whose bytes changed after preparation', async () => {
    const altered = Buffer.from(jpeg)
    altered[altered.length - 1] ^= 1
    await writeFile(path.join(outputRoot, 'images', 'aerial.jpg'), altered)
    expect(await loadPropertyPreviewMedia('aerial.jpg', options)).toBeNull()
    expect(await readFile(path.join(outputRoot, 'images', 'aerial.jpg'))).toEqual(altered)
  })

  it('returns no-store/noindex responses and 404 in production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_PROPERTY_PREVIEW_DIR', outputRoot)
    const request = new Request('http://localhost/dev/property-previews/media/aerial.jpg')
    const context = { params: Promise.resolve({ filename: 'aerial.jpg' }) }
    const response = await GET(request, context)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(jpeg))
    vi.stubEnv('NODE_ENV', 'production')
    const blocked = await GET(request, context)
    expect(blocked.status).toBe(404)
    expect(blocked.headers.get('cache-control')).toContain('no-store')
    expect(blocked.headers.get('x-robots-tag')).toContain('noindex')
  })
})


it('shows evidenced cluster pricing and rejects changed or unsourced amounts', async () => {
  const definitions = report.documents as JsonObject[]
  definitions[1].confirmedPricing = {
    currency: 'AED', startingPrice: 3350000, maximumPrice: 5115000, scope: 'Clusters 1 & 2',
    source: { filename: 'villa.png', sha256: 'a'.repeat(64), receivedAt: '2026-09-13', currencyConfirmation: 'Confirmed AED' },
  }
  Object.assign(documents[1], { priceAmount: 3350000, priceCurrency: 'AED', priceDisplay: 'AED 3,350,000–5,115,000 · Clusters 1 & 2' })
  await saveFixture()
  const previews = await loadPropertyPreviews(options)
  expect(previews[1].document.priceDisplay).toBe('AED 3,350,000–5,115,000 · Clusters 1 & 2')
  expect(previews[1].document).not.toHaveProperty('confirmedPricing')
  expect(previews[1].document).not.toHaveProperty('verification')
  documents[1].priceAmount = 1
  await saveFixture()
  expect(await loadPropertyPreviews(options)).toEqual([])
  documents[1].priceAmount = 3350000
  delete definitions[1].confirmedPricing
  await saveFixture()
  expect(await loadPropertyPreviews(options)).toEqual([])
})
