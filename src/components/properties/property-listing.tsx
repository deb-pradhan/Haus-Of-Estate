import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { sanityFetch } from '@/sanity'
import { PROPERTIES_QUERY } from '@/sanity/queries'
import { EmptyStateCTA } from '@/components/properties/empty-state-cta'
import { Breadcrumbs } from '@/components/properties/breadcrumbs'
import {
  FilterBar,
  type FilterOption,
  type FilterSegment,
} from '@/components/properties/filter-bar'
import { PropertyGrid } from '@/components/property/property-grid'
import { OpenBuyerButton } from '@/components/lead-modal/open-buyer-button'
import { Reveal } from '@/components/ui/reveal'
import type { PropertyCardData } from '@/lib/property-format'
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
  buildPropertiesHref,
} from '@/lib/property-taxonomy'

export interface PropertyListingSearchParams {
  category?: string
  availability?: string
  intent?: string
  type?: string
  location?: string
  beds?: string
  sort?: string
}

type FilterKey = 'category' | 'availability' | 'intent' | 'type' | 'location' | 'beds'
type SortKey = 'featured' | 'newest'

const SORT_OPTIONS: FilterOption[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
]

function distinctCI(values: (string | undefined)[]): string[] {
  const seen = new Map<string, string>()
  for (const v of values) {
    const t = v?.trim()
    if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t)
  }
  return [...seen.values()]
}

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
  // ── Normalise the selection from the URL ──────────────────────────────
  const category: '' | Category =
    forceCategory ?? (isCategory(params.category) ? params.category : '')
  const availability: '' | Availability = isAvailability(params.availability)
    ? params.availability
    : ''
  let intent: '' | Intent = isIntent(params.intent) ? params.intent : ''
  // Off-plan is buy-only.
  if (availability === 'off-plan') intent = 'sale'

  const type = params.type?.trim() || ''
  const location = params.location?.trim() || ''
  const sort: SortKey = params.sort === 'newest' ? 'newest' : 'featured'
  const bedsRaw = params.beds ? parseInt(params.beds, 10) : NaN

  const hideBeds =
    category === 'commercial' || (type !== '' && LAND_TYPES.includes(type))
  const minBeds = !hideBeds && Number.isFinite(bedsRaw) ? bedsRaw : null

  // ── Fetch once, then filter in the server component ───────────────────
  const { data } = await sanityFetch<PropertyCardData[]>({ query: PROPERTIES_QUERY })
  const all = data ?? []
  const scope = category ? all.filter((p) => p.category === category) : all

  const locLC = location.toLowerCase()
  let list = scope.filter((p) => {
    if (availability && !p.availability?.includes(availability)) return false
    if (intent && !p.listingType?.includes(intent)) return false
    if (type && p.unitType !== type) return false
    if (locLC) {
      const hay = [p.community, p.city, p.country, p.masterDevelopment]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(locLC)) return false
    }
    if (minBeds !== null) {
      if (typeof p.bedrooms !== 'number' || p.bedrooms < minBeds) return false
    }
    return true
  })

  if (sort === 'newest') {
    list = [...list].sort(
      (a, b) =>
        (Date.parse(b.publishedAt ?? '') || 0) - (Date.parse(a.publishedAt ?? '') || 0),
    )
  }

  // ── Filter options come from real inventory only ──────────────────────
  const cities = distinctCI(scope.map((p) => p.city))
  const communities = distinctCI(scope.map((p) => p.community)).filter(
    (c) => !cities.some((city) => city.toLowerCase() === c.toLowerCase()),
  )
  const locationOptions: FilterOption[] = [
    ...cities.map((c) => ({ value: c, label: c })),
    ...communities.map((c) => {
      const city = scope.find((p) => p.community?.trim().toLowerCase() === c.toLowerCase())?.city
      return { value: c, label: city ? `${c}, ${city}` : c }
    }),
  ]
  if (location && !locationOptions.some((o) => o.value.toLowerCase() === locLC)) {
    locationOptions.push({ value: location, label: location })
  }
  const typeOptions: FilterOption[] = distinctCI(scope.map((p) => p.unitType)).map((t) => ({
    value: t,
    label: t,
  }))
  if (type && !typeOptions.some((o) => o.value === type)) {
    typeOptions.push({ value: type, label: type })
  }
  const bedsOptions: FilterOption[] | null = hideBeds
    ? null
    : [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` }))

  // ── URLs ──────────────────────────────────────────────────────────────
  const current = {
    category: category || undefined,
    availability: availability || undefined,
    intent: intent || undefined,
    type: type || undefined,
    location: location || undefined,
    beds: minBeds === null ? undefined : minBeds,
    sort,
  }
  const hrefFor = (override: Partial<typeof current>) =>
    buildPropertiesHref({ ...current, ...override })

  const segments: FilterSegment[] = [
    {
      label: 'All',
      href: hrefFor({ availability: undefined, intent: undefined }),
      active: !availability && !intent,
    },
    {
      label: 'Buy',
      href: hrefFor({ availability: undefined, intent: 'sale' }),
      active: availability !== 'off-plan' && intent === 'sale',
    },
    {
      label: 'Rent',
      href: hrefFor({ availability: undefined, intent: 'rent' }),
      active: intent === 'rent',
    },
    {
      label: 'Off-plan',
      href: hrefFor({ availability: 'off-plan', intent: undefined }),
      active: availability === 'off-plan',
    },
  ]

  const carry: Record<string, string> = {}
  if (category) carry.category = category
  if (availability) carry.availability = availability
  if (intent && availability !== 'off-plan') carry.intent = intent

  // ── Active-filter chips ───────────────────────────────────────────────
  const activeFilters: { label: string; key: FilterKey }[] = []
  if (category && !forceCategory)
    activeFilters.push({ label: CATEGORY_LABELS[category], key: 'category' })
  if (availability)
    activeFilters.push({ label: AVAILABILITY_LABELS[availability], key: 'availability' })
  if (intent && availability !== 'off-plan')
    activeFilters.push({ label: INTENT_LABELS[intent], key: 'intent' })
  if (type) activeFilters.push({ label: type, key: 'type' })
  if (location) activeFilters.push({ label: location, key: 'location' })
  if (minBeds !== null)
    activeFilters.push({
      label: minBeds === 0 ? 'Studio' : `${minBeds}+ bedrooms`,
      key: 'beds',
    })

  const hasFilters = activeFilters.length > 0
  const clearAllHref = buildPropertiesHref({
    category: forceCategory,
    sort: sort === 'newest' ? sort : undefined,
  })
  const rentContext = intent === 'rent'

  // Community headings only when they genuinely help scanning.
  const byCommunity = new Map<string, PropertyCardData[]>()
  for (const p of list) {
    const c = p.community?.trim() || 'Other'
    byCommunity.set(c, [...(byCommunity.get(c) ?? []), p])
  }
  const groupByCommunity =
    sort === 'featured' &&
    list.length >= 6 &&
    byCommunity.size > 1 &&
    [...byCommunity.values()].some((items) => items.length > 1)

  const count = list.length
  const countText =
    count === 0
      ? 'No properties match'
      : `${count} ${count === 1 ? 'property' : 'properties'}${rentContext ? ' to rent' : ''}`

  return (
    <div className="pb-20 md:pb-28">
      {/* Intro */}
      <section className="px-4 pt-3 md:px-6">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            category={category || undefined}
            availability={availability || undefined}
            intent={intent || undefined}
            type={type || undefined}
          />
          <div className="max-w-3xl pb-8 pt-4 md:pb-10 md:pt-6">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-[length:var(--text-title-1)] font-medium leading-[1.05] tracking-[-0.015em] text-estate-900">
              {heading ?? (
                <>
                  Homes in communities{' '}
                  <span className="text-gold-700">worth living in.</span>
                </>
              )}
            </h1>
            <p className="lede mt-4">
              {intro ??
                'The homes we currently have published, across Dubai and the UK. Tell us what you are looking for and an adviser will reply to you directly, with no obligation.'}
            </p>
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <section className="px-4 md:px-6" aria-label="Search and filter properties">
        <div className="mx-auto max-w-7xl">
          <FilterBar
            segments={segments}
            carry={carry}
            location={location}
            locationOptions={locationOptions}
            type={type}
            typeOptions={typeOptions}
            beds={minBeds === null ? '' : String(minBeds)}
            bedsOptions={bedsOptions}
            sort={sort}
            sortOptions={SORT_OPTIONS}
          />
        </div>
      </section>

      {/* Results */}
      <section className="px-4 pt-8 md:px-6 md:pt-10" aria-labelledby="results-heading">
        <div className="mx-auto max-w-7xl">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p role="status" className="text-base font-semibold text-estate-900 tabular-nums">
              {countText}
            </p>
            {hasFilters && (
              <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                {activeFilters.map((f) => (
                  <li key={f.key}>
                    <Link
                      href={hrefFor(
                        f.key === 'beds' ? { beds: undefined } : { [f.key]: undefined },
                      )}
                      scroll={false}
                      aria-label={`Remove filter: ${f.label}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-sm text-estate-900 shadow-e1 transition-shadow hover:shadow-e2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/60"
                    >
                      {f.label}
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={clearAllHref}
                    scroll={false}
                    className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-estate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/60"
                  >
                    Clear filters
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {count === 0 ? (
            <EmptyStateCTA
              category={category || undefined}
              intent={intent || undefined}
              clearHref={hasFilters ? clearAllHref : undefined}
            />
          ) : groupByCommunity ? (
            <div className="space-y-14">
              {[...byCommunity.entries()].map(([community, items]) => (
                <div key={community}>
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900">
                      {community}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {items[0]?.city}
                      {items[0]?.developer ? ` · ${items[0].developer}` : ''}
                    </p>
                  </div>
                  <PropertyGrid
                    properties={items}
                    rentContext={rentContext}
                    headingLevel="h3"
                    revealFrom={3}
                  />
                </div>
              ))}
            </div>
          ) : (
            <PropertyGrid
              properties={list}
              rentContext={rentContext}
              headingLevel="h3"
              revealFrom={3}
            />
          )}

          {count > 0 && (
            <>
              <Reveal className="mt-14 rounded-[28px] bg-estate-900 px-6 py-10 text-center text-white md:px-12 md:py-14">
                <h2 className="font-serif text-[length:var(--text-title-3)] font-medium">
                  Can&apos;t see the right property?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/80">
                  Tell us where, what and roughly when, and an adviser will reply to you
                  directly with suitable options.
                </p>
                <OpenBuyerButton size="lg" variant="gold" className="mt-6">
                  Tell us what you&apos;re looking for
                  <ArrowRight aria-hidden="true" />
                </OpenBuyerButton>
              </Reveal>
              <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                Prices are asking prices as supplied by the seller or developer; indicative;
                subject to availability.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
