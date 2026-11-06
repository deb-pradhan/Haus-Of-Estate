import 'server-only'

import fixtureJson from '../../../docs/claude-cloud/fixtures/haus-properties.json'
import { buildPropertyLocationGroups, type PropertyLocationGroup } from '@/lib/property-locations'
import { hasShowcaseFilters, matchesShowcaseSearch, type ShowcaseSearch } from './search'
import { formatAreaRange } from './format'

export { designPositionLabel, formatArea, formatAreaRange } from './format'

/**
 * Display-only adapter over the sanitized showcase fixture.
 *
 * The fixture is not a Sanity import or an inventory feed. This module keeps
 * the presentation rules from its README in one place: Florence prices,
 * availability and payment terms are never emitted, disputed plot figures stay
 * withheld, whole-row plan labels and BEFORE/AFTER captions are preserved, and
 * only existing Sanity CDN derivatives are referenced.
 */

export type ShowcaseKind = 'development' | 'home-type' | 'property'
export type ShowcaseMediaKind = 'render' | 'photo' | 'concept' | 'concept-comparison' | 'floor-plan'

export interface ShowcaseImage {
  src: string
  alt: string
  width?: number
  height?: number
  mediaKind?: ShowcaseMediaKind
  caption?: string
  label?: string
}

export interface ShowcaseDesign {
  key: string
  label: string
  family?: string
  rowHomes?: number
  position?: 'corner' | 'middle' | 'standalone'
  /** Brochure figure stored as `sellableAreaSqFt`; displayed as built-up area. */
  builtUpAreaSqFt: number
  /** Undefined while the brochure table and diagram disagree. */
  plotAreaSqFt?: number
  plotAreaStatus: 'brochure' | 'conflict'
  areaNote?: string
  summary?: string
  brochureKey?: string
  images: ShowcaseImage[]
  floorPlans: ShowcaseImage[]
}

export interface ShowcaseInteriorScheme {
  key: string
  label: string
  images: ShowcaseImage[]
}

export interface ShowcaseTextSpan { key: string; text: string; strong: boolean }
export interface ShowcaseTextBlock { key: string; style: 'normal' | 'h2' | 'h3'; spans: ShowcaseTextSpan[] }

export interface ShowcaseDisplay {
  inventoryNotice: string
  amenitiesHeading?: string
  areaLabel: string
  areaSourceLabel?: string
  interiorNotice?: string
  imageNotice?: string
  brochureMode: 'simulated-only' | 'not-supplied'
}

export interface ShowcasePrice { amount: number; currency: string; display: string }

export interface ShowcaseProperty {
  kind: ShowcaseKind
  id: string
  slug: string
  title: string
  community: string
  city: string
  country: string
  developer?: string
  category?: string
  unitType: string
  bedrooms?: number
  masterDevelopment?: string
  summary: string
  description: ShowcaseTextBlock[]
  keyFeatures: string[]
  amenities: string[]
  /** Only supplied for the ready home; Florence collections carry no price. */
  price?: ShowcasePrice
  sizeDisplay?: string
  floorPlans: ShowcaseImage[]
  designs: ShowcaseDesign[]
  interiorSchemes: ShowcaseInteriorScheme[]
  media: { hero: ShowcaseImage; gallery: ShowcaseImage[] }
  display: ShowcaseDisplay
}

export interface ShowcaseCollectionGroup {
  id: 'villas' | 'townhouses'
  type: 'Villa' | 'Townhouse'
  title: string
  collections: ShowcaseProperty[]
}

export interface ShowcaseCommunity {
  overview: ShowcaseProperty
  collections: ShowcaseProperty[]
  groups: ShowcaseCollectionGroup[]
  designCount: number
}

export interface ShowcaseCatalogue {
  preparedOn: string
  properties: ShowcaseProperty[]
  communities: ShowcaseCommunity[]
  readyHomes: ShowcaseProperty[]
}

type Raw = Record<string, unknown>

const CDN_PREFIX = 'https://cdn.sanity.io/images/'
const MEDIA_KINDS: ShowcaseMediaKind[] = ['render', 'photo', 'concept', 'concept-comparison', 'floor-plan']
const HOME_TYPES = [
  { id: 'villas', type: 'Villa', title: 'Villas' },
  { id: 'townhouses', type: 'Townhouse', title: 'Townhouses' },
] as const

function invalid(detail: string): never {
  throw new Error(`Invalid showcase fixture: ${detail}`)
}

function record(value: unknown, detail: string): Raw {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(detail)
  return value as Raw
}

function text(value: unknown, detail: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(detail)
  return value.trim()
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function image(value: unknown, detail: string): ShowcaseImage {
  const raw = record(value, detail)
  const src = text(raw.src, `${detail} src`)
  if (!src.startsWith(CDN_PREFIX)) invalid(`${detail} must reference the Sanity CDN`)
  const mediaKind = MEDIA_KINDS.includes(raw.mediaKind as ShowcaseMediaKind) ? (raw.mediaKind as ShowcaseMediaKind) : undefined
  return {
    src,
    alt: text(raw.alt, `${detail} alt`),
    width: optionalNumber(raw.width),
    height: optionalNumber(raw.height),
    mediaKind,
    caption: optionalText(raw.caption),
    label: optionalText(raw.label),
  }
}

function images(value: unknown, detail: string): ShowcaseImage[] {
  return Array.isArray(value) ? value.map((item, index) => image(item, `${detail}[${index}]`)) : []
}

function design(value: unknown, detail: string): ShowcaseDesign {
  const raw = record(value, detail)
  const key = text(raw._key, `${detail} key`)
  if (!/^[a-zA-Z0-9_-]{1,96}$/.test(key)) invalid(`${detail} key`)
  const plotAreaStatus = raw.plotAreaStatus === 'conflict' ? 'conflict' : 'brochure'
  const builtUpAreaSqFt = optionalNumber(raw.sellableAreaSqFt)
  if (!builtUpAreaSqFt) invalid(`${detail} built-up area`)
  const position = ['corner', 'middle', 'standalone'].includes(raw.position as string)
    ? (raw.position as ShowcaseDesign['position']) : undefined
  return {
    key,
    label: text(raw.label, `${detail} label`),
    family: optionalText(raw.family),
    rowHomes: optionalNumber(raw.rowHomes),
    position,
    builtUpAreaSqFt,
    // A disputed plot figure is withheld even if a number was supplied.
    plotAreaSqFt: plotAreaStatus === 'conflict' ? undefined : optionalNumber(raw.plotAreaSqFt),
    plotAreaStatus,
    areaNote: optionalText(raw.areaNote),
    summary: optionalText(raw.summary),
    brochureKey: optionalText(raw.brochureKey),
    images: images(raw.images, `${detail} images`),
    floorPlans: images(raw.floorPlans, `${detail} floor plans`),
  }
}

function description(value: unknown): ShowcaseTextBlock[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index): ShowcaseTextBlock[] => {
    const block = record(entry, `description[${index}]`)
    if (block._type !== 'block' || !Array.isArray(block.children)) return []
    const style = ['h2', 'h3'].includes(block.style as string) ? (block.style as 'h2' | 'h3') : 'normal'
    const spans = block.children.flatMap((child, childIndex): ShowcaseTextSpan[] => {
      const span = record(child, `description[${index}].children[${childIndex}]`)
      if (span._type !== 'span' || typeof span.text !== 'string') return []
      return [{
        key: typeof span._key === 'string' ? span._key : `${index}-${childIndex}`,
        text: span.text,
        strong: Array.isArray(span.marks) && span.marks.includes('strong'),
      }]
    })
    if (!spans.some((span) => span.text.trim())) return []
    return [{ key: typeof block._key === 'string' ? block._key : String(index), style, spans }]
  })
}

function display(value: unknown, kind: ShowcaseKind): ShowcaseDisplay {
  const raw = record(value, 'display')
  return {
    inventoryNotice: text(raw.inventoryNotice, 'display inventory notice'),
    amenitiesHeading: optionalText(raw.amenitiesHeading),
    areaLabel: optionalText(raw.areaLabel) ?? (kind === 'property' ? 'Floor area' : 'Built-up area'),
    areaSourceLabel: optionalText(raw.areaSourceLabel),
    interiorNotice: optionalText(raw.interiorNotice),
    imageNotice: optionalText(raw.imageNotice),
    brochureMode: raw.brochureMode === 'simulated-only' ? 'simulated-only' : 'not-supplied',
  }
}

function property(value: unknown, index: number): ShowcaseProperty {
  const raw = record(value, `properties[${index}]`)
  const kind = raw.kind
  if (kind !== 'development' && kind !== 'home-type' && kind !== 'property') invalid(`properties[${index}] kind`)
  const doc = record(raw.document, `properties[${index}].document`)
  const slug = text(record(doc.slug, `properties[${index}] slug`).current, `properties[${index}] slug`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) invalid(`properties[${index}] slug`)
  const media = record(raw.media, `properties[${index}].media`)
  const florence = kind !== 'property'
  const priceAmount = optionalNumber(doc.priceAmount)
  const priceCurrency = optionalText(doc.priceCurrency)
  const priceDisplay = optionalText(doc.priceDisplay)
  return {
    kind,
    id: text(doc._id, `properties[${index}] id`),
    slug,
    title: text(doc.title, `properties[${index}] title`),
    community: text(doc.community, `properties[${index}] community`),
    city: text(doc.city, `properties[${index}] city`),
    country: text(doc.country, `properties[${index}] country`),
    developer: optionalText(doc.developer),
    category: optionalText(doc.category),
    unitType: text(doc.unitType, `properties[${index}] unit type`),
    bedrooms: typeof doc.bedrooms === 'number' && Number.isInteger(doc.bedrooms) ? doc.bedrooms : undefined,
    masterDevelopment: optionalText(doc.masterDevelopment),
    summary: text(doc.summary, `properties[${index}] summary`),
    description: description(doc.description),
    keyFeatures: strings(doc.keyFeatures),
    amenities: strings(doc.amenities),
    // Old Florence prices and inventory are not current offers; never display them.
    price: !florence && priceAmount && priceCurrency && priceDisplay
      ? { amount: priceAmount, currency: priceCurrency, display: priceDisplay } : undefined,
    sizeDisplay: florence ? undefined : optionalText(doc.sizeDisplay),
    floorPlans: images(doc.floorPlans, `properties[${index}] floor plans`),
    designs: Array.isArray(doc.designVariants)
      ? doc.designVariants.map((entry, designIndex) => design(entry, `properties[${index}].designVariants[${designIndex}]`)) : [],
    interiorSchemes: Array.isArray(doc.interiorSchemes) ? doc.interiorSchemes.map((entry, schemeIndex) => {
      const scheme = record(entry, `properties[${index}].interiorSchemes[${schemeIndex}]`)
      return {
        key: text(scheme._key, `interior scheme ${schemeIndex} key`),
        label: text(scheme.label, `interior scheme ${schemeIndex} label`),
        images: images(scheme.images, `interior scheme ${schemeIndex} images`),
      }
    }) : [],
    media: {
      hero: image(media.hero, `properties[${index}].media.hero`),
      gallery: images(media.gallery, `properties[${index}].media.gallery`),
    },
    display: display(raw.display, kind),
  }
}

export function collectionGroupsFor(collections: ShowcaseProperty[]): ShowcaseCollectionGroup[] {
  return HOME_TYPES.map((group) => ({
    ...group,
    collections: collections.filter((collection) => collection.unitType === group.type)
      .sort((a, b) => (a.bedrooms ?? 0) - (b.bedrooms ?? 0)),
  })).filter((group) => group.collections.length > 0)
}

/** The same relationship rule as the Sanity catalogue: a shared place name alone is not enough. */
export function belongsToShowcaseCommunity(collection: ShowcaseProperty, overview: ShowcaseProperty): boolean {
  return overview.kind === 'development' && collection.kind === 'home-type' &&
    collection.masterDevelopment === overview.title &&
    collection.community === overview.community && collection.city === overview.city &&
    collection.country === overview.country &&
    HOME_TYPES.some((group) => group.type === collection.unitType)
}

function buildCatalogue(): ShowcaseCatalogue {
  const root = record(fixtureJson, 'root')
  if (root.schemaVersion !== 1 || !Array.isArray(root.properties)) invalid('schema version')
  const properties = root.properties.map(property)
  const slugs = new Set<string>()
  for (const item of properties) {
    if (slugs.has(item.slug)) invalid(`duplicate slug ${item.slug}`)
    slugs.add(item.slug)
  }
  const communities = properties.filter((item) => item.kind === 'development').map((overview) => {
    const collections = properties.filter((item) => belongsToShowcaseCommunity(item, overview))
    return {
      overview,
      collections,
      groups: collectionGroupsFor(collections),
      designCount: collections.reduce((count, collection) => count + collection.designs.length, 0),
    }
  })
  return {
    preparedOn: optionalText(root.preparedOn) ?? 'unknown date',
    properties,
    communities,
    readyHomes: properties.filter((item) => item.kind === 'property'),
  }
}

let catalogue: ShowcaseCatalogue | undefined

export function getShowcaseCatalogue(): ShowcaseCatalogue {
  catalogue ??= buildCatalogue()
  return catalogue
}

export function findShowcaseProperty(slug: string): ShowcaseProperty | undefined {
  return getShowcaseCatalogue().properties.find((item) => item.slug === slug)
}

export function findShowcaseCommunity(item: ShowcaseProperty): ShowcaseCommunity | undefined {
  return getShowcaseCatalogue().communities.find((community) =>
    community.overview.id === item.id || belongsToShowcaseCommunity(item, community.overview))
}

export function findShowcaseDesign(item: ShowcaseProperty, key: string | undefined): ShowcaseDesign | undefined {
  return key ? item.designs.find((design) => design.key === key) : undefined
}

export function showcaseLocationGroups(): PropertyLocationGroup[] {
  return buildPropertyLocationGroups(getShowcaseCatalogue().properties.filter((item) => item.kind !== 'development'))
}

export function showcaseTypeOptions(): string[] {
  return [...new Set(getShowcaseCatalogue().properties.filter((item) => item.kind !== 'development').map((item) => item.unitType))]
}

export function showcaseBedroomOptions(): number[] {
  return [...new Set(getShowcaseCatalogue().properties.flatMap((item) => typeof item.bedrooms === 'number' ? [item.bedrooms] : []))]
    .sort((a, b) => a - b)
}

/** Built-up area range across a collection's brochure designs. */
export function builtUpAreaRange(item: ShowcaseProperty): string | undefined {
  const areas = item.designs.map((design) => design.builtUpAreaSqFt)
  if (!areas.length) return undefined
  return formatAreaRange(Math.min(...areas), Math.max(...areas))
}

/** "4-bedroom villas" for a collection; falls back to the supplied title. */
export function collectionLabel(item: ShowcaseProperty): string {
  const group = HOME_TYPES.find((entry) => entry.type === item.unitType)
  return typeof item.bedrooms === 'number' && group
    ? `${item.bedrooms}-bedroom ${group.title.toLowerCase()}` : item.title
}


export interface ShowcaseSearchResult {
  search: ShowcaseSearch
  hasFilters: boolean
  communities: ShowcaseCommunity[]
  readyHomes: ShowcaseProperty[]
  /** Communities plus ready homes: the number a buyer would count as results. */
  total: number
  collectionCount: number
}

/**
 * A community stays visible while any of its collections match, showing only
 * those collections. Type and bedroom filters never match the overview itself,
 * so "5+ bedrooms" shows Florence with its five- and six-bedroom villas only.
 */
export function searchShowcase(search: ShowcaseSearch, source: ShowcaseCatalogue = getShowcaseCatalogue()): ShowcaseSearchResult {
  const communities = source.communities.flatMap((community) => {
    const collections = community.collections.filter((collection) => matchesShowcaseSearch(collection, search))
    const overviewMatches = search.type === undefined && search.beds === undefined &&
      matchesShowcaseSearch(community.overview, search)
    if (!collections.length && !overviewMatches) return []
    const shown = collections.length ? collections : community.collections
    return [{ ...community, collections: shown, groups: collectionGroupsFor(shown) }]
  })
  const readyHomes = source.readyHomes.filter((home) => matchesShowcaseSearch(home, search))
  return {
    search,
    hasFilters: hasShowcaseFilters(search),
    communities,
    readyHomes,
    total: communities.length + readyHomes.length,
    collectionCount: communities.reduce((count, community) => count + community.collections.length, 0),
  }
}
