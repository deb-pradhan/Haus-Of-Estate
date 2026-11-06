import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileText, LayoutGrid, MousePointerClick } from 'lucide-react'
import { CommunityIntro, ReadyHomeCard } from '@/components/showcase/cards'
import { FixtureImage, SectionHeading } from '@/components/showcase/primitives'
import { ShowcaseSearchForm } from '@/components/showcase/showcase-search-form'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'
import { bedroomList } from '@/lib/showcase/format'
import {
  getShowcaseCatalogue,
  showcaseBedroomOptions,
  showcaseLocationGroups,
  showcaseTypeOptions,
} from '@/lib/showcase/fixture'

export const metadata: Metadata = { title: 'Overview' }

const STEPS = [
  { icon: LayoutGrid, title: 'Choose a collection', text: 'Start with a place, then a bedroom collection: villas or townhouses at Florence, or the existing home in North London.' },
  { icon: MousePointerClick, title: 'Study the designs', text: 'Compare brochure designs side by side with uncropped floor plans, built-up areas and clearly labelled illustrations.' },
  { icon: FileText, title: 'Request the brochure', text: 'Ask for the collection brochure with your chosen design noted. Marketing emails stay optional and unticked.' },
]

export default function ShowcaseHomePage() {
  const catalogue = getShowcaseCatalogue()
  const florence = catalogue.communities[0]
  const london = catalogue.readyHomes[0]
  const designCount = catalogue.communities.reduce((count, community) => count + community.designCount, 0)

  return (
    <>
      <section className="relative isolate overflow-hidden bg-estate-700 text-white" aria-labelledby="showcase-hero-title">
        {florence && (
          <div className="absolute inset-0 -z-10">
            <FixtureImage image={florence.overview.media.hero} sizes="100vw" preload className="opacity-55" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-estate-700/70 via-estate-700/55 to-estate-700/90" />
          </div>
        )}
        <div className="sc-on-dark mx-auto max-w-7xl px-4 pb-10 pt-14 md:px-6 md:pb-16 md:pt-24">
          <div className="max-w-3xl">
            <p className="sc-eyebrow sc-eyebrow--light">Haus of Estate · design showcase</p>
            <h1 id="showcase-hero-title" className="sc-display mt-4 text-white">Find your next home, from the first search to the floor plan.</h1>
            <p className="sc-lede mt-5 max-w-2xl text-white/80">
              Browse by country, city and community, compare the brochure designs for a collection, and request the brochure for the one that interests you. One community in Sharjah and one existing home in North London are included for review.
            </p>
          </div>
          <div className="mt-8 max-w-5xl text-estate-700 md:mt-10">
            <ShowcaseSearchForm locations={showcaseLocationGroups()} types={showcaseTypeOptions()} bedrooms={showcaseBedroomOptions()} variant="hero" />
          </div>
          <dl className="mt-8 grid max-w-3xl grid-cols-3 gap-4 text-white/80">
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Communities</dt><dd className="mt-1 font-serif text-2xl text-white">{catalogue.communities.length}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Brochure designs</dt><dd className="mt-1 font-serif text-2xl text-white">{designCount}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Existing homes</dt><dd className="mt-1 font-serif text-2xl text-white">{catalogue.readyHomes.length}</dd></div>
          </dl>
        </div>
      </section>

      {florence && (
        <section className="sc-section px-4 md:px-6" aria-labelledby="showcase-florence-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="showcase-florence-title" eyebrow="Start with a community" title="Azizi Florence, Sharjah" intro="A planned community of villa and townhouse designs. Explore it as one place first, then step into the Villas or Townhouses collections." />
            <CommunityIntro community={florence} variant="home" className="mt-8" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {florence.groups.map((group) => (
                <Link key={group.id} href={`${showcasePropertyPath(florence.overview.slug)}#${group.id}`} className="sc-lift flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-estate-700">
                  <span>
                    <span className="block font-serif text-xl font-medium">{group.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{bedroomList(group.collections)} {group.title.toLowerCase()} · {group.collections.length} {group.collections.length === 1 ? 'collection' : 'collections'} · {group.collections.reduce((count, item) => count + item.designs.length, 0)} brochure designs</span>
                  </span>
                  <ArrowRight aria-hidden className="size-5 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {london && (
        <section className="px-4 pb-4 md:px-6" aria-labelledby="showcase-london-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="showcase-london-title" eyebrow="Prefer an existing home?" title="A three-bedroom house in North London" intro="The existing-home comparison: a public asking price sampled from its listing, an approximate internal floor area and clearly labelled existing views beside proposed interior concepts." />
            <ReadyHomeCard home={london} wide className="mt-8" />
          </div>
        </section>
      )}

      <section className="sc-section px-4 md:px-6" aria-labelledby="showcase-steps-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading id="showcase-steps-title" eyebrow="How it works" title="Three clear decisions, no dense rows of controls" />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-border bg-surface p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-estate-700/8 text-estate-700"><step.icon aria-hidden className="size-5" /></span>
                  <span className="sc-eyebrow">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 font-serif text-2xl font-medium text-estate-700">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={showcasePath('/properties')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-estate-600">
              Browse all homes <ArrowRight aria-hidden className="size-4" />
            </Link>
            {florence && <Link href={showcasePropertyPath(florence.overview.slug)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-estate-700/25 px-6 text-sm font-semibold text-estate-700 transition-colors hover:bg-estate-700/5">
              Go straight to Florence
            </Link>}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface px-4 py-10 md:px-6" aria-labelledby="showcase-about-title">
        <div className="mx-auto max-w-7xl">
          <h2 id="showcase-about-title" className="font-serif text-xl font-medium text-estate-700">About this showcase</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Content comes from a sanitized fixture prepared on {catalogue.preparedOn}, using existing Haus CDN images. Florence prices, payment terms, handover dates and available inventory are deliberately absent and must be confirmed with sales. Plans and areas are brochure figures for a design, not an available-unit schedule. The brochure request is a simulation of the native journey: it validates against the real lead contract and renders the real email template, but nothing is stored or sent.
          </p>
        </div>
      </section>
    </>
  )
}
