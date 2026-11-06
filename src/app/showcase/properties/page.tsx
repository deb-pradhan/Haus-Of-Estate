import type { Metadata } from 'next'
import Link from 'next/link'
import { X } from 'lucide-react'
import { CollectionCard, CommunityIntro, ReadyHomeCard } from '@/components/showcase/cards'
import { Breadcrumbs, SectionHeading } from '@/components/showcase/primitives'
import { ShowcaseSearchForm } from '@/components/showcase/showcase-search-form'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'
import {
  getShowcaseCatalogue,
  searchShowcase,
  showcaseBedroomOptions,
  showcaseLocationGroups,
  showcaseTypeOptions,
} from '@/lib/showcase/fixture'
import { activeShowcaseFilters, normalizeShowcaseSearch, type ShowcaseSearchParamsInput } from '@/lib/showcase/search'

export const metadata: Metadata = { title: 'Find a home' }

function summarise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default async function ShowcaseCataloguePage({ searchParams }: { searchParams: Promise<ShowcaseSearchParamsInput> }) {
  const search = normalizeShowcaseSearch(await searchParams)
  const catalogue = getShowcaseCatalogue()
  const result = searchShowcase(search, catalogue)
  const filters = activeShowcaseFilters(search)
  const summaryParts = [
    result.communities.length ? summarise(result.communities.length, 'community', 'communities') : null,
    result.collectionCount ? summarise(result.collectionCount, 'home collection') : null,
    result.readyHomes.length ? summarise(result.readyHomes.length, 'existing home') : null,
  ].filter(Boolean)

  return (
    <>
      <section className="border-b border-border bg-[#f3efe6] px-4 pb-8 pt-4 md:px-6 md:pb-10" aria-labelledby="catalogue-title">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: 'Showcase', href: showcasePath() }, { label: 'Find a home' }]} />
          <div className="mt-3 max-w-2xl">
            <p className="sc-eyebrow">Property search</p>
            <h1 id="catalogue-title" className="sc-title mt-2 text-estate-700">Find a home</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Narrow by place first, then by home type and bedrooms. Communities show only the collections that match.</p>
          </div>
          <div className="mt-6">
            <ShowcaseSearchForm key={JSON.stringify(search)} locations={showcaseLocationGroups()} types={showcaseTypeOptions()} bedrooms={showcaseBedroomOptions()} initial={search} variant="bar" />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-6 md:py-14" aria-labelledby="results-title">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <h2 id="results-title" className="sr-only">Results</h2>
            <p role="status" className="text-sm font-medium text-estate-700">
              {result.total === 0 ? 'No homes match these filters.' : `Showing ${summaryParts.join(', ')}.`}
            </p>
            {filters.length > 0 && (
              <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                {filters.map((filter) => (
                  <li key={filter.key}>
                    <Link href={filter.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-estate-700/20 bg-surface px-3.5 text-sm text-estate-700 hover:border-estate-700/50" aria-label={`Remove filter ${filter.label}`}>
                      {filter.label} <X aria-hidden className="size-3.5" />
                    </Link>
                  </li>
                ))}
                <li><Link href={showcasePath('/properties')} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-estate-700 underline underline-offset-4">Clear all</Link></li>
              </ul>
            )}
          </div>

          {result.total === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-estate-700/30 bg-surface p-8 md:p-12">
              <p className="sc-eyebrow">Nothing to show yet</p>
              <h3 className="sc-heading mt-2 text-estate-700">Try a wider search</h3>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                The showcase holds {summarise(catalogue.communities.length, 'community', 'communities')} in Sharjah and {summarise(catalogue.readyHomes.length, 'existing home')} in North London. Remove a filter above, or start again.
              </p>
              <ul className="mt-6 flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <li key={filter.key}><Link href={filter.href} className="inline-flex min-h-12 items-center rounded-xl border border-estate-700/25 px-5 text-sm font-semibold text-estate-700 hover:bg-estate-700/5">Without {filter.label}</Link></li>
                ))}
                <li><Link href={showcasePath('/properties')} className="inline-flex min-h-12 items-center rounded-xl bg-estate-700 px-5 text-sm font-semibold text-white hover:bg-estate-600">Show everything</Link></li>
              </ul>
            </div>
          ) : (
            <div className="mt-8 space-y-16">
              {result.communities.map((community) => {
                const full = catalogue.communities.find((entry) => entry.overview.id === community.overview.id)
                const partial = Boolean(full && full.collections.length !== community.collections.length)
                return (
                  <section key={community.overview.id} aria-labelledby={`community-${community.overview.slug}`}>
                    <h3 id={`community-${community.overview.slug}`} className="sr-only">{community.overview.title}</h3>
                    <CommunityIntro community={community} />
                    {partial && full && (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Showing {community.collections.length} of {full.collections.length} collections at {community.overview.title}.{' '}
                        <Link href={showcasePropertyPath(community.overview.slug)} className="font-medium text-estate-700 underline underline-offset-4">See the whole community</Link>
                      </p>
                    )}
                    {community.groups.map((group) => (
                      <div key={group.id} className="mt-10">
                        <SectionHeading eyebrow={`${community.overview.community} · ${group.title.toLowerCase()}`} title={group.title} />
                        <div className={`mt-6 grid gap-5 sm:grid-cols-2 ${group.collections.length > 2 ? 'lg:grid-cols-3' : ''}`}>
                          {group.collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}
                        </div>
                      </div>
                    ))}
                  </section>
                )
              })}
              {result.readyHomes.length > 0 && (
                <section aria-labelledby="ready-homes-title">
                  <SectionHeading id="ready-homes-title" eyebrow="Existing home" title="Existing homes" intro="An individual home with a public asking price sampled from its listing on 6 November 2026. Measurements are approximate; confirm current availability with sales." />
                  <div className="mt-6 grid gap-5">
                    {result.readyHomes.map((home) => <ReadyHomeCard key={home.id} home={home} wide />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
