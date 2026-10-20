import Link from 'next/link'
import Image from 'next/image'
import type { ComponentProps } from 'react'
import {
  ChevronRight,
  ArrowRight,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Building2,
  Check,
} from 'lucide-react'
import { urlFor } from '@/sanity'
import { PortableTextRenderer } from '@/components/blog'
import { toEmbedUrl } from '@/lib/embed-video'
import {
  isConceptMedia,
  propertyMediaCaption,
  type PropertyImageMetadata,
  type PropertyMediaImage,
} from '@/lib/property-media'

import { PropertyDesignExplorer } from './PropertyDesignExplorer'
import { PropertyDevelopmentShowcase } from './property-development'
import type { PropertyDevelopment } from '@/lib/property-developments'
import { preparePublicDesigns, preparePublicInteriorSchemes, type PropertyDesign, type PropertyInteriorScheme } from '@/lib/property-designs'

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
  availability?: string[]
  unitType: string
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
  featuredImage?: PropertyImageMetadata & { alt?: string } & Record<string, unknown>
  gallery?: (PropertyImageMetadata & Record<string, unknown> & { alt?: string })[]
  floorPlans?: PropertyMediaImage[]
  videoUrl?: string
  designVariants?: PropertyDesign[]
  interiorSchemes?: PropertyInteriorScheme[]
  enquiryEmail?: string
}

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed',
  'off-plan': 'Off-plan',
  'completed-offplan': 'Completed & off-plan',
}

export function PropertyDetailView({ property, development, parentDevelopment, preview = false }: {
  property: PropertyDetail
  development?: PropertyDevelopment
  parentDevelopment?: PropertyDevelopment
  preview?: boolean
}) {
  // Sanitise on the server before any design data crosses the client boundary.
  const designs = preparePublicDesigns(property.designVariants)
  const interiorSchemes = preparePublicInteriorSchemes(property.interiorSchemes)
  const basePath = preview ? '/dev/florence-preview' : '/properties'
  const collection = Boolean(property.designVariants?.length || parentDevelopment)
  const conceptHero = isConceptMedia(property.featuredImage)
  const heroCaption = propertyMediaCaption(property.featuredImage)
  const floorPlans = property.floorPlans?.filter((plan) => Boolean(plan.src)) ?? []
  const statusLabel = property.completionStatus
    ? COMPLETION_LABEL[property.completionStatus] ?? property.completionStatus
    : !development && !collection && property.availability?.includes('ready') ? 'Ready' : undefined
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
  if (property.sizeDisplay || (!development && !collection)) {
    facts.push({
      icon: Maximize2,
      label: floorPlans.length > 0 ? 'Floor area' : 'Size',
      value: property.sizeDisplay || 'On application',
    })
  }
  if (!development) facts.push({
    icon: Building2,
    label: 'Type',
    value: property.unitType,
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
      {/* Top bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <li><Link href="/" className="py-1 hover:text-estate-700 hover:underline">Home</Link></li>
              <li className="flex items-center gap-2">
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <Link href={basePath} className="py-1 hover:text-estate-700 hover:underline">Properties</Link>
              </li>
              {parentDevelopment && <li className="flex items-center gap-2">
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <Link href={`${basePath}/${parentDevelopment.slug}`} className="py-1 hover:text-estate-700 hover:underline">{parentDevelopment.title}</Link>
              </li>}
              <li className="flex min-w-0 items-center gap-2">
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span aria-current="page" className="min-w-0 break-words py-1 font-medium text-estate-700">{property.title}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {development ? (
        <PropertyDevelopmentShowcase
          development={development}
          preview={preview}
          basePath={basePath}
          hero={property.featuredImage ? {
            src: urlFor(property.featuredImage).width(1600).height(900).url(),
            alt: property.featuredImage.alt || property.title,
            caption: heroCaption,
          } : undefined}
        />
      ) : (
      <figure>
        <div className="relative aspect-[16/9] max-h-[460px] w-full overflow-hidden bg-estate-700">
          {property.featuredImage ? (
            <Image
              src={conceptHero
                ? urlFor(property.featuredImage).ignoreImageParams().width(1600).fit('max').url()
                : urlFor(property.featuredImage).width(1600).height(900).url()}
              alt={property.featuredImage.alt || property.title}
              fill
              sizes="100vw"
              className={conceptHero ? 'object-contain' : 'object-cover'}
              preload
              unoptimized={preview}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-estate-600 to-estate-800">
              <Building2 className="h-16 w-16 text-white/25" />
            </div>
          )}
        </div>
        {heroCaption && (
          <figcaption className="mx-auto max-w-6xl px-4 py-4 text-sm leading-relaxed text-muted-foreground md:px-6">{heroCaption}</figcaption>
        )}
      </figure>
      )}

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          {/* Main */}
          <div>
            {!development && <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
              {property.unitType}
              {statusLabel ? ` · ${statusLabel}` : ''}
            </p>}
            {development ? <h2 className="font-serif text-2xl font-medium text-estate-700">About {property.title}</h2> : <h1 className="mt-2 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              {property.title}
            </h1>}
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {[property.community, property.city, property.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              {parentDevelopment ? (
                <span>· part of <Link href={`${basePath}/${parentDevelopment.slug}`} className="text-estate-700 underline underline-offset-4">{parentDevelopment.title}</Link></span>
              ) : property.masterDevelopment && (
                <span>· part of {property.masterDevelopment}</span>
              )}
              {property.developer && <span>· {property.developer}</span>}
            </p>

            {/* Fact strip */}
            {facts.length > 0 && <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            </div>}

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

            {designs.length > 0 && <PropertyDesignExplorer
              designs={designs}
              interiorSchemes={interiorSchemes}
              propertyTitle={property.title}
              enquiryEmail={enquiryEmail}
              preview={preview}
            />}

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
                  Community amenities
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

            {floorPlans.length > 0 && (
              <section id="floor-plans" className="mt-10 scroll-mt-24" aria-labelledby="property-floor-plans-heading">
                <h2 id="property-floor-plans-heading" className="font-serif text-xl font-medium text-estate-700">
                  {floorPlans.length === 1 ? 'Floor plan' : 'Floor plans'}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Open a plan to view it full size in a new tab.</p>
                <div className="mt-4 space-y-6">
                  {floorPlans.map((plan, index) => (
                    <figure key={`${plan.src}-${index}`} className="overflow-hidden rounded-2xl border border-border bg-white">
                      <a href={plan.src} target="_blank" rel="noopener noreferrer"
                        aria-label={`Open floor plan ${index + 1} in a new tab`}
                        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700">
                        <span className="relative block h-[32rem] sm:h-[44rem]">
                          <Image src={plan.src} alt={plan.alt || `${property.title} — floor plan ${index + 1}`} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-contain" unoptimized={preview} />
                        </span>
                        <span className="block border-t border-border px-4 py-3 text-sm font-medium text-estate-700">Open full-size floor plan</span>
                      </a>
                      {plan.caption && <figcaption className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">{plan.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
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

            {property.gallery && property.gallery.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-xl font-medium text-estate-700">
                  {property.gallery.every(isConceptMedia) ? 'Proposed interiors' : 'Gallery'}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {property.gallery.map((img, i) => (
                    <figure
                      key={i}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <div className="relative aspect-[4/3] bg-estate-700/5">
                        <Image
                          src={isConceptMedia(img)
                            ? urlFor(img).ignoreImageParams().width(1200).fit('max').url()
                            : urlFor(img).width(800).height(600).url()}
                          alt={img.alt || `${property.title} — image ${i + 1}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className={isConceptMedia(img) ? 'object-contain' : 'object-cover'}
                          unoptimized={preview}
                        />
                      </div>
                      {propertyMediaCaption(img) && (
                        <figcaption className="px-3 py-3 text-sm leading-relaxed text-muted-foreground">{propertyMediaCaption(img)}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enquiry aside */}
          <aside>
            <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
                Enquire
              </p>
              {(property.priceDisplay || (!development && !collection)) && <p className="mt-2 font-serif text-2xl font-semibold text-estate-700">
                {property.priceDisplay || 'Price on application'}
              </p>}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pricing, exact sizes and current availability are confirmed on
                enquiry. We&apos;ll connect you with a vetted agent for this
                community — no obligation.
              </p>
              {!preview && <a
                href={enquiryHref}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
              >
                Enquire about this property <ArrowRight className="h-4 w-4" />
              </a>}
              {!preview && <p className="mt-3 text-center text-xs text-muted-foreground">
                Or email{' '}
                <a
                  href={`mailto:${enquiryEmail}`}
                  className="text-estate-700 underline-offset-4 hover:underline"
                >
                  {enquiryEmail}
                </a>
              </p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
