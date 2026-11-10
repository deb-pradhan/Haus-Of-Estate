import Link from 'next/link'
import { ArrowRight, Check, Mail } from 'lucide-react'
import { showcasePath } from '@/lib/showcase/access'
import { SHOWCASE_SALES_EMAIL, showcaseMailto } from '@/lib/showcase/contact'
import type { ShowcaseCommunity } from '@/lib/showcase/fixture'
import { bedroomList } from '@/lib/showcase/format'
import { CollectionCard } from './cards'
import { Breadcrumbs, FactGrid, FixtureImage, Notice, ProvenanceLine, SectionHeading, TextBlocks } from './primitives'

function bedroomSpan(collections: ShowcaseCommunity['collections']): string {
  return bedroomList(collections)
}

export function CommunityView({ community }: { community: ShowcaseCommunity }) {
  const { overview, groups } = community
  const jumpLinks = [
    ...groups.map((group) => ({ href: `#${group.id}`, label: group.title })),
    ...(overview.amenities.length ? [{ href: '#amenities', label: 'Amenities' }] : []),
    ...(overview.media.gallery.length ? [{ href: '#gallery', label: 'Gallery' }] : []),
  ]
  return (
    <article>
      <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6">
        <Breadcrumbs items={[{ label: 'Showcase', href: showcasePath() }, { label: 'Find a home', href: showcasePath('/properties') }, { label: overview.title }]} />
      </div>

      {/* Wide community introduction */}
      <section className="mx-auto max-w-7xl px-4 pt-3 md:px-6" aria-labelledby="community-title">
        <figure className="overflow-hidden rounded-3xl border border-border bg-estate-700">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
            <FixtureImage image={overview.media.hero} sizes="(min-width: 1280px) 1216px, 100vw" preload />
          </div>
          <figcaption className="bg-surface px-4 py-2.5 text-xs text-muted-foreground">{overview.media.hero.alt}</figcaption>
        </figure>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <div>
            <p className="sc-eyebrow">Community · {[overview.community, overview.city, overview.country].join(', ')}</p>
            <h1 id="community-title" className="sc-display mt-3 text-estate-700">{overview.title}</h1>
            <p className="sc-lede mt-5 text-muted-foreground">{overview.summary}</p>
            <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
              {jumpLinks.map((link) => (
                <a key={link.href} href={link.href} className="inline-flex min-h-11 items-center rounded-full border border-estate-700/20 bg-surface px-4 text-sm font-medium text-estate-700 hover:border-estate-700/50">{link.label}</a>
              ))}
            </nav>
          </div>
          <div className="space-y-4">
            <Notice>{overview.display.inventoryNotice}</Notice>
            <FactGrid className="sm:grid-cols-2" items={[
              ...(overview.developer ? [{ label: 'Developer', value: overview.developer }] : []),
              { label: 'Home designs', value: `${community.designCount} brochure designs` },
              ...groups.map((group) => ({ label: group.title, value: `${bedroomSpan(group.collections)} designs`, note: `${group.collections.length} ${group.collections.length === 1 ? 'collection' : 'collections'}, one per bedroom count` })),
            ]} />
            <ProvenanceLine provenance={overview.display.provenance} />
          </div>
        </div>
      </section>

      {/* Separate Villas and Townhouses sections */}
      {groups.map((group) => (
        <section key={group.id} id={group.id} className="sc-section scroll-mt-24 px-4 md:px-6" aria-labelledby={`${group.id}-title`}>
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
              <SectionHeading id={`${group.id}-title`} eyebrow={`${overview.community} · ${group.title.toLowerCase()}`} title={group.title}
                intro={`${bedroomSpan(group.collections)} ${group.type.toLowerCase()} designs. Choose a bedroom collection to compare its designs, floor plans and areas.`} />
              <p className="text-sm text-muted-foreground">{group.collections.reduce((count, item) => count + item.designs.length, 0)} brochure designs</p>
            </div>
            <div className={`mt-8 grid gap-5 sm:grid-cols-2 ${group.collections.length > 2 ? 'lg:grid-cols-3' : ''}`}>
              {group.collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}
            </div>
          </div>
        </section>
      ))}

      <section className="px-4 md:px-6" aria-labelledby="community-about-title">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-border pt-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <SectionHeading id="community-about-title" eyebrow="About the community" title={`Living at ${overview.community}`} />
            <TextBlocks blocks={overview.description} className="mt-6" />
          </div>
          {overview.keyFeatures.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-medium text-estate-700">Key features</h3>
              <ul className="mt-4 space-y-2.5">
                {overview.keyFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/85"><Check aria-hidden className="mt-1 size-4 shrink-0 text-estate-700" />{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {overview.amenities.length > 0 && (
        <section id="amenities" className="sc-section scroll-mt-24 px-4 md:px-6" aria-labelledby="amenities-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="amenities-title" eyebrow="Masterplan" title={overview.display.amenitiesHeading ?? 'Planned community amenities'}
              intro="Community proposals shown in the brochure. They are not confirmation of facilities included with every home, nor of delivery or opening dates." />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-estate-700"><span aria-hidden className="size-2 rounded-full bg-gold-500" />{amenity}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {overview.media.gallery.length > 0 && (
        <section id="gallery" className="scroll-mt-24 px-4 pb-16 md:px-6" aria-labelledby="gallery-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="gallery-title" eyebrow={`${overview.media.gallery.length} illustrations`} title="Around the community" intro="Architectural renders supplied for the community. They illustrate the designs and are not photographs of completed homes." />
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {overview.media.gallery.map((image) => (
                <li key={image.src}>
                  <figure className="overflow-hidden rounded-2xl border border-border bg-surface">
                    <div className="relative aspect-[3/2] bg-estate-700/5"><FixtureImage image={image} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" /></div>
                    <figcaption className="px-4 py-3 text-xs leading-5 text-muted-foreground">{image.alt}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {groups[0] && <a href={`#${groups[0].id}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-6 text-sm font-semibold text-white hover:bg-estate-600">Back to the collections <ArrowRight aria-hidden className="size-4" /></a>}
              <a href={showcaseMailto(`Question — ${overview.title}`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-estate-700/25 px-6 text-sm font-semibold text-estate-700 hover:bg-estate-700/5"><Mail aria-hidden className="size-4" /> Email a question</a>
              <Link href={showcasePath('/properties')} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-estate-700/25 px-6 text-sm font-semibold text-estate-700 hover:bg-estate-700/5">Back to search</Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">The email link opens your own email app addressed to {SHOWCASE_SALES_EMAIL}; the showcase itself sends nothing.</p>
          </div>
        </section>
      )}
    </article>
  )
}
