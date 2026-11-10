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
  showcaseSearchIndex,
  showcaseTypeOptions,
} from '@/lib/showcase/fixture'
import {
  activeShowcaseFilters, homesLabel, normalizeShowcaseSearch, showcaseSearchHref, showcaseSearchWithout,
  SHOWCASE_SORTS, type ShowcaseSearchParamsInput,
} from '@/lib/showcase/search'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Find a home' }

function summarise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default async function ShowcaseCataloguePage({ searchParams }: { searchParams: Promise<ShowcaseSearchParamsInput> }) {
  const search = normalizeShowcaseSearch(await searchParams)
  const catalogue = getShowcaseCatalogue()
  const result = searchShowcase(search, catalogue)
  const filters = activeShowcaseFilters(search)
  // What each active filter is costing: the homes shown if it alone were removed.
  const widenings = filters.map((filter) => ({
    ...filter,
    homes: searchShowcase(showcaseSearchWithout(search, filter.key), catalogue).homeCount,
  })).filter((filter) => filter.homes > 0)
  const everything = searchShowcase({}, catalogue).homeCount
  const sort = search.sort ?? 'curated'
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
            <ShowcaseSearchForm key={JSON.stringify(search)} locations={showcaseLocationGroups()} types={showcaseTypeOptions()} bedrooms={showcaseBedroomOptions()} index={showcaseSearchIndex(catalogue)} initial={search} variant="bar" />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-6 md:py-14" aria-labelledby="results-title">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-border pb-5">
            <div>
              <h2 id="results-title" className="sc-heading text-estate-700">
                {result.homeCount === 0 ? 'No homes match these filters' : `${homesLabel(result.homeCount)}${filters.length ? ' match' : ''}`}
              </h2>
              <p role="status" className="mt-1 text-sm font-medium text-estate-700">
                {result.total === 0 ? 'The wider searches below say how many homes each would show.' : `Showing ${summaryParts.join(', ')}.`}
              </p>
            </div>
            {result.collectionCount > 1 && (
              <nav aria-label="Sort home collections" className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className="mr-1 text-muted-foreground">Sort</span>
                {SHOWCASE_SORTS.map((option) => (
                  <Link key={option.value} href={showcaseSearchHref({ ...search, sort: option.value })} aria-current={sort === option.value ? 'true' : undefined} scroll={false}
                    className={cn('inline-flex min-h-11 items-center rounded-full border px-3.5 font-medium', sort === option.value ? 'border-estate-700 bg-estate-700 text-white' : 'border-estate-700/20 bg-surface text-estate-700 hover:border-estate-700/50')}>
                    {option.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
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
                The showcase holds {summarise(catalogue.communities.length, 'community', 'communities')} in Sharjah and {summarise(catalogue.readyHomes.length, 'existing home')} in North London.{' '}
                {widenings.length > 0 ? 'Each option below removes one filter and says how many homes that would show.' : 'No single filter is the cause, so start again from everything.'}
              </p>
              <ul className="mt-6 flex flex-wrap gap-3" aria-label="Wider searches">
                {widenings.map((filter) => (
                  <li key={filter.key}><Link href={filter.href} className="inline-flex min-h-12 items-center rounded-xl border border-estate-700/25 px-5 text-sm font-semibold text-estate-700 hover:bg-estate-700/5">Without {filter.label} · {homesLabel(filter.homes)}</Link></li>
                ))}
                <li><Link href={showcasePath('/properties')} className="inline-flex min-h-12 items-center rounded-xl bg-estate-700 px-5 text-sm font-semibold text-white hover:bg-estate-600">Show everything · {homesLabel(everything)}</Link></li>
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
