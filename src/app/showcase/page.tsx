import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { CommunityIntro, ReadyHomeCard } from '@/components/showcase/cards'
import { FixtureImage, SectionHeading } from '@/components/showcase/primitives'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'
import { bedroomList } from '@/lib/showcase/format'
import { getShowcaseCatalogue } from '@/lib/showcase/fixture'

export const metadata: Metadata = { title: 'Overview' }

export default function ShowcaseHomePage() {
  const catalogue = getShowcaseCatalogue()
  const florence = catalogue.communities[0]
  const london = catalogue.readyHomes[0]
  const featured = florence?.groups.find((group) => group.id === 'villas')?.collections[0]

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10" aria-labelledby="showcase-hero-title">
        <div className="grid items-center gap-7 lg:grid-cols-[0.85fr_1.25fr] lg:gap-14">
          <div className="max-w-lg py-2 lg:py-10">
            <p className="sc-eyebrow">Homes in the UK &amp; UAE</p>
            <h1 id="showcase-hero-title" className="sc-display mt-4 text-estate-700">A place to call<br />your own.</h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">From London homes to a new community in Sharjah. Find the space that feels like you.</p>
            <Link href={showcasePath('/properties')} className="sc-text-link mt-5">
              Explore the homes <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          {featured && (
            <figure className="min-w-0">
              <Link href={showcasePropertyPath(featured.slug)} className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-subtle lg:aspect-[6/5]" aria-label="Explore the Florence four-bedroom villas">
                <FixtureImage image={featured.media.hero} sizes="(min-width: 1280px) 710px, (min-width: 1024px) 60vw, 100vw" preload className="transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transform-none" />
                <span className="absolute bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-white text-estate-700 shadow-sm"><ArrowRight aria-hidden className="size-5" /></span>
              </Link>
              <figcaption className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs leading-5 text-muted-foreground">
                <span>Azizi Florence · Four-bedroom villas · Sharjah</span>
                <span>Artist’s impression</span>
              </figcaption>
            </figure>
          )}
        </div>

        <form role="search" aria-label="Search homes" method="get" action={showcasePath('/properties')} className="mt-7 flex flex-wrap items-center gap-3 border-y border-border py-4 md:mt-10 md:gap-6 md:py-5">
          <label htmlFor="home-search" className="font-serif text-2xl text-estate-700 md:shrink-0">Where feels like home?</label>
          <div className="flex min-w-0 flex-[1_1_280px] items-center gap-3 rounded-lg border border-estate-700/15 bg-white pl-3 pr-1.5">
            <Search aria-hidden className="size-4 shrink-0 text-estate-700" />
            <input id="home-search" name="q" type="search" maxLength={120} placeholder="Try Florence or North London" className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-estate-700 placeholder:text-muted-foreground md:text-sm" />
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-estate-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-estate-600">Search</button>
          </div>
          <Link href={showcasePath('/properties')} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-estate-700 underline underline-offset-4">All homes &amp; filters <ArrowRight aria-hidden className="size-4" /></Link>
        </form>
      </section>

      {florence && (
        <section className="sc-section px-4 md:px-6" aria-labelledby="showcase-florence-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="showcase-florence-title" eyebrow="A new community in Sharjah" title="Discover Azizi Florence" intro="Villas, townhouses and a masterplan shaped around landscaped parkland." />
            <CommunityIntro community={florence} variant="home" className="mt-7" />
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {florence.groups.map((group) => {
                const collection = group.collections[0]
                if (!collection) return null
                const design = collection.designs[0]
                const image = design?.images[0] ?? collection.media.hero
                return (
                  <Link key={group.id} href={`${showcasePropertyPath(florence.overview.slug)}#${group.id}`} className="group block rounded-xl">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-subtle">
                      <FixtureImage image={image} sizes="(min-width: 1280px) 600px, (min-width: 640px) 50vw, 100vw" className="transition-transform duration-700 group-hover:scale-[1.02] motion-reduce:transform-none" />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-3xl font-medium text-estate-700">{group.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{bedroomList(group.collections)} homes</p>
                      </div>
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-estate-700/20 text-estate-700 transition-colors group-hover:bg-estate-700 group-hover:text-white"><ArrowRight aria-hidden className="size-5" /></span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">Artist’s impression · {image.label ?? design?.label ?? collection.title}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {london && (
        <section className="border-t border-border px-4 py-12 md:px-6 md:py-16" aria-labelledby="showcase-london-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="showcase-london-title" eyebrow="Closer to home" title="Discover North London" intro="A three-bedroom terraced home, with a supplied floor plan and proposed interior concepts to explore." />
            <ReadyHomeCard home={london} wide className="mt-7" />
          </div>
        </section>
      )}

      <div className="border-t border-border px-4 py-6 md:px-6">
        <details className="mx-auto max-w-7xl text-sm text-muted-foreground">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-medium text-estate-700">About this preview <span aria-hidden>+</span></summary>
          <p className="max-w-3xl pb-3 pt-2 leading-6">Content was prepared on {catalogue.preparedOn} from supplied property material. Florence pricing, payment plans, handover and current availability still need confirmation. Plans and areas describe home designs, not available units. Brochure requests are simulated: nothing is stored or sent.</p>
        </details>
      </div>
    </>
  )
}
