interface PropertyPricing { priceAmount?: number; priceCurrency?: string; priceDisplay?: string }
const isPriceAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
import type { PropertyImageMetadata, PropertyMediaImage } from './property-media'

export interface DevelopmentProperty extends PropertyPricing {
  _id: string
  title: string
  slug: string
  community: string
  city: string
  country?: string
  masterDevelopment?: string
  unitType?: string
  bedrooms?: number
  summary: string
  amenities?: string[]
  featuredImage?: PropertyImageMetadata & { alt?: string } & Record<string, unknown>
  designImage?: PropertyMediaImage & { label?: string }
  designCount?: number
}

export interface PropertyDevelopment extends DevelopmentProperty {
  collections: DevelopmentProperty[]
}

const homeTypes = [
  { type: 'Villa', title: 'Villas', id: 'villas' },
  { type: 'Townhouse', title: 'Townhouses', id: 'townhouses' },
] as const

// The relationship uses the existing Sanity property fields. A shared place
// name alone must not combine unrelated developments or markets.
export function belongsToDevelopment(home: DevelopmentProperty, overview: DevelopmentProperty) {
  return overview.unitType === 'Development' &&
    home._id !== overview._id && home.masterDevelopment === overview.title &&
    Boolean(overview.community && overview.city && overview.country) &&
    home.community === overview.community && home.city === overview.city && home.country === overview.country &&
    homeTypes.some(({ type }) => type === home.unitType)
}

export function developmentHomeGroups(homes: DevelopmentProperty[]) {
  return homeTypes.map((group) => ({
    ...group,
    homes: homes.filter((home) => home.unitType === group.type)
      .sort((a, b) => (a.bedrooms ?? 0) - (b.bedrooms ?? 0)),
  })).filter(({ homes: members }) => members.length > 0)
}

export function developmentStartingPrice(homes: DevelopmentProperty[]) {
  const currency = homes[0]?.priceCurrency
  if (!homes.length || !currency || homes.some((home) =>
    home.priceCurrency !== currency || !isPriceAmount(home.priceAmount))) return undefined
  return {
    amount: Math.min(...homes.map((home) => home.priceAmount!)),
    currency,
    scope: homes.every((home) => home.priceDisplay?.includes('Clusters 1 & 2')) ? 'Clusters 1 & 2' : undefined,
  }
}

/** Only accept developments from the strict published query, never local bundles. */
export function groupDevelopmentResults<T extends DevelopmentProperty>(
  results: T[], developments: PropertyDevelopment[],
) {
  const matchingIds = new Set(results.map(({ _id }) => _id))
  const groupedIds = new Set<string>()
  const groups = developments.flatMap((overview) => {
    if (overview.unitType !== 'Development') return []
    const collections = (overview.collections ?? []).filter((home) =>
      belongsToDevelopment(home, overview) && matchingIds.has(home._id))
    if (!matchingIds.has(overview._id) && !collections.length) return []
    groupedIds.add(overview._id)
    for (const home of collections) groupedIds.add(home._id)
    return [{ ...overview, collections }]
  })
  return { groups, properties: results.filter(({ _id }) => !groupedIds.has(_id)) }
}

export function findPropertyDevelopment(property: DevelopmentProperty, developments: PropertyDevelopment[]) {
  return developments.find((overview) => overview._id === property._id || belongsToDevelopment(property, overview))
}
