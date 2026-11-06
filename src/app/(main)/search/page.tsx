import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { sanityFetch } from '@/sanity/live'
import { SITE_SEARCH_QUERY } from '@/sanity/queries'
import { normalizeSearchQuery, searchPublicSummaries, type SearchDocument } from '@/lib/site-search'

export const metadata: Metadata = {
  title: 'Search properties and articles',
  description: 'Search Haus of Estate properties and property articles.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
}

export default async function SearchPage({ searchParams }: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const query = normalizeSearchQuery((await searchParams).q)
  const { data } = query ? await sanityFetch<SearchDocument[]>({ query: SITE_SEARCH_QUERY }) : { data: [] }
  const matches = searchPublicSummaries(data || [], query)
  return (
    <div className="mx-auto min-h-[60vh] max-w-6xl px-5 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground"><Link href="/" className="hover:underline">Home</Link> / Search</p>
      <h1 className="mt-5 font-serif text-4xl text-estate-700">Find your next read or property</h1>
      <form action="/search" role="search" aria-label="Site search results" className="mt-7 flex max-w-2xl rounded-xl border border-border bg-white p-2">
        <label htmlFor="site-search" className="sr-only">Search properties and articles</label>
        <input key={query} id="site-search" type="search" name="q" defaultValue={query} maxLength={120} placeholder="Search properties and articles" className="min-w-0 flex-1 rounded-lg px-3 py-3 text-base outline-estate-700" />
        <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-estate-700 px-4 text-white" type="submit"><Search className="size-4" aria-hidden="true" /><span>Search</span></button>
      </form>
      {!query ? <p className="mt-8 text-muted-foreground">Try a location, development name or article topic.</p> : !data ? (
        <p className="mt-8" role="status">Search is temporarily unavailable. Please try again, or <Link href="/contact" className="underline">contact our team</Link>.</p>
      ) : (
        <>
          <p className="mt-6 break-words text-muted-foreground">{matches.length} {matches.length === 1 ? 'result' : 'results'} for “{query}”</p>
          {(['property', 'post'] as const).map((type) => {
            const results = matches.filter((item) => item._type === type)
            return (
              <section key={type} className="mt-10" aria-labelledby={`${type}-results`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <h2 id={`${type}-results`} className="font-serif text-2xl text-estate-700">{type === 'property' ? 'Properties' : 'Articles'} <span className="text-base text-muted-foreground">({results.length})</span></h2>
                  <Link className="inline-flex min-h-11 items-center text-sm underline" href={`/${type === 'property' ? 'properties' : 'blog'}?q=${encodeURIComponent(query)}`}>{type === 'property' ? 'Refine property search' : 'Search articles'}</Link>
                </div>
                {results.length === 0 ? <p className="py-6 text-muted-foreground">No matching {type === 'property' ? 'properties' : 'articles'}. Try fewer words or a different topic.</p> : (
                  <ul className="divide-y divide-border">
                    {results.map((item) => (
                      <li key={item._id}>
                        <Link href={`/${type === 'property' ? 'properties' : 'blog'}/${encodeURIComponent(item.slug)}`} className="group flex items-center justify-between gap-5 py-6">
                          <div><h3 className="font-serif text-xl text-estate-700 group-hover:underline">{item.title}</h3>
                            {item.summary && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.summary}</p>}
                            {type === 'property' && <p className="mt-2 text-xs text-muted-foreground">{[item.community, item.city, item.country].filter(Boolean).join(' · ')}</p>}
                          </div><ArrowRight className="size-5 shrink-0 text-estate-700" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
