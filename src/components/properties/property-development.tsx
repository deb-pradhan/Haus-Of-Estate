import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { urlFor } from '@/sanity'
import { developmentHomeGroups, developmentStartingPrice, type DevelopmentProperty, type PropertyDevelopment } from '@/lib/property-developments'
import type { PropertyMediaImage } from '@/lib/property-media'

function developmentImage(property: DevelopmentProperty, design = false) {
  if (design && property.designImage?.src) return {
    ...property.designImage,
    src: urlFor(property.designImage.src).width(1120).height(746).fit('crop').url(),
  }
  return property.featuredImage ? {
    src: urlFor(property.featuredImage).width(1200).height(800).url(),
    alt: property.featuredImage.alt || `${property.title} — artist’s impression`,
  } : undefined
}

function StartingPrice({ homes }: { homes: DevelopmentProperty[] }) {
  // Retain the collection's supplied AED text, including any cluster scope.
  if (homes.length === 1) {
    return homes[0].priceDisplay
      ? <span className="font-serif text-estate-700">{homes[0].priceDisplay}</span>
      : null
  }
  const price = developmentStartingPrice(homes)
  return price ? (
    <span className="font-serif text-estate-700">From {price.currency} {new Intl.NumberFormat('en-GB').format(price.amount)}
      {price.scope && <span className="mt-1 block text-xs text-muted-foreground">{price.scope}</span>}
    </span>
  ) : null
}

export function PropertyDevelopmentCard({ development, basePath = '/properties' }: {
  development: PropertyDevelopment
  basePath?: string
}) {
  const image = developmentImage(development)
  const groups = developmentHomeGroups(development.collections)
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-lg">
      <Link href={`${basePath}/${development.slug}`} className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">
        <div className="relative aspect-[4/3] overflow-hidden bg-estate-700">
          {image ? <Image src={image.src} alt={image.alt || development.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
            : <Building2 aria-hidden className="absolute inset-0 m-auto h-12 w-12 text-white/40" />}
          <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1 text-xs font-medium text-estate-700">Community overview</span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-serif text-xl font-medium text-estate-700">{development.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{development.summary}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin aria-hidden className="h-3.5 w-3.5" />{[development.city, development.country].filter(Boolean).join(', ')}</p>
          {groups.length > 0 && <dl className="mt-4 space-y-3 border-t border-border pt-3 text-sm">
            {groups.map(({ type, title, homes }) => <div key={type}>
              <dt className="font-medium text-estate-700">{title}</dt>
              <dd className="mt-1 text-estate-700"><StartingPrice homes={homes} /></dd>
            </div>)}
          </dl>}
          <span className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm font-medium text-estate-700">Explore community and home designs <ArrowRight aria-hidden className="h-4 w-4 shrink-0" /></span>
        </div>
      </Link>
    </article>
  )
}

export function PropertyDevelopmentShowcase({ development, hero, preview = false, basePath = '/properties' }: {
  development: PropertyDevelopment
  hero?: PropertyMediaImage
  preview?: boolean
  basePath?: string
}) {
  const image = hero ?? developmentImage(development)
  const groups = developmentHomeGroups(development.collections)
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6 md:pt-12" aria-labelledby="development-title">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div>
          <div className="relative aspect-[16/9] max-h-[520px] bg-estate-700">
            {image ? <Image src={image.src} alt={image.alt || development.title} fill preload sizes="(min-width: 1280px) 1152px, 100vw" className="object-cover" unoptimized={preview} />
              : <Building2 aria-hidden className="absolute inset-0 m-auto h-16 w-16 text-white/40" />}
          </div>
          {hero?.caption && <p className="px-6 pt-4 text-sm leading-relaxed text-muted-foreground md:px-10">{hero.caption}</p>}
          <div className="flex flex-col justify-center p-6 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Community overview · {development.city}</p>
            <h1 id="development-title" className="mt-3 font-serif text-4xl font-medium text-estate-700 md:text-5xl">{development.title}</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{development.summary}</p>
            {development.amenities?.length ? <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm text-estate-700">
              {development.amenities.slice(0, 3).map((amenity) => <li key={amenity}>{amenity}</li>)}
            </ul> : null}
            {groups.length > 0 && <a href="#home-collections" className="mt-7 inline-flex min-h-11 w-fit items-center gap-3 rounded-md bg-estate-700 px-5 py-3 text-sm font-medium text-white hover:bg-estate-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">Explore the home designs <ArrowRight aria-hidden className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>
      {groups.length > 0 && <>
        <div id="home-collections" className="mt-12 flex scroll-mt-24 flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-3xl text-estate-700">Find your home at {development.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Explore the home designs. Individual homes and current availability are confirmed on enquiry.</p>
          </div>
          <nav aria-label="Home types" className="flex gap-5 text-sm text-estate-700">
            {groups.map(({ id, title }) => <a key={id} href={`#${id}`} className="py-2 underline underline-offset-4">{title}</a>)}
          </nav>
        </div>
        {groups.map(({ id, title, homes }) => <section key={id} id={id} aria-labelledby={`${id}-title`} className="mt-10 scroll-mt-24 md:mt-12 md:scroll-mt-32">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h3 id={`${id}-title`} className="font-serif text-sm uppercase tracking-[0.24em] text-estate-700">{title}</h3>
            <p className="text-sm text-estate-700"><StartingPrice homes={homes} /></p>
          </div>
          <div className={`grid gap-6 md:grid-cols-2 ${homes.length > 2 ? 'lg:grid-cols-3' : ''}`}>
            {homes.map((home) => {
              const homeImage = developmentImage(home, true)
              return <Link key={home._id} href={`${basePath}/${home.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">
                <div className="relative aspect-[3/2] overflow-hidden bg-estate-700">
                  {homeImage ? <Image src={homeImage.src} alt={homeImage.alt || home.title} fill sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw" className="object-cover" unoptimized={preview} />
                    : <Building2 aria-hidden className="absolute inset-0 m-auto h-10 w-10 text-white/40" />}
                </div>
                <div className="p-5 md:p-6">
                  <h4 className="font-serif text-2xl font-medium text-estate-700">{typeof home.bedrooms === 'number' ? `${home.bedrooms}-bedroom ${title.toLowerCase()}` : home.title}</h4>
                  {home.designImage?.label && <p className="mt-2 text-xs text-muted-foreground">Shown: {home.designImage.label}</p>}
                  <p className="mt-2 text-sm text-estate-700"><StartingPrice homes={[home]} /></p>
                  {Boolean(home.designCount) && <p className="mt-2 text-xs text-muted-foreground">{home.designCount} brochure designs · View plans and areas</p>}
                  <span className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-estate-700">Explore the designs <ArrowRight aria-hidden className="h-4 w-4" /></span>
                </div>
              </Link>
            })}
          </div>
        </section>)}
      </>}
    </section>
  )
}
