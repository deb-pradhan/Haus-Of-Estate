import Image from 'next/image'
import { Bath, BedDouble, Building2, Landmark, MapPin, Maximize2 } from 'lucide-react'
import { isConceptMedia, propertyMediaCaption } from '@/lib/property-media'
import {
  cardAlt,
  cardFacts,
  imageUrl,
  locationLine,
  priceText,
  statusLabel,
  type FactIcon,
  type PropertyCardData,
} from '@/lib/property-format'
import { TrackedCardLink } from './tracked-card-link'

const FACT_ICONS: Record<FactIcon, typeof BedDouble> = {
  bed: BedDouble,
  bath: Bath,
  area: Maximize2,
  tenure: Landmark,
  type: Building2,
}

/**
 * Property card v2: image-first 4:3, one badge, serif tabular price, location,
 * up to three key facts. The whole card is the link. Concept / AI imagery keeps
 * its visible caption and is never cropped.
 */
export function PropertyCard({
  property,
  rentContext = false,
  headingLevel: Heading = 'h3',
  sizes = '(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 50vw, 400px',
}: {
  property: PropertyCardData
  rentContext?: boolean
  headingLevel?: 'h2' | 'h3'
  sizes?: string
}) {
  const concept = isConceptMedia(property.featuredImage ?? undefined)
  const caption = propertyMediaCaption(property.featuredImage ?? undefined)
  const badge = statusLabel(property)
  const facts = cardFacts(property)
  const place = locationLine(property)

  return (
    <TrackedCardLink
      href={`/properties/${property.slug}`}
      className="group lift flex h-full flex-col overflow-hidden rounded-[20px] bg-surface shadow-e1 outline-none focus-visible:ring-[3px] focus-visible:ring-estate-700/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <figure className="relative">
        <div className="relative aspect-[4/3] overflow-hidden bg-estate-900">
          {property.featuredImage ? (
            <Image
              src={imageUrl(property.featuredImage, 800, 600)}
              alt={cardAlt(property)}
              fill
              sizes={sizes}
              className={
                concept
                  ? 'object-contain'
                  : 'object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]'
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-estate-700 to-estate-900">
              <Building2 aria-hidden="true" className="h-10 w-10 text-white/30" />
            </div>
          )}
          {badge && !concept && (
            <span className="glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-estate-900">
              {badge}
            </span>
          )}
        </div>
        {(concept || caption) && (
          <figcaption className="space-y-2 border-b border-hairline px-5 py-3 text-xs leading-relaxed text-muted-foreground">
            {badge && concept && (
              <span className="inline-block rounded-full bg-estate-700/10 px-3 py-1 text-xs font-semibold text-estate-900">
                {badge}
              </span>
            )}
            {caption && <span className="block">{caption}</span>}
          </figcaption>
        )}
      </figure>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{property.unitType}</p>
        <Heading className="mt-1.5 font-serif text-xl font-medium leading-snug text-estate-900">
          {property.title}
        </Heading>
        <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-estate-700">
          {priceText(property, rentContext)}
        </p>
        {place && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{place}</span>
          </p>
        )}
        {facts.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-hairline pt-4 text-sm text-ink-900">
            {facts.map((f) => {
              const Icon = FACT_ICONS[f.icon]
              return (
                <li key={f.label} className="flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-estate-700" />
                  <span className="sr-only">{f.label}: </span>
                  <span className="tabular-nums">{f.value}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </TrackedCardLink>
  )
}

/** Same footprint as PropertyCard, so loading causes no layout shift. */
export function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full animate-pulse flex-col overflow-hidden rounded-[20px] bg-surface shadow-e1"
    >
      <div className="aspect-[4/3] bg-estate-700/10" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 rounded bg-estate-700/10" />
        <div className="h-5 w-3/4 rounded bg-estate-700/10" />
        <div className="h-7 w-1/2 rounded bg-estate-700/10" />
        <div className="h-4 w-2/3 rounded bg-estate-700/10" />
        <div className="h-4 w-full rounded bg-estate-700/10" />
      </div>
    </div>
  )
}
