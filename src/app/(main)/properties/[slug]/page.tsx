import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { ComponentProps } from 'react'
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronRight,
  Eye,
  Landmark,
  MapPin,
  Maximize2,
} from 'lucide-react'
import { sanityFetch, urlFor } from '@/sanity'
import {
  PROPERTY_BY_SLUG_QUERY,
  PROPERTY_SLUGS_QUERY,
  SIMILAR_PROPERTIES_QUERY,
} from '@/sanity/queries'
import { PortableTextRenderer } from '@/components/blog'
import { ConsentEmbed } from '@/components/media/consent-embed'
import { RiskWarning } from '@/components/legal/risk-warning'
import { JsonLd } from '@/components/seo/json-ld'
import { OpenBuyerButton } from '@/components/lead-modal/open-buyer-button'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { PropertyGrid } from '@/components/property/property-grid'
import { PropertyGallery, type GalleryImage } from '@/components/properties/property-gallery'
import { EnquiryForm } from '@/components/properties/enquiry-form'
import { StickyCta } from '@/components/properties/sticky-cta'
import { WhatsAppButton } from '@/components/properties/whatsapp-button'
import {
  MaterialInfo,
  type InfoGroup,
  type InfoRow,
} from '@/components/properties/material-info'
import { toEmbedUrl } from '@/lib/embed-video'
import { breadcrumbJsonLd, propertyMetadata } from '@/lib/seo'
import { INTRODUCER_ROLE_COPY } from '@/lib/site-claims'
import { CATEGORY_LABELS, bedroomsHidden, buildPropertiesHref, isCategory } from '@/lib/property-taxonomy'
import {
  cleanText,
  imageUrl,
  isOffPlan,
  isRentOnly,
  locationLine,
  priceText,
  statusLabel,
  whatsAppHref,
  type PropertyCardData,
  type SanityImage,
} from '@/lib/property-format'
import {
  isConceptMedia,
  propertyMediaCaption,
  type PropertyMediaImage,
} from '@/lib/property-media'

interface LocationBenefit {
  destination?: string
  time?: string
}

interface PropertyDetail extends PropertyCardData {
  unitNumber?: string
  description?: unknown
  keyFeatures?: string[]
  amenities?: string[]
  locationBenefits?: LocationBenefit[]
  gallery?: (SanityImage & { asset?: { _ref?: string } })[]
  floorPlans?: PropertyMediaImage[]
  videoUrl?: string
  enquiryEmail?: string
  // Optional, not yet in the schema. Read null-safely; rendered only if present.
  leaseLength?: unknown
  serviceCharge?: unknown
  groundRent?: unknown
  councilTaxBand?: unknown
  epcRating?: unknown
  escrow?: unknown
  developerRegNo?: unknown
  permitNumber?: unknown
  permitIssuer?: unknown
  listingBrokerName?: unknown
  brokerOrn?: unknown
  agentBrn?: unknown
  brochureUrl?: string | null
}

const PRICE_NOTE =
  'Prices are asking prices as supplied by the seller or developer; indicative; subject to availability.'

export const revalidate = 60

export async function generateStaticParams() {
  const { data } = await sanityFetch<{ slug: string }[]>({
    query: PROPERTY_SLUGS_QUERY,
  })
  return (data ?? []).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: property } = await sanityFetch<PropertyDetail>({
    query: PROPERTY_BY_SLUG_QUERY,
    params: { slug },
  })
  if (!property) return { title: 'Property' }

  // Social crops can hide BEFORE/AFTER labels and cannot carry the visible caption.
  const ogImage =
    property.featuredImage && !isConceptMedia(property.featuredImage)
      ? urlFor(property.featuredImage).width(1200).height(630).fit('crop').url()
      : undefined

  return propertyMetadata({
    title: property.title,
    slug: property.slug,
    summary: property.summary,
    bedrooms: property.bedrooms,
    unitType: property.unitType,
    community: property.community,
    city: property.city,
    imageUrl: ogImage,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Optional CMS fields may arrive as string or number; anything else is ignored. */
function str(value: unknown): string | undefined {
  if (typeof value === 'string') return cleanText(value)
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

/** "2028-03-31" becomes "March 2028"; free text passes through. */
function formatDate(value?: string | null): string | undefined {
  const v = cleanText(value)
  if (!v) return undefined
  if (/^\d{4}-\d{2}(-\d{2})?/.test(v)) {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    }
  }
  return v
}

function marketOf(p: Pick<PropertyCardData, 'city' | 'country'>): 'dubai' | 'uk' | undefined {
  const hay = `${p.city ?? ''} ${p.country ?? ''}`.toLowerCase()
  if (/dubai|uae|emirates/.test(hay)) return 'dubai'
  if (/london|england|wales|scotland|\buk\b|united kingdom/.test(hay)) return 'uk'
  return undefined
}

function similarScore(base: PropertyDetail, other: PropertyCardData): number {
  let score = 0
  if (base.community && other.community === base.community) score += 3
  if (base.city && other.city === base.city) score += 2
  if (base.category && other.category === base.category) score += 2
  if (base.unitType && other.unitType === base.unitType) score += 1
  if (base.availability?.some((a) => other.availability?.includes(a))) score += 1
  return score
}

const FACT_ICON = {
  bed: BedDouble,
  bath: Bath,
  area: Maximize2,
  type: Building2,
  view: Eye,
  tenure: Landmark,
  plot: MapPin,
} as const

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: property } = await sanityFetch<PropertyDetail>({
    query: PROPERTY_BY_SLUG_QUERY,
    params: { slug },
  })

  if (!property) notFound()

  const { data: similarPool } = await sanityFetch<PropertyCardData[]>({
    query: SIMILAR_PROPERTIES_QUERY,
    params: { id: property._id },
  })
  // Ranked from real listings only. If nothing is genuinely similar, the
  // block is headed "More properties" rather than implying a match.
  const ranked = (similarPool ?? [])
    .map((p) => ({ p, score: similarScore(property, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
  const similar = ranked.map((x) => x.p)
  const hasSimilar = ranked.some((x) => x.score > 0)

  // ── Derived values ──────────────────────────────────────────────────────
  const floorPlans = property.floorPlans?.filter((plan) => Boolean(plan.src)) ?? []
  const status = statusLabel(property)
  const offPlan = isOffPlan(property)
  const rentOnly = isRentOnly(property)
  const price = priceText(property)
  const place = locationLine(property)
  const placeFull = locationLine(property, true)
  const enquiryEmail = property.enquiryEmail || 'info@hausofestate.com'
  const whatsapp = whatsAppHref(property.title, property.slug)
  const category = isCategory(property.category) ? property.category : undefined
  const videoEmbed = property.videoUrl ? toEmbedUrl(property.videoUrl) : null

  // Gallery: featured image first, then the gallery (de-duplicated).
  const galleryImages: GalleryImage[] = []
  const seen = new Set<string>()
  const pushImage = (img: (SanityImage & { asset?: { _ref?: string } }) | null | undefined, n: number) => {
    if (!img) return
    const ref = img.asset?._ref
    if (ref && seen.has(ref)) return
    if (ref) seen.add(ref)
    galleryImages.push({
      src: imageUrl(img, 1400, 900),
      full: imageUrl(img, 2000),
      thumb: imageUrl(img, 240, 160),
      alt: img.alt || `${property.title} — photo ${n}`,
      caption: propertyMediaCaption(img),
      concept: isConceptMedia(img),
    })
  }
  pushImage(property.featuredImage, 1)
  property.gallery?.forEach((img) => pushImage(img, galleryImages.length + 1))

  // Key facts (hide anything the data lacks; never print "On application").
  const facts: { icon: keyof typeof FACT_ICON; label: string; value: string }[] = []
  if (typeof property.bedrooms === 'number' && !bedroomsHidden(property.category, property.unitType)) {
    facts.push({
      icon: 'bed',
      label: 'Bedrooms',
      value: property.bedrooms === 0 ? 'Studio' : String(property.bedrooms),
    })
  }
  if (typeof property.bathrooms === 'number') {
    facts.push({ icon: 'bath', label: 'Bathrooms', value: String(property.bathrooms) })
  }
  const size = cleanText(property.sizeDisplay)
  if (size) facts.push({ icon: 'area', label: floorPlans.length > 0 ? 'Floor area' : 'Size', value: size })
  facts.push({ icon: 'type', label: 'Type', value: property.unitType })
  const tenure = cleanText(property.tenure)
  if (tenure) facts.push({ icon: 'tenure', label: 'Tenure', value: tenure })
  const plot = cleanText(property.plotSizeDisplay)
  if (plot) facts.push({ icon: 'plot', label: 'Plot', value: plot })
  if (property.view) facts.push({ icon: 'view', label: 'View', value: property.view })

  // Material information: only fields that exist.
  const rows = (entries: [string, string | undefined][]): InfoRow[] =>
    entries.filter((e): e is [string, string] => Boolean(e[1])).map(([label, value]) => ({ label, value }))

  const hasSale = property.listingType?.includes('sale') ?? !rentOnly
  const infoGroups: InfoGroup[] = [
    {
      heading: 'Price and costs',
      rows: rows([
        ['Price', hasSale ? cleanText(property.priceDisplay) : undefined],
        ['Rent', cleanText(property.rentPriceDisplay)],
        ['Tenure', tenure],
        ['Lease length', str(property.leaseLength)],
        ['Service charge', str(property.serviceCharge)],
        ['Ground rent', str(property.groundRent)],
        ['Council tax band', str(property.councilTaxBand)],
        ['EPC rating', str(property.epcRating)],
        ['Payment plan', cleanText(property.paymentPlan)],
      ]),
    },
    {
      heading: 'The property',
      rows: rows([
        ['Type', property.unitType],
        ['Bedrooms', typeof property.bedrooms === 'number' && !bedroomsHidden(property.category, property.unitType) ? (property.bedrooms === 0 ? 'Studio' : String(property.bedrooms)) : undefined],
        ['Bathrooms', typeof property.bathrooms === 'number' ? String(property.bathrooms) : undefined],
        ['Floor area', size],
        ['Plot size', plot],
        ['View', property.view ?? undefined],
      ]),
    },
    {
      heading: 'Completion and developer',
      rows: rows([
        ['Status', status],
        ['Completion', formatDate(property.completionDate)],
        ['Developer', property.developer],
        ['Part of', property.masterDevelopment],
        ['Developer registration', str(property.developerRegNo)],
        ['Escrow', str(property.escrow)],
      ]),
    },
    {
      heading: 'Regulatory references',
      rows: rows([
        ['Advertising permit', str(property.permitNumber)],
        ['Permit issuer', str(property.permitIssuer)],
        ['Listing broker', str(property.listingBrokerName)],
        ['Broker ORN', str(property.brokerOrn)],
        ['Agent BRN', str(property.agentBrn)],
      ]),
    },
  ]

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    ...(category
      ? [{ label: CATEGORY_LABELS[category], href: buildPropertiesHref({ category }) }]
      : []),
  ]

  return (
    <div className="pb-28 md:pb-0">
      <JsonLd
        data={breadcrumbJsonLd([
          ...crumbs.map((c) => ({ name: c.label, path: c.href })),
          { name: property.title, path: `/properties/${property.slug}` },
        ])}
      />

      <div className="px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  <Link
                    href={c.href}
                    className="rounded py-3 transition-colors hover:text-estate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/60"
                  >
                    {c.label}
                  </Link>
                  <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                </li>
              ))}
              <li className="min-w-0">
                <span aria-current="page" className="block break-words py-3 font-medium text-estate-900">
                  {property.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="px-4 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="min-w-0 space-y-12 md:space-y-14">
            <div>
              {galleryImages.length > 0 ? (
                <PropertyGallery images={galleryImages} title={property.title} />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] bg-gradient-to-br from-estate-700 to-estate-900 md:aspect-[16/10] md:rounded-[28px]">
                  <Building2 aria-hidden="true" className="h-14 w-14 text-white/25" />
                </div>
              )}

              {/* Title block */}
              <div className="mt-6 md:mt-8">
                <p className="eyebrow">
                  {property.unitType}
                  {status ? ` · ${status}` : ''}
                </p>
                <h1 className="mt-2 font-serif text-[length:var(--text-title-2)] font-medium leading-tight tracking-[-0.015em] text-estate-900">
                  {property.title}
                </h1>
                {placeFull && (
                  <p className="mt-2 flex items-start gap-1.5 text-base text-muted-foreground">
                    <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
                    <span>
                      {placeFull}
                      {property.developer ? ` · ${property.developer}` : ''}
                    </span>
                  </p>
                )}

                {/* Price and primary action: above the fold on mobile */}
                <div className="mt-5 lg:hidden">
                  <p className="font-serif text-3xl font-semibold tabular-nums text-estate-700">
                    {price}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{PRICE_NOTE}</p>
                  <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
                    <a href="#request-viewing">
                      Request a viewing
                      <ArrowRight aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Key facts */}
              {facts.length > 0 && (
                <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] bg-hairline shadow-e1 sm:grid-cols-3 xl:grid-cols-4">
                  {facts.map((f) => {
                    const Icon = FACT_ICON[f.icon]
                    return (
                      <li key={f.label} className="bg-surface p-4">
                        <Icon aria-hidden="true" className="h-5 w-5 text-estate-700" />
                        <p className="mt-2 text-xs font-medium text-muted-foreground">{f.label}</p>
                        <p className="mt-0.5 text-base font-semibold text-ink-900 tabular-nums">
                          {f.value}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* About */}
            <section aria-labelledby="about-heading">
<Reveal>
              <h2
                id="about-heading"
                className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900"
              >
                About this property
              </h2>
              <div className="mt-4 max-w-[68ch]">
                {property.description ? (
                  <PortableTextRenderer
                    content={property.description as ComponentProps<typeof PortableTextRenderer>['content']}
                  />
                ) : (
                  <p className="text-[1.0625rem] leading-relaxed text-ink-900">{property.summary}</p>
                )}
              </div>
            </Reveal>
</section>

            {/* Features and amenities */}
            {((property.keyFeatures?.length ?? 0) > 0 || (property.amenities?.length ?? 0) > 0) && (
              <Reveal className="grid gap-10 md:grid-cols-2">
                {property.keyFeatures && property.keyFeatures.length > 0 && (
                  <TickList heading="Key features" items={property.keyFeatures} />
                )}
                {property.amenities && property.amenities.length > 0 && (
                  <TickList heading="Community amenities" items={property.amenities} />
                )}
              </Reveal>
            )}

            {/* Material information */}
            <Reveal>
              <MaterialInfo
                groups={infoGroups}
                brochureUrl={property.brochureUrl ?? undefined}
                priceNote={PRICE_NOTE}
              />
            </Reveal>

            {/* Location */}
            {property.locationBenefits && property.locationBenefits.length > 0 && (
              <section aria-labelledby="location-heading">
<Reveal>
                <h2
                  id="location-heading"
                  className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900"
                >
                  Location{place ? `: ${place}` : ''}
                </h2>
                <ul className="mt-5 divide-y divide-hairline overflow-hidden rounded-[20px] bg-surface shadow-e1">
                  {property.locationBenefits.map((b, i) => (
                    <li
                      key={`${b.destination}-${i}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 text-base"
                    >
                      <span className="text-ink-900">{b.destination}</span>
                      <span className="font-medium tabular-nums text-estate-700">{b.time}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
</section>
            )}

            {/* Floor plans */}
            {floorPlans.length > 0 && (
              <section aria-labelledby="property-floor-plans-heading">
<Reveal>
                <div id="floor-plans" className="scroll-mt-24">
                  <h2
                    id="property-floor-plans-heading"
                    className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900"
                  >
                    {floorPlans.length === 1 ? 'Floor plan' : 'Floor plans'}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Open a plan to view it full size in a new tab.
                  </p>
                  <div className="mt-5 space-y-6">
                    {floorPlans.map((plan, index) => (
                      <figure
                        key={`${plan.src}-${index}`}
                        className="overflow-hidden rounded-[20px] bg-white shadow-e1"
                      >
                        <a
                          href={plan.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open floor plan ${index + 1} full size in a new tab`}
                          className="block focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-estate-700/60"
                        >
                          <span className="relative block h-[26rem] sm:h-[40rem]">
                            <Image
                              src={plan.src}
                              alt={plan.alt || `${property.title} — floor plan ${index + 1}`}
                              fill
                              sizes="(max-width: 1024px) 100vw, 760px"
                              className="object-contain"
                            />
                          </span>
                          <span className="flex min-h-11 items-center border-t border-hairline px-5 text-sm font-medium text-estate-700">
                            Open full-size floor plan
                          </span>
                        </a>
                        {plan.caption && (
                          <figcaption className="border-t border-hairline px-5 py-3 text-sm leading-relaxed text-muted-foreground">
                            {plan.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </div>
              </Reveal>
</section>
            )}

            {/* Walkthrough (click to load; nothing third-party until pressed) */}
            {videoEmbed && (
              <section aria-labelledby="walkthrough-heading">
<Reveal>
                <h2
                  id="walkthrough-heading"
                  className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900"
                >
                  Walkthrough
                </h2>
                <ConsentEmbed
                  src={property.videoUrl}
                  title={`${property.title} — walkthrough video`}
                  className="mt-5"
                />
              </Reveal>
</section>
            )}

            {/* Risk warning and role */}
            <Reveal className="space-y-4">
              <RiskWarning offPlan={offPlan} />
              <p className="text-xs leading-relaxed text-muted-foreground">{INTRODUCER_ROLE_COPY}</p>
            </Reveal>
          </div>

          {/* ── Enquiry card (sticky on desktop; after content on mobile) ── */}
          <aside
            id="request-viewing"
            aria-label="Request a viewing"
            className="min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:-m-4 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:p-4"
          >
            <div className="rounded-[28px] bg-surface p-6 shadow-e2 md:p-7">
              <p className="eyebrow">Request a viewing</p>
              <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-estate-700">
                {price}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{PRICE_NOTE}</p>

              <div className="mt-6">
                <EnquiryForm
                  context={{
                    title: property.title,
                    slug: property.slug,
                    unitType: property.unitType,
                    place: place || undefined,
                    market: marketOf(property),
                    rentOnly,
                    bedrooms: property.bedrooms,
                    fallbackEmail: enquiryEmail,
                    whatsappHref: whatsapp,
                  }}
                />
              </div>

              <div className="mt-6 border-t border-hairline pt-6">
                <WhatsAppButton href={whatsapp} className="w-full" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Similar properties, from real listings only */}
      {similar.length > 0 && (
        <section
          aria-labelledby="similar-heading"
          className="border-t border-hairline px-4 py-14 md:px-6 md:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2
                id="similar-heading"
                className="font-serif text-[length:var(--text-title-2)] font-medium leading-tight text-estate-900"
              >
                {hasSimilar ? 'Similar properties' : 'More properties'}
              </h2>
              <Link
                href="/properties"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-estate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/60"
              >
                See all properties <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Reveal>
            <PropertyGrid properties={similar} headingLevel="h3" />
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">Not quite right?</p>
              <OpenBuyerButton variant="outline">
                Tell us what you&apos;re looking for
                <ArrowRight aria-hidden="true" />
              </OpenBuyerButton>
            </div>
          </div>
        </section>
      )}

      <StickyCta price={price} whatsappHref={whatsapp} />
    </div>
  )
}

function TickList({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-serif text-[length:var(--text-title-3)] font-medium text-estate-900">
        {heading}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-base text-ink-900">
            <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-estate-700" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
