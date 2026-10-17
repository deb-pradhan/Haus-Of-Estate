// ─────────────────────────────────────────────────────────────────────────
// Shared presentation helpers + types for property cards, listing and detail.
//
// Rule: every helper hides what the data lacks. Nothing here invents a value.
// Optional fields (tenure, permit numbers, completion date ...) are read when
// they exist in Sanity; they are not part of the schema yet.
// ─────────────────────────────────────────────────────────────────────────
import { urlFor } from '@/sanity'
import { bedroomsHidden } from '@/lib/property-taxonomy'
import {
  isConceptMedia,
  type PropertyImageMetadata,
} from '@/lib/property-media'

export const SITE_ORIGIN = 'https://hausofestate.com'

/** Mirrors the number used by the site header and WhatsApp float. */
export const WHATSAPP_NUMBER = '971585607033'

export type SanityImage = PropertyImageMetadata & {
  alt?: string
} & Record<string, unknown>

export interface PropertyCardData {
  _id: string
  title: string
  slug: string
  community?: string
  masterDevelopment?: string
  city?: string
  country?: string
  developer?: string
  category?: string
  availability?: string[]
  listingType?: string[]
  unitType: string
  bedrooms?: number | null
  bathrooms?: number | null
  sizeDisplay?: string | null
  plotSizeDisplay?: string | null
  priceDisplay?: string | null
  rentPriceDisplay?: string | null
  paymentPlan?: string | null
  view?: string | null
  completionStatus?: string | null
  summary?: string
  featured?: boolean
  publishedAt?: string | null
  featuredImage?: SanityImage | null
  // Optional, not yet in the schema (null-safe reads).
  tenure?: string | null
  completionDate?: string | null
}

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed',
  'off-plan': 'Off-plan',
  'completed-offplan': 'Completed & off-plan',
}

/** The single status label shown as a badge (Ready / Off-plan / ...). */
export function statusLabel(p: {
  completionStatus?: string | null
  availability?: string[]
}): string | undefined {
  if (p.completionStatus) {
    return COMPLETION_LABEL[p.completionStatus] ?? p.completionStatus
  }
  if (p.availability?.includes('ready')) return 'Ready'
  return undefined
}

export function isOffPlan(p: {
  completionStatus?: string | null
  availability?: string[]
}): boolean {
  return (
    p.completionStatus === 'off-plan' ||
    p.completionStatus === 'completed-offplan' ||
    Boolean(p.availability?.includes('off-plan'))
  )
}

export function isRentOnly(p: { listingType?: string[] }): boolean {
  return Boolean(p.listingType?.includes('rent') && !p.listingType?.includes('sale'))
}

/** Placeholder strings that mean "no value" in free-text fields. */
function meaningful(value?: string | null): string | undefined {
  const v = value?.trim()
  if (!v) return undefined
  if (/^(on application|tbc|tba|n\/a)$/i.test(v)) return undefined
  return v
}

export function cleanText(value?: string | null) {
  return meaningful(value)
}

/** Headline price for a card or detail page. */
export function priceText(
  p: Pick<PropertyCardData, 'priceDisplay' | 'rentPriceDisplay' | 'listingType'>,
  rentContext = false,
): string {
  const rent = rentContext || isRentOnly(p)
  if (rent && p.rentPriceDisplay?.trim()) return p.rentPriceDisplay.trim()
  return p.priceDisplay?.trim() || 'Price on request'
}

export function locationLine(
  p: Pick<PropertyCardData, 'community' | 'city' | 'country'>,
  withCountry = false,
): string {
  const parts = [p.community, p.city, withCountry ? p.country : undefined]
  const seen = new Set<string>()
  return parts
    .filter((x): x is string => Boolean(x?.trim()))
    .filter((x) => {
      const k = x.trim().toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .join(', ')
}

export type FactIcon = 'bed' | 'bath' | 'area' | 'tenure' | 'type'

export interface Fact {
  icon: FactIcon
  label: string
  value: string
}

/** Up to `max` key facts for a card, hiding anything the data lacks. */
export function cardFacts(p: PropertyCardData, max = 3): Fact[] {
  const facts: Fact[] = []
  if (typeof p.bedrooms === 'number' && !bedroomsHidden(p.category, p.unitType)) {
    facts.push({
      icon: 'bed',
      label: 'Bedrooms',
      value: p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`,
    })
  }
  if (typeof p.bathrooms === 'number') {
    facts.push({ icon: 'bath', label: 'Bathrooms', value: `${p.bathrooms} bath` })
  }
  const size = meaningful(p.sizeDisplay)
  if (size) facts.push({ icon: 'area', label: 'Floor area', value: size })
  const tenure = meaningful(p.tenure)
  if (tenure) facts.push({ icon: 'tenure', label: 'Tenure', value: tenure })
  const plot = meaningful(p.plotSizeDisplay)
  if (plot) facts.push({ icon: 'area', label: 'Plot', value: plot })
  return facts.slice(0, max)
}

/** Descriptive alt text when the CMS image has none. */
export function cardAlt(p: PropertyCardData): string {
  if (p.featuredImage?.alt) return p.featuredImage.alt
  const beds =
    typeof p.bedrooms === 'number' && !bedroomsHidden(p.category, p.unitType)
      ? p.bedrooms === 0
        ? 'Studio'
        : `${p.bedrooms}-bedroom`
      : ''
  const place = locationLine(p)
  return [beds, p.unitType, place ? `in ${place}` : '']
    .filter(Boolean)
    .join(' ')
    .trim() || p.title
}

/** Sanity image to a sized URL; concept images are never cropped. */
export function imageUrl(
  image: SanityImage,
  width: number,
  height?: number,
): string {
  if (isConceptMedia(image)) {
    return urlFor(image).ignoreImageParams().width(width).fit('max').url()
  }
  const b = urlFor(image).width(width)
  return (height ? b.height(height) : b).url()
}

/** Pre-filled WhatsApp deep link carrying the listing title and URL. */
export function whatsAppHref(title: string, slug: string): string {
  const url = `${SITE_ORIGIN}/properties/${slug}`
  const text = `Hello Haus of Estate, I'm interested in ${title} (${url}). Could you tell me more?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}&utm_source=site&utm_medium=property&utm_campaign=whatsapp`
}
