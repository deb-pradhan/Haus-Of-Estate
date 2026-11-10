import Link from 'next/link'
import { ArrowLeft, Check, ChevronDown } from 'lucide-react'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'
import { builtUpAreaRangeDual, collectionLabel, type ShowcaseCommunity, type ShowcaseImage, type ShowcaseProperty } from '@/lib/showcase/fixture'
import { DesignExplorer } from './design-explorer'
import { ImageViews } from './image-views'
import { Breadcrumbs, FactGrid, Notice, ProvenanceLine, TextBlocks } from './primitives'

export function CollectionView({ collection, community, initialDesignKey }: {
  collection: ShowcaseProperty
  community?: ShowcaseCommunity
  initialDesignKey?: string
}) {
  const label = collectionLabel(collection)
  const range = builtUpAreaRangeDual(collection)
  const overview = community?.overview
  // Every collection image, once: the hero first, then the rest of its gallery.
  const images = [collection.media.hero, ...collection.media.gallery]
    .filter((image, index, all): image is ShowcaseImage => all.findIndex((other) => other.src === image.src) === index)
  return (
    <article className="pb-24 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6">
        <Breadcrumbs items={[
          { label: 'Showcase', href: showcasePath() },
          { label: 'Find a home', href: showcasePath('/properties') },
          ...(overview ? [{ label: overview.title, href: showcasePropertyPath(overview.slug) }] : []),
          { label },
        ]} />
      </div>
      {/* Gallery and facts share the first screen; the summary follows them on a phone. */}
      <section className="mx-auto max-w-7xl px-4 pt-3 md:px-6" aria-labelledby="collection-title">
        <div className="grid gap-x-12 gap-y-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <p className="sc-eyebrow">Step 1 of 3 · {collection.unitType} collection · {[collection.community, collection.city, collection.country].join(', ')}</p>
            <h1 id="collection-title" className="sc-title mt-3 text-estate-700">{collection.title}</h1>
          </div>
          <div className="min-w-0 lg:col-start-1 lg:row-span-3 lg:row-start-1">
            <ImageViews images={images} label="Collection images" preload sizes="(min-width: 1024px) 700px, 100vw" />
          </div>
          <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-start-2">
            <FactGrid className="sm:grid-cols-2" items={[
              ...(typeof collection.bedrooms === 'number' ? [{ label: 'Bedrooms', value: String(collection.bedrooms) }] : []),
              { label: 'Home type', value: collection.unitType },
              { label: 'Designs', value: `${collection.designs.length} brochure ${collection.designs.length === 1 ? 'design' : 'designs'}` },
              ...(range ? [{ label: collection.display.areaLabel, value: range, note: collection.display.areaSourceLabel }] : []),
            ]} />
            <ProvenanceLine provenance={collection.display.provenance} />
            <Notice>{collection.display.inventoryNotice}</Notice>
          </div>
          <div className="min-w-0 lg:col-start-2 lg:row-start-3">
            <p className="sc-lede text-muted-foreground">{collection.summary}</p>
            {overview && (
              <Link href={showcasePropertyPath(overview.slug)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-estate-700 underline underline-offset-4">
                <ArrowLeft aria-hidden className="size-4" /> Back to the {overview.title} community overview
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12 md:px-6 md:pt-16">
        <DesignExplorer
          collection={{ slug: collection.slug, title: collection.title, label }}
          designs={collection.designs}
          interiorSchemes={collection.interiorSchemes}
          display={collection.display}
          initialDesignKey={initialDesignKey}
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-6" aria-labelledby="collection-about-title">
        <div className="grid gap-10 border-t border-border pt-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <p className="sc-eyebrow">About the collection</p>
            <h2 id="collection-about-title" className="sc-heading mt-2 text-estate-700">{label.charAt(0).toUpperCase()}{label.slice(1)} at {collection.community}</h2>
            <TextBlocks blocks={collection.description} className="mt-6" />
          </div>
          <div className="space-y-8">
            {collection.keyFeatures.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-medium text-estate-700">Key features</h3>
                <ul className="mt-4 space-y-2.5">
                  {collection.keyFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/85"><Check aria-hidden className="mt-1 size-4 shrink-0 text-estate-700" />{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            {collection.amenities.length > 0 && (
              <details className="group rounded-2xl border border-border bg-surface">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 text-sm font-semibold text-estate-700">
                  {collection.display.amenitiesHeading ?? 'Planned community amenities'} ({collection.amenities.length})
                  <ChevronDown aria-hidden className="sc-chevron size-4 transition-transform" />
                </summary>
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <p className="text-xs leading-5 text-muted-foreground">Community proposals from the brochure, not confirmation of facilities included with every home or of opening dates.</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {collection.amenities.map((amenity) => <li key={amenity} className="text-sm text-estate-700">{amenity}</li>)}
                  </ul>
                </div>
              </details>
            )}
          </div>
        </div>
      </section>
    </article>
  )
}
