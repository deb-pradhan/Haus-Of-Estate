import { createHash } from 'node:crypto'
import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export type PropertyPreviewEnvironment = {
  NODE_ENV?: string
  HAUS_PROPERTY_PREVIEW_DIR?: string
}

export type PropertyPreviewOptions = { env?: PropertyPreviewEnvironment }

export type PropertyPreviewImage = { src: string; alt: string }

export type PropertyPreviewDocument = Record<string, unknown> & {
  _id: string
  _type: 'property'
  title: string
  slug: { _type: 'slug'; current: string }
  community: string
  city: string
  country: string
  summary: string
  masterDevelopment?: string
  developer?: string
  unitType?: string
  bedrooms?: number
  priceDisplay?: string
  priceAmount?: number
  priceCurrency?: string
  description?: unknown[]
  keyFeatures?: string[]
  amenities?: string[]
}

export type PropertyPreview = {
  document: PropertyPreviewDocument
  kind: 'development' | 'home-type'
  media: { hero: PropertyPreviewImage; gallery: PropertyPreviewImage[] }
}

type PreparedImage = {
  id: string
  filename: string
  absolutePath: string
  bytes: number
  sha256: string
}

type PreviewBundle = {
  root: string
  previews: PropertyPreview[]
  images: Map<string, PreparedImage>
}

const MAX_METADATA_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MEDIA_PATH = '/dev/property-previews/media/'
const UNCONFIRMED_FIELDS = [
  'priceDisplay', 'rentPriceDisplay', 'priceAmount', 'priceCurrency', 'currency',
  'rentAmount', 'rentCurrency', 'rentPeriod', 'sizeDisplay', 'plotSizeDisplay',
  'paymentPlan', 'bathrooms', 'unitNumber', 'availability', 'listingType',
  'completionStatus', 'listingState', 'completionDate', 'handoverDate',
  'publishedAt', 'availabilityCheckedAt', 'availabilityCheckDueAt',
  'editorialApproval', 'approvals', 'approvedAt', 'approvedBy',
]

function requireValue(condition: unknown): asserts condition {
  if (!condition) throw new Error('Invalid local property preview bundle')
}

function object(value: unknown): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function filenameIsSafe(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 160 &&
    /^[a-z0-9][a-z0-9-]*\.jpg$/.test(value) &&
    !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(value)
}

function samePath(left: string, right: string) {
  return path.relative(left, right) === ''
}

function inside(root: string, candidate: string) {
  const relative = path.relative(root, candidate)
  return relative !== '' && relative !== '..' &&
    !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)
}

async function regularFile(root: string, relative: string, maxBytes: number) {
  let candidate = root
  const segments = relative.split('/')
  requireValue(segments.every((part) => part && part !== '.' && part !== '..' &&
    !/[\\:\u0000-\u001f]/.test(part)))
  for (const [index, segment] of segments.entries()) {
    candidate = path.join(candidate, segment)
    const info = await lstat(candidate)
    requireValue(!info.isSymbolicLink())
    if (index < segments.length - 1) requireValue(info.isDirectory())
    else requireValue(info.isFile() && info.size > 0 && info.size <= maxBytes)
  }
  const resolved = await realpath(candidate)
  requireValue(inside(root, resolved) && samePath(candidate, resolved))
  return resolved
}

async function metadata(root: string, filename: string) {
  const target = await regularFile(root, filename, MAX_METADATA_BYTES)
  const content = await readFile(target, 'utf8')
  requireValue(Buffer.byteLength(content) <= MAX_METADATA_BYTES)
  return content
}

function imageReference(
  value: unknown,
  imageId: string,
  imagesById: Map<string, PreparedImage>,
): PropertyPreviewImage {
  const reference = object(value)
  const image = imagesById.get(imageId)
  requireValue(image && reference._type === 'image' && reference._key === imageId)
  requireValue(nonempty(reference.alt))
  requireValue(reference._sanityAsset === 'image@' + pathToFileURL(image.absolutePath).href)
  return { src: MEDIA_PATH + encodeURIComponent(image.filename), alt: reference.alt }
}

function plainDescription(value: unknown) {
  requireValue(Array.isArray(value))
  return value.map((entry) => {
    const block = object(entry)
    requireValue(block._type === 'block' && nonempty(block._key) &&
      ['normal', 'h2', 'h3'].includes(block.style as string) && Array.isArray(block.children))
    return {
      _type: 'block',
      _key: block._key,
      style: block.style,
      markDefs: [],
      children: block.children.map((entry) => {
        const span = object(entry)
        requireValue(span._type === 'span' && nonempty(span._key) &&
          typeof span.text === 'string' && Array.isArray(span.marks) &&
          span.marks.every((mark) => typeof mark === 'string'))
        return {
          _type: 'span',
          _key: span._key,
          text: span.text,
          marks: span.marks.filter((mark) => mark === 'strong' || mark === 'em'),
        }
      }),
    }
  })
}

function displayDocument(document: Record<string, unknown>): PropertyPreviewDocument {
  const display: PropertyPreviewDocument = {
    _id: document._id as string,
    _type: 'property',
    title: document.title as string,
    slug: { _type: 'slug', current: object(document.slug).current as string },
    community: document.community as string,
    city: document.city as string,
    country: document.country as string,
    summary: document.summary as string,
    status: 'draft',
    featured: false,
  }
  for (const key of ['masterDevelopment', 'developer', 'category', 'unitType', 'priceDisplay', 'priceCurrency']) {
    if (document[key] !== undefined) {
      requireValue(nonempty(document[key]))
      display[key] = document[key]
    }
  }
  if (document.priceAmount !== undefined) display.priceAmount = document.priceAmount as number
  if (document.bedrooms !== undefined) display.bedrooms = document.bedrooms as number
  for (const key of ['keyFeatures', 'amenities'] as const) {
    if (document[key] !== undefined) {
      requireValue(Array.isArray(document[key]) && document[key].every(nonempty))
      display[key] = [...document[key]]
    }
  }
  if (document.description !== undefined) {
    display.description = plainDescription(document.description)
  }
  // Preview data can cross a server/client boundary. Never carry source paths,
  // verification notes, native asset references, videos or contact actions there.
  return display
}

async function readBundle(options: PropertyPreviewOptions): Promise<PreviewBundle | null> {
  const env = options.env ?? process.env
  if (env.NODE_ENV !== 'development') return null
  const configuredRoot = env.HAUS_PROPERTY_PREVIEW_DIR?.trim()
  if (!configuredRoot) return null

  try {
    requireValue(path.isAbsolute(configuredRoot) && !/^[\\/]{2}/.test(configuredRoot) &&
      !/^[a-z][a-z0-9+.-]*:\/\//i.test(configuredRoot))
    const root = path.resolve(configuredRoot)
    const rootInfo = await lstat(root)
    requireValue(rootInfo.isDirectory() && !rootInfo.isSymbolicLink())
    requireValue(samePath(root, await realpath(root)))
    const report = object(JSON.parse(await metadata(root, 'preparation-report.json')))
    requireValue(report.schemaVersion === 2 && report.status === 'complete')
    requireValue(typeof report.outputRoot === 'string' && path.isAbsolute(report.outputRoot) &&
      samePath(root, report.outputRoot))
    requireValue(Array.isArray(report.images) && report.images.length > 0 &&
      report.images.length <= 256)
    requireValue(Array.isArray(report.documents) && report.documents.length > 0 &&
      report.documents.length <= 128)

    const images = new Map<string, PreparedImage>()
    const imagesById = new Map<string, PreparedImage>()
    for (const entry of report.images) {
      const image = object(entry)
      const output = object(image.output)
      requireValue(typeof image.id === 'string' && /^[a-zA-Z0-9_-]{1,96}$/.test(image.id))
      requireValue(typeof output.relativePath === 'string' &&
        output.relativePath.startsWith('images/'))
      const filename = output.relativePath.slice('images/'.length)
      requireValue(filenameIsSafe(filename))
      requireValue(!images.has(filename) && !imagesById.has(image.id))
      requireValue(output.format === 'jpeg' && Number.isSafeInteger(output.bytes) &&
        (output.bytes as number) > 0 && (output.bytes as number) <= MAX_IMAGE_BYTES)
      requireValue(typeof output.sha256 === 'string' && /^[a-f0-9]{64}$/.test(output.sha256))
      for (const dimension of [output.width, output.height]) {
        requireValue(Number.isSafeInteger(dimension) && (dimension as number) > 0 &&
          (dimension as number) <= 2560)
      }
      const absolutePath = await regularFile(root, output.relativePath, MAX_IMAGE_BYTES)
      requireValue(typeof output.path === 'string' && samePath(absolutePath, output.path))
      requireValue((await lstat(absolutePath)).size === output.bytes)
      const prepared: PreparedImage = {
        id: image.id, filename, absolutePath,
        bytes: output.bytes as number, sha256: output.sha256,
      }
      images.set(filename, prepared)
      imagesById.set(image.id, prepared)
    }

    const rows = (await metadata(root, 'properties.staging-draft.ndjson'))
      .split(/\r?\n/).filter((line) => line.trim())
    requireValue(rows.length === report.documents.length)
    const documents = new Map<string, Record<string, unknown>>()
    for (const row of rows) {
      const document = object(JSON.parse(row))
      requireValue(typeof document._id === 'string' && !documents.has(document._id))
      documents.set(document._id, document)
    }

    const previews: PropertyPreview[] = []
    const slugs = new Set<string>()
    const usedDocumentIds = new Set<string>()
    const usedImageIds = new Set<string>()
    for (const entry of report.documents) {
      const definition = object(entry)
      requireValue(typeof definition.documentId === 'string' &&
        /^drafts\.[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(definition.documentId) &&
        !usedDocumentIds.has(definition.documentId))
      requireValue(typeof definition.slug === 'string' &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.slug) && !slugs.has(definition.slug))
      requireValue(nonempty(definition.title) &&
        (definition.kind === 'development' || definition.kind === 'home-type'))
      const document = documents.get(definition.documentId)
      requireValue(document && document._type === 'property' &&
        document.title === definition.title && document.status === 'draft' &&
        document.featured === false)
      const slug = object(document.slug)
      requireValue(slug._type === 'slug' && slug.current === definition.slug)
      requireValue(['community', 'city', 'country', 'summary'].every((key) => nonempty(document[key])))
      requireValue((document.summary as string).length <= 280)
      const prices: Record<string, unknown> = {}
      if (definition.confirmedPricing !== undefined) {
        const pricing = object(definition.confirmedPricing)
        const source = object(pricing.source)
        requireValue(definition.kind === 'home-type' && definition.confirmedFacts &&
          pricing.currency === 'AED' && pricing.scope === 'Clusters 1 & 2' &&
          Number.isSafeInteger(pricing.startingPrice) && (pricing.startingPrice as number) > 0 &&
          Number.isSafeInteger(pricing.maximumPrice) && (pricing.maximumPrice as number) >= (pricing.startingPrice as number) &&
          nonempty(source.filename) && typeof source.sha256 === 'string' && /^[a-f0-9]{64}$/.test(source.sha256) &&
          nonempty(source.receivedAt) && nonempty(source.currencyConfirmation))
        prices.priceAmount = pricing.startingPrice
        prices.priceCurrency = pricing.currency
        prices.priceDisplay = `AED ${(pricing.startingPrice as number).toLocaleString('en-GB')}–${(pricing.maximumPrice as number).toLocaleString('en-GB')} · ${pricing.scope}`
      }
      requireValue(UNCONFIRMED_FIELDS.every((key) =>
        Object.hasOwn(prices, key) ? document[key] === prices[key] : !Object.hasOwn(document, key)))
      const verification = object(document.verification)
      requireValue(verification.status === 'unverified' &&
        Object.keys(verification).every((key) => ['status', 'notes'].includes(key)))
      if (definition.confirmedFacts !== undefined) {
        const facts = object(definition.confirmedFacts)
        requireValue(definition.kind === 'home-type' &&
          (facts.unitType === 'Villa' || facts.unitType === 'Townhouse') &&
          [3, 4, 5, 6].includes(facts.bedrooms as number) &&
          Array.isArray(facts.brochurePages) && facts.brochurePages.length > 0 &&
          facts.brochurePages.every((page) => Number.isSafeInteger(page) && page > 0))
        requireValue(document.unitType === facts.unitType && document.bedrooms === facts.bedrooms)
      } else {
        requireValue(!Object.hasOwn(document, 'unitType') && !Object.hasOwn(document, 'bedrooms'))
      }
      requireValue(typeof definition.heroImageId === 'string' &&
        Array.isArray(definition.galleryImageIds) &&
        definition.galleryImageIds.every((id) => typeof id === 'string'))
      const galleryIds = definition.galleryImageIds as string[]
      requireValue(new Set(galleryIds).size === galleryIds.length &&
        !galleryIds.includes(definition.heroImageId) &&
        (definition.kind !== 'home-type' || galleryIds.length <= 6))
      requireValue(Array.isArray(document.gallery) && document.gallery.length === galleryIds.length)
      const hero = imageReference(document.featuredImage, definition.heroImageId, imagesById)
      const gallery = galleryIds.map((id, index) =>
        imageReference((document.gallery as unknown[])[index], id, imagesById))
      usedDocumentIds.add(definition.documentId)
      slugs.add(definition.slug)
      for (const id of [definition.heroImageId, ...galleryIds]) usedImageIds.add(id)
      previews.push({
        document: displayDocument(document),
        kind: definition.kind,
        media: { hero, gallery },
      })
    }
    requireValue(previews.filter((preview) => preview.kind === 'development').length === 1)
    // Only assigned report images may be served, even if extra files exist beside them.
    for (const [filename, image] of images) {
      if (!usedImageIds.has(image.id)) images.delete(filename)
    }
    return { root, previews, images }
  } catch {
    // Local preview is optional. Missing, malformed or incomplete output never
    // falls back to another folder, Sanity or the public property catalogue.
    return null
  }
}

export async function loadPropertyPreviews(
  options: PropertyPreviewOptions = {},
): Promise<PropertyPreview[]> {
  return (await readBundle(options))?.previews ?? []
}

export async function loadPropertyPreview(
  slug: string,
  options: PropertyPreviewOptions = {},
): Promise<PropertyPreview | null> {
  return (await loadPropertyPreviews(options))
    .find((preview) => preview.document.slug.current === slug) ?? null
}

export async function loadPropertyPreviewMedia(
  filename: string,
  options: PropertyPreviewOptions = {},
): Promise<Uint8Array | null> {
  if (!filenameIsSafe(filename)) return null
  const bundle = await readBundle(options)
  const image = bundle?.images.get(filename)
  if (!bundle || !image) return null
  try {
    const target = await regularFile(bundle.root, 'images/' + filename, MAX_IMAGE_BYTES)
    requireValue(samePath(target, image.absolutePath))
    const bytes = await readFile(target)
    requireValue(bytes.length === image.bytes &&
      createHash('sha256').update(bytes).digest('hex') === image.sha256)
    requireValue(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return new Uint8Array(bytes)
  } catch {
    return null
  }
}
