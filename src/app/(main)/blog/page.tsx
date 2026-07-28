import { Suspense } from 'react'
import { sanityFetch } from '@/sanity'
import { POST_FIELDS, CATEGORIES_QUERY, POSTS_COUNT_QUERY } from '@/sanity/queries'
import {
  FeaturedPost,
  BlogGrid,
  BlogToolbar,
  Pagination,
  BlogCTA,
} from '@/components/blog'
import type { PostSummary } from '@/sanity/types'
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

const POSTS_PER_PAGE = 9

// Keep the listing fresh with Sanity edits (new posts, replaced images).
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'Property market intelligence, investment guides and buying & renting tips across the UK, Dubai and international markets — from Haus of Estate.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Insights — Haus of Estate',
    description:
      'Property market intelligence, investment guides and buying & renting tips across the UK, Dubai and beyond.',
    url: '/blog',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

interface Category {
  _id: string
  title: string
  slug: string
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string; category?: string; q?: string; sort?: string }>
}

async function BlogContent({
  page,
  category,
  q,
  sort,
}: {
  page: number
  category?: string
  q?: string
  sort?: string
}) {
  const start = (page - 1) * POSTS_PER_PAGE
  const end = start + POSTS_PER_PAGE
  const isFiltered = Boolean(category || q)

  const conditions = ['_type == "post"', 'status == "published"']
  if (category) conditions.push('$category in categories[]->slug.current')
  if (q) conditions.push('(title match $q || subtitle match $q || pt::text(body) match $q)')
  const where = conditions.join(' && ')
  const order = sort === 'oldest' ? 'publishedAt asc' : 'publishedAt desc'

  const listQuery = `*[${where}] | order(${order}) [$start...$end] { ${POST_FIELDS} }`
  const countQuery = `count(*[${where}])`
  const params: Record<string, unknown> = { start, end }
  if (category) params.category = category
  if (q) params.q = `*${q}*`

  const [{ data: posts }, { data: total }, { data: featuredPost }] = await Promise.all([
    sanityFetch<PostSummary[]>({ query: listQuery, params }),
    sanityFetch<number>({ query: countQuery, params }),
    !isFiltered && page === 1
      ? sanityFetch<PostSummary>({
          query: `*[_type == "post" && status == "published"] | order(publishedAt desc)[0] { ${POST_FIELDS} }`,
        })
      : Promise.resolve({ data: null }),
  ])

  const showFeatured = !isFiltered && page === 1 && featuredPost
  const gridPosts = (posts || []).filter((p) => !(showFeatured && p._id === featuredPost!._id))
  const count = total || 0

  return (
    <>
      {showFeatured && (
        <section className="mx-auto max-w-6xl px-5 sm:px-6">
          <FeaturedPost post={featuredPost!} />
        </section>
      )}

      <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border/70 pb-4">
          <h2 className="font-serif text-2xl font-medium text-ink-900 md:text-[1.75rem]">
            {q ? `Results for “${q}”` : category ? 'Filtered articles' : 'Latest articles'}
          </h2>
          <span className="shrink-0 text-sm text-slate-700">
            {count} article{count === 1 ? '' : 's'}
          </span>
        </div>

        <BlogGrid posts={gridPosts} />

        <div className="mt-16">
          <Pagination current={page} total={count} baseUrl="/blog" params={{ category, q, sort }} />
        </div>
      </section>
    </>
  )
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams
  const page = parseInt(sp.page || '1', 10)
  const { category, q, sort } = sp

  const [{ data: categories }, { data: totalArticles }] = await Promise.all([
    sanityFetch<Category[]>({ query: CATEGORIES_QUERY }),
    sanityFetch<number>({ query: POSTS_COUNT_QUERY }),
  ])

  return (
    <main className="min-h-screen bg-canvas pb-24">
      {/* Masthead */}
      <header className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl animate-fade-up px-5 py-16 text-center sm:px-6 md:py-24">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-gold-500">
            The Haus of Estate Journal
          </p>
          <h1 className="mt-5 font-serif text-[2.6rem] font-medium leading-[1.05] text-ink-900 md:text-[4.25rem]">
            Property Insights
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-700">
            Market intelligence, investment guides and buying &amp; renting tips across the UK,
            Dubai and international markets.
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mx-auto mt-12 max-w-6xl px-5 sm:px-6">
        <BlogToolbar categories={categories || []} />
      </div>

      <div className="mt-8">
        <Suspense
          key={`${page}-${category ?? ''}-${q ?? ''}-${sort ?? ''}`}
          fallback={
            <div className="mx-auto max-w-6xl px-5">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[22rem] animate-pulse rounded-2xl bg-stone-200/70" />
                ))}
              </div>
            </div>
          }
        >
          <BlogContent page={page} category={category} q={q} sort={sort} />
        </Suspense>
      </div>

      {/* Consultation CTA */}
      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-6">
        <BlogCTA articleCount={totalArticles || 0} />
      </section>
    </main>
  )
}
