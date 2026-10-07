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

async function individualFixture() {
  report.schemaVersion = 3
  report.sourceEvidence = {
    kind: 'email', sourcePath: 'evidence.json', sha256: 'a'.repeat(64), bytes: 100,
    messageId: 'private-message-123', receivedAt: '2026-10-06T09:00:00Z', copied: false,
  }
  report.documents = [{
    documentId: 'drafts.property-london', title: 'Three-bedroom North London property',
    slug: 'north-london-three-bedroom', kind: 'property', heroImageId: 'aerial', galleryImageIds: ['villa'],
    confirmedFacts: { bedrooms: 3, listingType: ['sale'] },
  }]
  const photo = { ...imageReference('aerial'), alt: 'Source photograph', mediaKind: 'photo' }
  const concept = { ...imageReference('villa'), alt: 'Proposed interior comparison',
    mediaKind: 'concept-comparison', caption: 'Proposed interiors · AI-generated concept; not completed works.' }
  documents = [{
    _id: 'drafts.property-london', _type: 'property', title: 'Three-bedroom North London property',
    slug: { _type: 'slug', current: 'north-london-three-bedroom' }, status: 'draft', featured: false,
    community: 'North London', city: 'London', country: 'United Kingdom', bedrooms: 3, listingType: ['sale'],
    summary: 'Three-bedroom property for sale in North London. Further details await confirmation.',
    verification: { status: 'unverified', notes: 'private-email-notes' }, featuredImage: photo, gallery: [concept],
  }]
  Object.assign((report.images as JsonObject[])[0], { mediaKind: photo.mediaKind })
  Object.assign((report.images as JsonObject[])[1], { mediaKind: concept.mediaKind, caption: concept.caption })
  await saveFixture()
}

describe('email-evidenced individual property previews', () => {
  it('shows confirmed facts and persistent media labels without exposing evidence or inferring missing details', async () => {
    await individualFixture()
    const preview = await loadPropertyPreview('north-london-three-bedroom', options)
    expect(preview?.kind).toBe('property')
    expect(preview?.document.bedrooms).toBe(3)
    expect(preview?.document.listingType).toEqual(['sale'])
    expect(preview?.media.hero.mediaKind).toBe('photo')
    expect(preview?.media.gallery[0]).toEqual({
      src: '/dev/property-previews/media/villa.jpg', alt: 'Proposed interior comparison',
      mediaKind: 'concept-comparison', caption: 'Proposed interiors · AI-generated concept; not completed works.',
    })
    for (const field of ['unitType', 'availability', 'priceAmount', 'sizeDisplay', 'tenure', 'epc', 'floorPlans']) {
      expect(preview?.document).not.toHaveProperty(field)
    }
    expect(JSON.stringify(preview)).not.toMatch(/private-|sourceEvidence|sha256|_sanityAsset|evidence.json/)
    expect(await loadPropertyPreviewMedia('villa.jpg', options)).toEqual(new Uint8Array(jpeg))
  })

  it.each([
    ['unconfirmed property type', (d: JsonObject) => { d.unitType = 'House' }],
    ['unconfirmed availability', (d: JsonObject) => { d.availability = ['ready'] }],
    ['unconfirmed price', (d: JsonObject) => { d.priceAmount = 500000 }],
    ['unconfirmed address', (d: JsonObject) => { d.address = '10 Example Road' }],
    ['unconfirmed tenure', (d: JsonObject) => { d.tenure = 'Freehold' }],
    ['unconfirmed EPC', (d: JsonObject) => { d.epcRating = 'C' }],
    ['unsupported floorplans', (d: JsonObject) => { d.floorPlans = [] }],
    ['wrong bedrooms', (d: JsonObject) => { d.bedrooms = 4 }],
    ['wrong sale status', (d: JsonObject) => { d.listingType = ['rent'] }],
  ])('rejects %s in the draft', async (_label, mutate) => {
    await individualFixture()
    mutate(documents[0])
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it('rejects missing or altered concept captions and mismatched media classifications', async () => {
    await individualFixture()
    const gallery = (documents[0].gallery as JsonObject[])[0]
    delete gallery.caption
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    gallery.caption = 'Completed renovation'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    gallery.caption = (report.images as JsonObject[])[1].caption
    gallery.mediaKind = 'photo'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    Object.assign((report.images as JsonObject[])[1], { caption: undefined })
    gallery.mediaKind = 'concept-comparison'
    delete gallery.caption
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it('rejects unsupported evidence and facts and keeps version 3 media unavailable in production', async () => {
    await individualFixture()
    const facts = (report.documents as JsonObject[])[0].confirmedFacts as JsonObject
    facts.unitType = 'House'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    delete facts.unitType
    ;(report.sourceEvidence as JsonObject).sourcePath = '../evidence.json'
    await saveFixture()
    expect(await loadPropertyPreviews(options)).toEqual([])
    ;(report.sourceEvidence as JsonObject).sourcePath = 'evidence.json'
    await saveFixture()
    const production = { env: { NODE_ENV: 'production', HAUS_PROPERTY_PREVIEW_DIR: outputRoot } }
    expect(await loadPropertyPreviews(production)).toEqual([])
    expect(await loadPropertyPreviewMedia('villa.jpg', production)).toBeNull()
    const altered = Buffer.from(jpeg)
    altered[altered.length - 1] ^= 1
    await writeFile(path.join(outputRoot, 'images', 'villa.jpg'), altered)
    expect(await loadPropertyPreviewMedia('villa.jpg', options)).toBeNull()
  })
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
  it('invalidates runtime metadata cache and still checks image bytes after a cache hit', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_PROPERTY_PREVIEW_DIR', outputRoot)
    expect((await loadPropertyPreviews()).length).toBe(2)
    expect(await loadPropertyPreviewMedia('aerial.jpg')).toEqual(new Uint8Array(jpeg))
    vi.stubEnv('HAUS_PROPERTY_PREVIEW_DIR', path.relative(process.cwd(), outputRoot))
    expect(await loadPropertyPreviews()).toEqual([])
    vi.stubEnv('HAUS_PROPERTY_PREVIEW_DIR', outputRoot)
    const altered = Buffer.from(jpeg)
    altered[altered.length - 1] ^= 1
    await writeFile(path.join(outputRoot, 'images', 'aerial.jpg'), altered)
    expect(await loadPropertyPreviewMedia('aerial.jpg')).toBeNull()
    await writeFile(path.join(outputRoot, 'preparation-report.json'), '{}')
    expect(await loadPropertyPreviews()).toEqual([])
  })

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

describe('optional design evidence', () => {
  async function variantsFixture() {
    await writeFile(path.join(outputRoot, 'images', 'design-plan.jpg'), jpeg)
    return {
      schemaVersion: 1,
      images: [{ id: 'design-plan', output: {
        path: path.join(outputRoot, 'images', 'design-plan.jpg'), relativePath: 'images/design-plan.jpg',
        bytes: jpeg.length, sha256: createHash('sha256').update(jpeg).digest('hex'), width: 2, height: 2, format: 'jpeg',
      } }],
      documents: [{
        slug: 'florence-villas', brochureKey: 'florence-villa-4',
        sourcePath: 'private-brochure.pdf',
        designVariants: [{
          _key: 'villa-a', label: 'Brochure Type A', position: 'standalone',
          plotAreaSqFt: 3363, sellableAreaSqFt: 3831, plotAreaStatus: 'brochure',
          sourcePath: 'private-brochure.pdf',
          images: [{ imageId: 'design-plan', alt: 'Villa render', sourcePath: 'private-original.jpg' }],
          floorPlans: [{ imageId: 'design-plan', alt: 'Villa floor plan', label: 'Ground and first floors' }],
        }],
        interiorSchemes: [{ _key: 'palette-a', label: 'Palette A', images: [{ imageId: 'design-plan', alt: 'Interior render' }] }],
      }],
    }
  }

  async function saveVariants(value: unknown) {
    await writeFile(path.join(outputRoot, 'variants.json'), JSON.stringify(value))
  }

  it('loads matched plans and areas while removing private source evidence', async () => {
    await saveVariants(await variantsFixture())
    const preview = await loadPropertyPreview('florence-villas', options)
    const design = preview?.document.designVariants?.[0]
    expect(design?.plotAreaSqFt).toBe(3363)
    expect(design?.sellableAreaSqFt).toBe(3831)
    expect(design?.floorPlans[0]).toEqual({ src: '/dev/property-previews/media/design-plan.jpg', alt: 'Villa floor plan', label: 'Ground and first floors' })
    expect(preview?.document.interiorSchemes?.[0].label).toBe('Palette A')
    expect(JSON.stringify(preview)).not.toMatch(/private-|sourcePath|sha256|outputRoot/)
    expect(await loadPropertyPreviewMedia('design-plan.jpg', options)).toEqual(new Uint8Array(jpeg))
  })

  it('omits disputed plot figures from client data while retaining sellable area', async () => {
    const data = await variantsFixture()
    data.documents[0].designVariants[0].plotAreaStatus = 'conflict'
    Object.assign(data.documents[0].designVariants[0], { areaNote: 'Private discrepancy: table 2,260; drawing 1,938 sq ft.' })
    await saveVariants(data)
    const design = (await loadPropertyPreview('florence-villas', options))?.document.designVariants?.[0]
    expect(design?.plotAreaStatus).toBe('conflict')
    expect(design).not.toHaveProperty('plotAreaSqFt')
    expect(design).not.toHaveProperty('areaNote')
    expect(design?.sellableAreaSqFt).toBe(3831)
  })

  it('does not serve unassigned variant images or expose variants in production', async () => {
    const data = await variantsFixture()
    data.documents = []
    await saveVariants(data)
    expect(await loadPropertyPreviewMedia('design-plan.jpg', options)).toBeNull()
    await saveVariants(await variantsFixture())
    const disabled = { env: { NODE_ENV: 'production', HAUS_PROPERTY_PREVIEW_DIR: outputRoot } }
    expect(await loadPropertyPreviews(disabled)).toEqual([])
    expect(await loadPropertyPreviewMedia('design-plan.jpg', disabled)).toBeNull()
  })

  it('rejects escaped paths, mismatched design images and duplicate variant keys', async () => {
    const escaped = await variantsFixture()
    escaped.images[0].output.relativePath = '../private.jpg'
    await saveVariants(escaped)
    expect(await loadPropertyPreviews(options)).toEqual([])
    const missing = await variantsFixture()
    missing.documents[0].designVariants[0].floorPlans[0].imageId = 'unknown'
    await saveVariants(missing)
    expect(await loadPropertyPreviews(options)).toEqual([])
    const duplicate = await variantsFixture()
    duplicate.documents[0].designVariants.push(duplicate.documents[0].designVariants[0])
    await saveVariants(duplicate)
    expect(await loadPropertyPreviews(options)).toEqual([])
  })

  it('rejects altered image bytes and malformed optional evidence', async () => {
    await saveVariants(await variantsFixture())
    const altered = Buffer.from(jpeg)
    altered[altered.length - 1] ^= 1
    await writeFile(path.join(outputRoot, 'images', 'design-plan.jpg'), altered)
    expect(await loadPropertyPreviewMedia('design-plan.jpg', options)).toBeNull()
    await writeFile(path.join(outputRoot, 'variants.json'), '{')
    expect(await loadPropertyPreviews(options)).toEqual([])
  })
})
