import { Suspense } from 'react'
import { sanityFetch } from '@/sanity'
import { POST_FIELDS, FEATURED_POST_QUERY, CATEGORIES_QUERY } from '@/sanity/queries'
import { FeaturedPost, BlogGrid, BlogToolbar, Pagination } from '@/components/blog'
import type { PostSummary } from '@/sanity/types'
import type { Metadata } from 'next'

const POSTS_PER_PAGE = 9

export const metadata: Metadata = {
  title: 'Insights | Haus of Estate',
  description:
    'Property market intelligence, investment guides and buying & renting tips across the UK, Dubai and international markets — from Haus of Estate.',
  openGraph: {
    title: 'Insights | Haus of Estate',
    description:
      'Property market intelligence, investment guides and buying & renting tips across the UK, Dubai and beyond.',
    type: 'website',
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

  // Build the listing filter dynamically from active category / search.
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
      ? sanityFetch<PostSummary>({ query: FEATURED_POST_QUERY })
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

      <section className="mx-auto mt-14 max-w-6xl px-5 sm:px-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-medium text-ink-900 md:text-3xl">
            {q ? `Results for “${q}”` : category ? 'Filtered articles' : 'Latest articles'}
          </h2>
          <span className="text-sm text-slate-700">
            {count} article{count === 1 ? '' : 's'}
          </span>
        </div>

        <BlogGrid posts={gridPosts} />

        <div className="mt-14">
          <Pagination
            current={page}
            total={count}
            baseUrl="/blog"
            params={{ category, q, sort }}
          />
        </div>
      </section>
    </>
  )
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams
  const page = parseInt(sp.page || '1', 10)
  const { category, q, sort } = sp

  const { data: categories } = await sanityFetch<Category[]>({ query: CATEGORIES_QUERY })

  return (
    <main className="min-h-screen bg-canvas pb-24">
      {/* Masthead */}
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">
            The Haus of Estate Journal
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-ink-900 md:text-6xl">
            Property Insights
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-700">
            Market intelligence, investment guides and buying &amp; renting tips across
            the UK, Dubai and international markets.
          </p>
        </div>
      </header>

      {/* Toolbar: search · categories · sort */}
      <div className="mx-auto mt-12 max-w-6xl px-5 sm:px-6">
        <BlogToolbar categories={categories || []} />
      </div>

      <div className="mt-10">
        <Suspense
          key={`${page}-${category ?? ''}-${q ?? ''}-${sort ?? ''}`}
          fallback={
            <div className="mx-auto max-w-6xl px-5">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-stone-200" />
                ))}
              </div>
            </div>
          }
        >
          <BlogContent page={page} category={category} q={q} sort={sort} />
        </Suspense>
      </div>
    </main>
  )
}
