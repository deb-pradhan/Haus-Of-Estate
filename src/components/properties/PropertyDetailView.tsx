import Link from 'next/link'
import Image from 'next/image'
import type { ComponentProps } from 'react'
import { ArrowLeft, ArrowRight, MapPin, BedDouble, Bath, Maximize2, Building2, Check } from 'lucide-react'
import { PortableTextRenderer } from '@/components/blog'
import { toEmbedUrl } from '@/lib/embed-video'

interface LocationBenefit {
  destination?: string
  time?: string
}

export interface PropertyDetail {
  _id: string
  title: string
  slug: string
  community: string
  masterDevelopment?: string
  city: string
  country?: string
  developer?: string
  unitType?: string
  unitNumber?: string
  bedrooms?: number
  bathrooms?: number
  sizeDisplay?: string
  plotSizeDisplay?: string
  priceDisplay?: string
  paymentPlan?: string
  view?: string
  completionStatus?: string
  summary: string
  description?: unknown
  keyFeatures?: string[]
  amenities?: string[]
  locationBenefits?: LocationBenefit[]
  featuredImage?: { alt?: string } & Record<string, unknown>
  gallery?: (Record<string, unknown> & { alt?: string })[]
  videoUrl?: string
  enquiryEmail?: string
}

export interface PropertyMedia {
  hero?: { src: string; alt: string }
  gallery: { src: string; alt: string }[]
}

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed',
  'off-plan': 'Off-plan',
  'completed-offplan': 'Completed & off-plan',
}

export function PropertyDetailView({ property, media, preview }: {
  property: PropertyDetail
  media: PropertyMedia
  preview?: { kind: 'development' | 'home-type' }
}) {
  const enquiryEmail = property.enquiryEmail || 'info@hausofestate.com'
  const enquiryHref = `mailto:${enquiryEmail}?subject=${encodeURIComponent(
    `Enquiry — ${property.title}`,
  )}`

  const facts: { icon: typeof BedDouble; label: string; value: string }[] = []
  if (typeof property.bedrooms === 'number') {
    facts.push({
      icon: BedDouble,
      label: 'Bedrooms',
      value: property.bedrooms === 0 ? 'Studio' : String(property.bedrooms),
    })
  }
  if (typeof property.bathrooms === 'number') {
    facts.push({
      icon: Bath,
      label: 'Bathrooms',
      value: String(property.bathrooms),
    })
  }
  facts.push({
    icon: Maximize2,
    label: 'Size',
    value: property.sizeDisplay || (preview ? 'Awaiting confirmation' : 'On application'),
  })
  facts.push({
    icon: Building2,
    label: 'Type',
    value: property.unitType || (preview ? 'Awaiting confirmation' : ''),
  })
  if (property.view) {
    facts.push({
      icon: MapPin,
      label: 'View',
      value: property.view,
    })
  }
  if (property.plotSizeDisplay) {
    facts.push({
      icon: Maximize2,
      label: 'Plot',
      value: property.plotSizeDisplay,
    })
  }
  if (property.unitNumber) {
    facts.push({
      icon: Building2,
      label: 'Unit',
      value: property.unitNumber,
    })
  }
  if (property.paymentPlan) {
    facts.push({
      icon: Check,
      label: 'Payment',
      value: property.paymentPlan,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {preview && (
        <div className="border-b border-gold-500/30 bg-gold-500/10 px-4 py-4 text-sm text-estate-700">
          <div className="mx-auto max-w-6xl">
            <p className="font-semibold">Local draft preview · Not published</p>
            <p className="mt-1">{preview.kind === 'home-type' ? 'A collection of home designs, not an individual available unit.' : 'Community overview for editorial review.'} Artist’s impressions illustrate proposed designs and facilities.</p>
          </div>
        </div>
      )}
      {/* Top bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <Link
            href={preview ? "/dev/property-previews" : "/properties"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-estate-700"
          >
            <ArrowLeft className="h-4 w-4" /> {preview ? 'All Florence previews' : 'All properties'}
          </Link>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative aspect-[16/9] max-h-[460px] w-full overflow-hidden bg-estate-700">
        {media.hero ? (
          <Image
            src={media.hero.src}
            alt={media.hero.alt}
            fill
            className="object-cover"
            priority
            unoptimized={Boolean(preview)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-estate-600 to-estate-800">
            <Building2 className="h-16 w-16 text-white/25" />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          {/* Main */}
          <div>
            <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
              {property.unitType || (preview ? 'Master community' : '')}
              {property.completionStatus
                ? ` · ${COMPLETION_LABEL[property.completionStatus] ?? property.completionStatus}`
                : ''}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              {property.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {[property.community, property.city, property.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              {property.masterDevelopment && (
                <span>· part of {property.masterDevelopment}</span>
              )}
              {property.developer && <span>· {property.developer}</span>}
            </p>

            {preview?.kind === 'home-type' && (
              <Link href="/dev/property-previews/azizi-florence" className="mt-4 inline-flex text-sm text-estate-700 underline underline-offset-4">View the Florence community overview</Link>
            )}

            {/* Fact strip */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <f.icon className="h-4 w-4 text-estate-700" />
                  <p className="mt-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="text-sm font-medium text-estate-700">
                    {f.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description ? (
              <div className="mt-10">
                <PortableTextRenderer content={property.description as ComponentProps<typeof PortableTextRenderer>['content']} />
              </div>
            ) : (
              <p className="mt-10 text-base leading-relaxed text-muted-foreground">
                {property.summary}
              </p>
            )}

            {/* Key features */}
            {property.keyFeatures && property.keyFeatures.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-xl font-medium text-estate-700">
                  Key features
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {property.keyFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-xl font-medium text-estate-700">
                  {preview ? 'Planned community amenities' : 'Community amenities'}
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {property.amenities.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location benefits */}
            {property.locationBenefits &&
              property.locationBenefits.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-serif text-xl font-medium text-estate-700">
                    Location
                  </h2>
                  <ul className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
                    {property.locationBenefits.map((b, i) => (
                      <li
                        key={`${b.destination}-${i}`}
                        className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${
                          i > 0 ? 'border-t border-border' : ''
                        }`}
                      >
                        <span className="text-foreground">{b.destination}</span>
                        <span className="font-medium text-estate-700">
                          {b.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Gallery */}
            {property.videoUrl && (() => {
              const embed = toEmbedUrl(property.videoUrl)
              if (!embed) return null
              return (
                <div className="mt-10">
                  <h2 className="font-serif text-xl font-medium text-estate-700">
                    Walkthrough
                  </h2>
                  <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-estate-700/5">
                    <iframe
                      src={embed}
                      title={`${property.title} — walkthrough video`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )
            })()}

            {media.gallery.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-xl font-medium text-estate-700">
                  Gallery
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {media.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        unoptimized={Boolean(preview)}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enquiry aside */}
          <aside>
            <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              {preview ? (
                <>
                  <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">Listing details</p>
                  <p className="mt-2 font-serif text-2xl font-semibold text-estate-700">{property.priceDisplay || 'Awaiting confirmation'}</p>
                  <dl className="mt-5 space-y-4 text-sm">
                    {[
                      ...(!property.priceDisplay ? [['Pricing', undefined]] : []),
                      ['Sizes', property.sizeDisplay],
                      ['Payment plan', property.paymentPlan],
                      ['Handover', property.completionStatus],
                      ['Availability', undefined],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-medium text-estate-700">{label}</dt>
                        <dd className="mt-1 text-muted-foreground">{value || 'Awaiting confirmation'}</dd>
                      </div>
                    ))}
                  </dl>
                  <button type="button" disabled className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-estate-700/15 px-4 py-3 text-sm font-medium text-estate-700/70">Enquiries disabled in preview</button>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Sonia / Haus must confirm the remaining details and approve publication.</p>
                </>
              ) : (
                <>
              <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
                Enquire
              </p>
              <p className="mt-2 font-serif text-2xl font-semibold text-estate-700">
                {property.priceDisplay || 'Price on application'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pricing, exact sizes and current availability are confirmed on
                enquiry. We&apos;ll connect you with a vetted agent for this
                community — no obligation.
              </p>
              <a
                href={enquiryHref}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
              >
                Enquire about this property <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Or email{' '}
                <a
                  href={`mailto:${enquiryEmail}`}
                  className="text-estate-700 underline-offset-4 hover:underline"
                >
                  {enquiryEmail}
                </a>
              </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
