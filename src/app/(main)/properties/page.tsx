import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowRight, MapPin, BedDouble, Building2, X } from 'lucide-react'
import { sanityFetch, urlFor } from '@/sanity'
import { PROPERTIES_QUERY } from '@/sanity/queries'
import { EmptyStateCTA } from '@/components/properties/empty-state-cta'

interface PropertyCard {
  _id: string
  title: string
  slug: string
  community: string
  masterDevelopment?: string
  city: string
  country?: string
  developer?: string
  unitType: string
  bedrooms?: number
  priceDisplay?: string
  sizeDisplay?: string
  completionStatus?: string
  summary: string
  featured?: boolean
  featuredImage?: { alt?: string } & Record<string, unknown>
}

// Friendly property-type buckets used by the hero search → real schema unitTypes
const TYPE_GROUPS: Record<string, string[]> = {
  Apartment: [
    'Studio',
    '1 Bedroom',
    '2 Bedroom',
    '3 Bedroom',
    'Terrace Apartment',
  ],
  Villa: ['Villa'],
  Mansion: ['Mansion'],
  Penthouse: ['Penthouse'],
  Townhouse: ['Townhouse'],
}

interface SearchParams {
  intent?: string
  location?: string
  type?: string
  beds?: string
}

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed',
  'off-plan': 'Off-plan',
  'completed-offplan': 'Completed & off-plan',
}

export const metadata: Metadata = {
  title: 'Properties | Haus of Estate',
  description:
    'Explore homes across our partner communities — starting with Al Furjan, Dubai. Enquire and we will connect you with a vetted agent.',
  openGraph: {
    title: 'Properties | Haus of Estate',
    description:
      'Explore homes across our partner communities — starting with Al Furjan, Dubai.',
    type: 'website',
  },
}

export const revalidate = 60

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const intent = params.intent === 'rent' ? 'rent' : 'buy'
  const locationFilter = params.location?.trim() || ''
  const typeFilter = params.type?.trim() || ''
  const bedsFilter = params.beds ? parseInt(params.beds, 10) : NaN

  const { data: properties } = await sanityFetch<PropertyCard[]>({
    query: PROPERTIES_QUERY,
  })
  const all = properties ?? []

  // ── Filter pipeline ────────────────────────────────────────────────
  const allowedUnitTypes = typeFilter ? TYPE_GROUPS[typeFilter] : null
  const minBeds = Number.isFinite(bedsFilter) ? bedsFilter : null
  const locLC = locationFilter.toLowerCase()

  const list = all.filter((p) => {
    if (locLC) {
      const hay = [p.community, p.city, p.country, p.masterDevelopment]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(locLC)) return false
    }
    if (allowedUnitTypes && !allowedUnitTypes.includes(p.unitType)) return false
    if (minBeds !== null) {
      if (typeof p.bedrooms !== 'number') return false
      if (p.bedrooms < minBeds) return false
    }
    return true
  })

  const activeFilters: { label: string; key: keyof SearchParams }[] = []
  if (locationFilter) activeFilters.push({ label: locationFilter, key: 'location' })
  if (typeFilter) activeFilters.push({ label: typeFilter, key: 'type' })
  if (minBeds !== null)
    activeFilters.push({
      label: minBeds === 0 ? 'Studio' : `${minBeds}+ bedrooms`,
      key: 'beds',
    })
  if (params.intent === 'rent')
    activeFilters.push({ label: 'To rent', key: 'intent' })

  const hasFilters = activeFilters.length > 0

  function buildHrefWithout(key: keyof SearchParams) {
    const next = new URLSearchParams()
    if (params.intent && key !== 'intent') next.set('intent', params.intent)
    if (params.location && key !== 'location')
      next.set('location', params.location)
    if (params.type && key !== 'type') next.set('type', params.type)
    if (params.beds && key !== 'beds') next.set('beds', params.beds)
    const qs = next.toString()
    return qs ? `/properties?${qs}` : '/properties'
  }

  // Group by community for display
  const byCommunity = new Map<string, PropertyCard[]>()
  for (const p of list) {
    const c = p.community || 'Other'
    if (!byCommunity.has(c)) byCommunity.set(c, [])
    byCommunity.get(c)!.push(p)
  }
  const communities = [...byCommunity.entries()]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            Properties
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-5xl">
            Homes in communities{' '}
            <span className="text-gold-400">worth living in.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            A considered selection across our partner communities. Tell us what
            you&apos;re after and we&apos;ll connect you with a vetted agent —
            no hard sell, no obligation.
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          {/* Result summary + active filters */}
          {hasFilters && (
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-estate-700">
                {list.length === 0
                  ? `No ${intent === 'rent' ? 'rentals' : 'listings'} match your filters`
                  : `Showing ${list.length} ${list.length === 1 ? 'listing' : 'listings'}${intent === 'rent' ? ' to rent' : ''}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((f) => (
                  <Link
                    key={f.key}
                    href={buildHrefWithout(f.key)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-estate-700/30 hover:text-estate-700"
                  >
                    {f.label}
                    <X className="h-3 w-3" />
                  </Link>
                ))}
                <Link
                  href="/properties"
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-estate-700 hover:underline"
                >
                  Clear all
                </Link>
              </div>
            </div>
          )}

          {communities.length === 0 ? (
            hasFilters ? (
              <EmptyStateCTA intent={intent} />
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
                    {items.map((p) => (
                      <Link
                        key={p._id}
                        href={`/properties/${p.slug}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-estate-700/40 hover:shadow-xl hover:shadow-estate-700/5"
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
                          {p.completionStatus && (
                            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-estate-700 shadow-sm">
                              {COMPLETION_LABEL[p.completionStatus] ??
                                p.completionStatus}
                            </span>
                          )}
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
                              {p.priceDisplay || 'Price on application'}
                            </span>
                            <span className="flex items-center gap-3 text-xs text-muted-foreground">
                              {typeof p.bedrooms === 'number' && (
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
                    ))}
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
