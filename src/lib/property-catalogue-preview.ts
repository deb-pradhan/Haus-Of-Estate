import 'server-only'

import { loadPropertyPreviews, type PropertyPreview } from './property-previews'
import { matchesPropertySearch } from './property-search'
import { bedroomsHidden, isAvailability, isCategory, isIntent } from './property-taxonomy'

export interface PropertyCataloguePreviewParams {
  category?: string
  availability?: string
  intent?: string
  type?: string
  country?: string
  city?: string
  location?: string
  beds?: string
  q?: string
  minPrice?: string
  maxPrice?: string
  currency?: string
}

export interface PropertyCataloguePreviewGroup {
  overview: PropertyPreview
  homes: PropertyPreview[]
}

export function isLocalCataloguePreviewEnabled(): boolean {
  return process.env.NODE_ENV === 'development' &&
    process.env.HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW === 'true'
}

function locationKey(value: string | undefined) {
  return value?.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-GB') ?? ''
}

function communityKey(preview: PropertyPreview) {
  const { community, city, country } = preview.document
  return JSON.stringify([community, city, country].map(locationKey))
}

/** Editorial collection cards only; these records never enter the public Sanity catalogue. */
export async function loadCataloguePreviewGroups(
  params: PropertyCataloguePreviewParams = {},
): Promise<PropertyCataloguePreviewGroup[]> {
  if (!isLocalCataloguePreviewEnabled()) return []
  const previews = await loadPropertyPreviews()
  const category = isCategory(params.category) ? params.category : undefined
  const availability = isAvailability(params.availability) ? params.availability : undefined
  const intent = availability === 'off-plan' ? 'sale' : isIntent(params.intent) ? params.intent : undefined
  const type = params.type?.trim() || undefined
  const country = locationKey(params.country)
  const city = locationKey(params.city)
  const location = locationKey(params.location)
  const parsedBeds = params.beds ? Number.parseInt(params.beds, 10) : NaN
  const minimumBeds = !bedroomsHidden(category, type) && Number.isInteger(parsedBeds) && parsedBeds >= 0
    ? parsedBeds : undefined
  const currency = ['GBP', 'AED', 'USD'].includes(params.currency ?? '') ? params.currency : 'GBP'

  function matches(preview: PropertyPreview) {
    const document = preview.document
    if (category && document.category !== category) return false
    // Unlike the legacy public query, preview records do not default to ready.
    if (availability && (!Array.isArray(document.availability) || !document.availability.includes(availability))) return false
    if (intent === 'rent' && !document.listingType?.includes('rent')) return false
    // Sale browsing may include editorial collections with unconfirmed inventory.
    // Do not add listingType or imply that individual homes are available for sale.
    if (intent === 'sale' && document.listingType?.length && !document.listingType.includes('sale')) return false
    if (type && document.unitType !== type) return false
    if (country && locationKey(document.country) !== country) return false
    if (city && locationKey(document.city) !== city) return false
    if (location && ![document.community, document.city, document.country, document.masterDevelopment]
      .map(locationKey).join(' ').includes(location)) return false
    if (minimumBeds !== undefined && (typeof document.bedrooms !== 'number' ||
      (minimumBeds === 0 ? document.bedrooms !== 0 : document.bedrooms < minimumBeds))) return false
    return matchesPropertySearch({ ...document, slug: document.slug.current }, {
      q: params.q, minPrice: params.minPrice, maxPrice: params.maxPrice, currency, intent,
    })
  }

  return previews.filter((preview) => preview.kind === 'development').flatMap((overview) => {
    const homes = previews.filter((preview) => preview.kind === 'home-type' &&
      communityKey(preview) === communityKey(overview) && matches(preview))
    return homes.length || matches(overview) ? [{ overview, homes }] : []
  })
}
