import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { loadPropertyPreviews } from '@/lib/property-previews'

const formatPrice = (amount: number) => `AED ${new Intl.NumberFormat('en-GB').format(amount)}`

export default async function PropertyPreviewsPage() {
  const previews = await loadPropertyPreviews()
  const overview = previews.find(({ kind }) => kind === 'development')
  const groups = [
    { type: 'Villa', title: 'Villas', id: 'villas' },
    { type: 'Townhouse', title: 'Townhouses', id: 'townhouses' },
  ].map((group) => ({
    ...group,
    homes: previews.filter(({ kind, document }) => kind === 'home-type' && document.unitType === group.type)
      .sort((a, b) => (a.document.bedrooms ?? 0) - (b.document.bedrooms ?? 0)),
  }))

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-500">Haus of Estate · Local drafts</p>
        <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-xs leading-relaxed text-estate-700">
          <strong>Draft preview · not published.</strong> Prices apply to Clusters 1 & 2. Sizes, payment plans, handover and availability await confirmation. Enquiries are disabled.
        </div>

        {previews.length === 0 ? (
          <p className="mt-10 rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">No prepared bundle is available. Set HAUS_PROPERTY_PREVIEW_DIR to the complete local preparation output directory, then restart the development server.</p>
        ) : (
          <>
            {overview && (
              <section aria-labelledby="florence-title" className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="grid lg:grid-cols-[1.2fr_1fr]">
                  <div className="relative min-h-72 lg:min-h-[430px]">
                    <Image src={overview.media.hero.src} alt={overview.media.hero.alt} fill unoptimized priority sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-center p-6 md:p-10">
                    <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Community overview · {overview.document.city}</p>
                    <h1 id="florence-title" className="mt-3 font-serif text-4xl font-medium text-estate-700 md:text-5xl">{overview.document.title}</h1>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{overview.document.summary}</p>
                    {overview.document.amenities?.length ? (
                      <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm text-estate-700">
                        {overview.document.amenities.slice(0, 3).map((amenity) => <li key={amenity}>{amenity}</li>)}
                      </ul>
                    ) : null}
                    <Link href={`/dev/property-previews/${overview.document.slug.current}`} className="mt-7 inline-flex min-h-11 w-fit items-center gap-3 rounded-md bg-estate-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-estate-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">
                      Explore the community <ArrowRight aria-hidden className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            )}
            <div className="mt-12 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl text-estate-700">Find your home at Florence</h2>
                <p className="mt-2 text-sm text-muted-foreground">Explore the home designs. Individual units await confirmed inventory.</p>
              </div>
              <nav aria-label="Home types" className="flex gap-5 text-sm text-estate-700">
                {groups.filter(({ homes }) => homes.length).map(({ id, title }) => <a key={id} href={`#${id}`} className="py-2 underline underline-offset-4">{title}</a>)}
              </nav>
            </div>
            {groups.filter(({ homes }) => homes.length).map(({ id, title, homes }) => {
              const prices = homes.map(({ document }) => document.priceCurrency === 'AED' ? document.priceAmount : undefined)
              const startingPrice = prices.every((price): price is number => typeof price === 'number') ? Math.min(...prices) : undefined
              return (
                <section key={id} id={id} aria-labelledby={`${id}-title`} className="mt-10 scroll-mt-8 md:mt-12">
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <h3 id={`${id}-title`} className="font-serif text-sm uppercase tracking-[0.24em] text-estate-700">{title}</h3>
                    {startingPrice !== undefined && <p className="text-sm text-estate-700">From {formatPrice(startingPrice)} <span className="text-xs text-muted-foreground">· Clusters 1 & 2</span></p>}
                  </div>
                  <div className={`grid gap-6 md:grid-cols-2 ${homes.length > 2 ? 'lg:grid-cols-3' : ''}`}>
                    {homes.map(({ document, media }) => (
                      <Link key={document._id} href={`/dev/property-previews/${document.slug.current}`} className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700">
                        <div className="relative aspect-[3/2] overflow-hidden bg-estate-700">
                          <Image src={media.hero.src} alt={media.hero.alt} fill unoptimized sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none" />
                        </div>
                        <div className="p-5 md:p-6">
                          <h4 className="font-serif text-2xl font-medium text-estate-700">{document.bedrooms}-bedroom {title.toLowerCase()}</h4>
                          {document.priceAmount !== undefined && document.priceCurrency === 'AED' && <p className="mt-2 text-sm text-estate-700">From {formatPrice(document.priceAmount)}</p>}
                          <span className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-estate-700">Explore the designs <ArrowRight aria-hidden className="h-4 w-4" /></span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
