import Link from 'next/link'
import Image from 'next/image'
import { MapPin, BedDouble, Building2, X } from 'lucide-react'
import { urlFor } from '@/sanity'
import { sanityFetch } from '@/sanity/live'
import { PROPERTIES_FILTERED_QUERY } from '@/sanity/queries'
import { EmptyStateCTA } from '@/components/properties/empty-state-cta'
import { Breadcrumbs } from '@/components/properties/breadcrumbs'
import { SaveContentButton } from '@/components/saved-content'
import { PropertyAssistantSearchEntry } from '@/components/property-assistant/property-assistant-search-entry'
import { isPropertyAssistantEnabled } from '@/lib/features'
import {
  type Category,
  type Availability,
  type Intent,
  CATEGORY_LABELS,
  AVAILABILITY_LABELS,
  INTENT_LABELS,
  LAND_TYPES,
  isCategory,
  isAvailability,
  isIntent,
  bedroomsHidden,
  buildPropertiesHref,
} from '@/lib/property-taxonomy'

interface PropertyCard {
  _id: string
  title: string
  slug: string
  community: string
  masterDevelopment?: string
  city: string
  country?: string
  developer?: string
  category?: string
  availability?: string[]
  listingType?: string[]
  unitType: string
  bedrooms?: number
  priceDisplay?: string
  rentPriceDisplay?: string
  sizeDisplay?: string
  completionStatus?: string
  summary: string
  featured?: boolean
  featuredImage?: { alt?: string } & Record<string, unknown>
}

export interface PropertyListingSearchParams {
  category?: string
  availability?: string
  intent?: string
  type?: string
  country?: string
  city?: string
  location?: string
  beds?: string
}

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed',
  'off-plan': 'Off-plan',
  'completed-offplan': 'Completed & off-plan',
}

function saleRentLabel(listingType?: string[]): string | null {
  if (!listingType || listingType.length === 0) return null
  const sale = listingType.includes('sale')
  const rent = listingType.includes('rent')
  if (sale && rent) return 'Sale · Rent'
  if (rent) return 'For rent'
  if (sale) return 'For sale'
  return null
}

type FilterKey =
  | 'category'
  | 'availability'
  | 'intent'
  | 'type'
  | 'country'
  | 'city'
  | 'location'
  | 'beds'

export async function PropertyListing({
  params,
  forceCategory,
  eyebrow = 'Properties',
  heading,
  intro,
}: {
  params: PropertyListingSearchParams
  forceCategory?: Category
  eyebrow?: string
  heading?: React.ReactNode
  intro?: string
}) {
  const assistantEnabled = isPropertyAssistantEnabled()
  // ── Normalise the taxonomy selection ──────────────────────────────────
  const category: '' | Category =
    forceCategory ?? (isCategory(params.category) ? params.category : '')
  const availability: '' | Availability = isAvailability(params.availability)
    ? params.availability
    : ''
  let intent: '' | Intent = isIntent(params.intent) ? params.intent : ''
  // Off-plan is buy-only.
  if (availability === 'off-plan') intent = 'sale'

  const type = params.type?.trim() || ''
  const country = params.country?.trim() || ''
  const city = params.city?.trim() || ''
  const location = params.location?.trim() || ''
  const bedsRaw = params.beds ? parseInt(params.beds, 10) : NaN

  const hideBeds =
    category === 'commercial' || (type !== '' && LAND_TYPES.includes(type))
  const minBeds = !hideBeds && Number.isFinite(bedsRaw) ? bedsRaw : null

  // ── Fetch (server-side GROQ filtering) ────────────────────────────────
  const { data: properties } = await sanityFetch<PropertyCard[]>({
    query: PROPERTIES_FILTERED_QUERY,
    params: {
      category: category || '',
      availability: availability || '',
      intent: intent || '',
      type: type || '',
    },
  })
  const fetched = properties ?? []

  // ── Remaining JS filters (geography + beds) ──────────────────────────
  const countryLC = country.toLocaleLowerCase('en-GB')
  const cityLC = city.toLocaleLowerCase('en-GB')
  const locLC = location.toLowerCase()
  const list = fetched.filter((p) => {
    if (
      countryLC &&
      p.country?.trim().toLocaleLowerCase('en-GB') !== countryLC
    ) {
      return false
    }
    if (cityLC && p.city?.trim().toLocaleLowerCase('en-GB') !== cityLC) {
      return false
    }
    if (locLC) {
      const hay = [p.community, p.city, p.country, p.masterDevelopment]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(locLC)) return false
    }
    if (minBeds !== null) {
      if (typeof p.bedrooms !== 'number') return false
      if (p.bedrooms < minBeds) return false
    }
    return true
  })

  // ── Active-filter chips ───────────────────────────────────────────────
  const activeFilters: { label: string; key: FilterKey }[] = []
  // The forced category (landing route) is a fixed scope, not a removable chip.
  if (category && !forceCategory)
    activeFilters.push({ label: CATEGORY_LABELS[category], key: 'category' })
  if (availability)
    activeFilters.push({
      label: AVAILABILITY_LABELS[availability],
      key: 'availability',
    })
  if (intent && availability !== 'off-plan')
    activeFilters.push({ label: INTENT_LABELS[intent], key: 'intent' })
  if (type) activeFilters.push({ label: type, key: 'type' })
  if (country) activeFilters.push({ label: country, key: 'country' })
  if (city) activeFilters.push({ label: city, key: 'city' })
  if (location) activeFilters.push({ label: location, key: 'location' })
  if (minBeds !== null)
    activeFilters.push({
      label: minBeds === 0 ? 'Studio' : `${minBeds}+ bedrooms`,
      key: 'beds',
    })

  const hasFilters = activeFilters.length > 0
  const showBreadcrumbs = Boolean(category || availability || intent || type)

  function hrefWithout(remove: FilterKey) {
    const keepCategory = forceCategory ?? (remove === 'category' ? undefined : category || undefined)
    return buildPropertiesHref({
      category: keepCategory || undefined,
      availability: remove === 'availability' ? undefined : availability || undefined,
      intent: remove === 'intent' ? undefined : intent || undefined,
      type: remove === 'type' ? undefined : type || undefined,
      country: remove === 'country' ? undefined : country || undefined,
      city:
        remove === 'country' || remove === 'city' ? undefined : city || undefined,
      location: remove === 'location' ? undefined : location || undefined,
      beds: remove === 'beds' || minBeds === null ? undefined : minBeds,
    })
  }

  const clearAllHref = forceCategory
    ? buildPropertiesHref({ category: forceCategory })
    : '/properties'

  // ── Group by community ────────────────────────────────────────────────
  const byCommunity = new Map<string, PropertyCard[]>()
  for (const p of list) {
    const c = p.community || 'Other'
    if (!byCommunity.has(c)) byCommunity.set(c, [])
    byCommunity.get(c)!.push(p)
  }
  const communities = [...byCommunity.entries()]

  const rentContextGlobal = intent === 'rent'

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-5xl">
            {heading ?? (
              <>
                Homes in communities{' '}
                <span className="text-gold-400">worth living in.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {intro ??
              "A considered selection across our partner communities. Tell us what you're after and we'll connect you with a vetted agent — no hard sell, no obligation."}
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          {assistantEnabled && <PropertyAssistantSearchEntry />}
          {showBreadcrumbs && (
            <Breadcrumbs
              className="mb-8"
              category={category || undefined}
              availability={availability || undefined}
              intent={intent || undefined}
              type={type || undefined}
            />
          )}

          {/* Result summary + active filters */}
          {hasFilters && (
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-estate-700">
                {list.length === 0
                  ? `No ${rentContextGlobal ? 'rentals' : 'listings'} match your filters`
                  : `Showing ${list.length} ${list.length === 1 ? 'listing' : 'listings'}${rentContextGlobal ? ' to rent' : ''}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((f) => (
                  <Link
                    key={f.key}
                    href={hrefWithout(f.key)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-estate-700/30 hover:text-estate-700"
                  >
                    {f.label}
                    <X className="h-3 w-3" />
                  </Link>
                ))}
                <Link
                  href={clearAllHref}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-estate-700 hover:underline"
                >
                  Clear all
                </Link>
              </div>
            </div>
          )}

          {communities.length === 0 ? (
            hasFilters || forceCategory ? (
              <EmptyStateCTA
                category={category || undefined}
                intent={intent || undefined}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                <h2 className="font-serif text-xl font-medium text-estate-700">
                  No properties live just yet.
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Our latest community listings are being prepared. In the
                  meantime, tell us what you&apos;re looking for and an advisor
                  will be in touch.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-16">
              {communities.map(([community, items]) => (
                <div key={community}>
                  <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-serif text-2xl font-medium text-estate-700 md:text-3xl">
                      {community}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {items[0]?.city}
                      {items[0]?.developer ? ` · ${items[0].developer}` : ''}
                    </p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => {
                      const badge = saleRentLabel(p.listingType)
                      const cardRentContext =
                        rentContextGlobal ||
                        (p.listingType?.includes('rent') &&
                          !p.listingType?.includes('sale'))
                      const price =
                        cardRentContext && p.rentPriceDisplay
                          ? p.rentPriceDisplay
                          : p.priceDisplay || 'Price on application'
                      const showBeds =
                        typeof p.bedrooms === 'number' &&
                        !bedroomsHidden(p.category, p.unitType)
                      return (
                        <article
                          key={p._id}
                          className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-estate-700/40 hover:shadow-xl hover:shadow-estate-700/5"
                        >
                          <Link
                            href={`/properties/${p.slug}`}
                            className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/50 focus-visible:ring-inset"
                          >
                            <div className="relative aspect-[4/3] overflow-hidden bg-estate-700">
                              {p.featuredImage ? (
                                <Image
                                  src={urlFor(p.featuredImage)
                                    .width(800)
                                    .height(600)
                                    .url()}
                                  alt={p.featuredImage.alt || p.title}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-estate-600 to-estate-800">
                                  <Building2 className="h-10 w-10 text-white/30" />
                                </div>
                              )}
                              <div className="absolute left-3 top-3 flex max-w-[calc(100%-4.25rem)] flex-wrap items-center gap-1.5">
                                {p.completionStatus && (
                                  <span className="rounded-full bg-surface/95 px-3 py-1 text-[11px] font-semibold text-estate-700 shadow-sm">
                                    {COMPLETION_LABEL[p.completionStatus] ??
                                      p.completionStatus}
                                  </span>
                                )}
                                {badge && (
                                  <span className="rounded-full bg-estate-700/90 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                                    {badge}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                              <p className="font-serif text-[11px] font-semibold uppercase tracking-widest text-gold-500">
                                {p.unitType}
                              </p>
                              <h3 className="mt-1 font-serif text-lg font-medium text-estate-700">
                                {p.title}
                              </h3>
                              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                {p.summary}
                              </p>
                              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                <span className="font-serif text-base font-semibold text-estate-700">
                                  {price}
                                </span>
                                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {showBeds && (
                                    <span className="flex items-center gap-1">
                                      <BedDouble className="h-3.5 w-3.5" />
                                      {p.bedrooms === 0 ? 'Studio' : p.bedrooms}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {p.city}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </Link>
                          <SaveContentButton
                            contentType="PROPERTY"
                            sanityDocumentId={p._id}
                            title={p.title}
                            className="absolute right-3 top-3 z-10"
                          />
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
