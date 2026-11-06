import Link from 'next/link'
import { ArrowRight, BedDouble, MapPin, Ruler } from 'lucide-react'
import { showcasePropertyPath } from '@/lib/showcase/access'
import { builtUpAreaRange, collectionLabel, type ShowcaseCommunity, type ShowcaseProperty } from '@/lib/showcase/fixture'
import { bedroomList } from '@/lib/showcase/format'
import { showcaseImageCaption } from '@/lib/showcase/captions'
import { FixtureImage } from './primitives'
import { cn } from '@/lib/utils'

/** The wide community introduction that sits above the Villas and Townhouses sections. */
export function CommunityIntro({ community, variant = 'catalogue', className }: {
  community: ShowcaseCommunity
  variant?: 'catalogue' | 'home'
  className?: string
}) {
  const { overview } = community
  const href = showcasePropertyPath(overview.slug)
  const villas = community.groups.find((group) => group.id === 'villas')
  const townhouses = community.groups.find((group) => group.id === 'townhouses')
  const bedrooms = (collections: ShowcaseProperty[] | undefined) => bedroomList(collections ?? [])
  return (
    <article className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <div className="grid lg:grid-cols-[1.4fr_1fr]">
        <Link href={href} className="relative block aspect-[16/10] bg-estate-700 lg:aspect-auto lg:min-h-[420px]" aria-label={`Explore ${overview.title}`}>
          <FixtureImage image={overview.media.hero} sizes="(min-width: 1024px) 720px, 100vw" />
          <span className="absolute bottom-4 left-4 rounded-md bg-surface/95 px-3 py-1.5 text-xs font-medium text-estate-700">Masterplan · artist’s impression</span>
        </Link>
        <div className="flex flex-col justify-center p-6 md:p-9">
          <p className="sc-eyebrow">{overview.city} · {overview.developer}</p>
          <h3 className="sc-title mt-3 text-estate-700">{overview.title}</h3>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{variant === 'home' ? 'Explore a planned community with landscaped parkland, villas and townhouses, alongside Sheikh Mohammed Bin Zayed Road.' : overview.summary}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
            {villas && <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Villas</dt>
              <dd className="mt-1 font-medium text-estate-700">{bedrooms(villas.collections)} designs</dd>
            </div>}
            {townhouses && <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Townhouses</dt>
              <dd className="mt-1 font-medium text-estate-700">{bedrooms(townhouses.collections)} designs</dd>
            </div>}
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">{overview.display.inventoryNotice}</p>
          <Link href={href} className="sc-text-link mt-4 w-fit">
            Explore the community <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function CollectionCard({ collection, className }: { collection: ShowcaseProperty; className?: string }) {
  const design = collection.designs[0]
  const image = design?.images[0] ?? collection.media.hero
  const range = builtUpAreaRange(collection)
  const href = showcasePropertyPath(collection.slug)
  return (
    <article className={cn('sc-lift group flex flex-col overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <Link href={href} className="flex flex-1 flex-col rounded-xl" aria-label={`${collectionLabel(collection)}: compare ${collection.designs.length} brochure designs`}>
        <div className="relative aspect-[3/2] overflow-hidden bg-estate-700">
          <FixtureImage image={image} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
        </div>
        <div className="flex flex-1 flex-col p-5 md:p-6">
          <p className="sc-eyebrow">{collection.unitType} collection</p>
          <h4 className="mt-2 font-serif text-2xl font-medium leading-tight text-estate-700">{collectionLabel(collection)}</h4>
          {design && <p className="mt-1 text-xs leading-5 text-muted-foreground">Shown: {image.label ?? design.label}</p>}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Designs</dt>
              <dd className="mt-1 font-medium text-estate-700">{collection.designs.length} brochure {collection.designs.length === 1 ? 'design' : 'designs'}</dd>
            </div>
            {range && <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{collection.display.areaLabel}</dt>
              <dd className="mt-1 font-medium tabular-nums text-estate-700">{range}</dd>
            </div>}
          </dl>
          <span className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm font-semibold text-estate-700">
            Compare designs &amp; plans <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
          </span>
        </div>
      </Link>
    </article>
  )
}

export function ReadyHomeCard({ home, className, wide = false }: { home: ShowcaseProperty; className?: string; wide?: boolean }) {
  const href = showcasePropertyPath(home.slug)
  const caption = showcaseImageCaption(home.media.hero)
  return (
    <article className={cn('sc-lift group overflow-hidden rounded-xl border border-border bg-surface', className)}>
      <Link href={href} className={cn('grid rounded-xl', wide && 'lg:grid-cols-[1.4fr_1fr]')} aria-label={`View ${home.title}`}>
        <figure>
          <div className="relative aspect-[3/2] bg-[#f3efe6]">
            <FixtureImage image={home.media.hero} fit="contain" sizes={wide ? '(min-width: 1024px) 720px, 100vw' : '(min-width: 1024px) 400px, 100vw'} />
            <span className="absolute left-4 top-4 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold text-estate-700 shadow-sm">Existing home</span>
          </div>
          {caption && <figcaption className="border-t border-border px-5 py-3 text-xs leading-5 text-muted-foreground">{caption}</figcaption>}
        </figure>
        <div className="flex flex-col justify-center p-5 md:p-7">
          <p className="sc-eyebrow">{[home.community, home.city, home.country].join(', ')}</p>
          <h4 className="mt-2 font-serif text-2xl font-medium leading-tight text-estate-700 md:text-3xl">{home.title}</h4>
          {home.price && <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-estate-700">{home.price.display}<span className="ml-2 align-middle text-xs font-sans font-medium uppercase tracking-[0.14em] text-muted-foreground">Asking price</span></p>}
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/80">
            {typeof home.bedrooms === 'number' && <li className="flex items-center gap-1.5"><BedDouble aria-hidden className="size-4 text-estate-700" />{home.bedrooms} bedrooms</li>}
            <li className="flex items-center gap-1.5"><MapPin aria-hidden className="size-4 text-estate-700" />{home.unitType}</li>
            {home.sizeDisplay && <li className="flex items-center gap-1.5"><Ruler aria-hidden className="size-4 text-estate-700" />{home.sizeDisplay.replace('Approx. Gross Internal Floor Area:', 'Approx. GIA')}</li>}
          </ul>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{home.summary}</p>
          <span className="mt-5 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border border-estate-700/25 px-5 text-sm font-semibold text-estate-700 transition-colors group-hover:bg-estate-700/5">
            View this home <ArrowRight aria-hidden className="size-4" />
          </span>
        </div>
      </Link>
    </article>
  )
}
