import { Suspense } from 'react'
import { sanityFetch } from '@/sanity'
import { POSTS_QUERY, FEATURED_POST_QUERY, POSTS_COUNT_QUERY } from '@/sanity/queries'
import { FeaturedPost, BlogGrid, Pagination } from '@/components/blog'
import type { PostSummary } from '@/sanity/types'
import type { Metadata } from 'next'

const POSTS_PER_PAGE = 10

export const metadata: Metadata = {
  title: 'Blog | Haus Of Estate',
  description: 'Insights, market trends, and company news from Haus Of Estate.',
  openGraph: {
    title: 'Blog | Haus Of Estate',
    description: 'Insights, market trends, and company news from Haus Of Estate.',
    type: 'website',
  },
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>
}

async function BlogContent({ page }: { page: number }) {
  const start = (page - 1) * POSTS_PER_PAGE
  const end = start + POSTS_PER_PAGE

  const [{ data: posts }, { data: total }, { data: featuredPost }] = await Promise.all([
    sanityFetch<PostSummary[]>({ query: POSTS_QUERY, params: { start, end } }),
    sanityFetch<number>({ query: POSTS_COUNT_QUERY }),
    page === 1 ? sanityFetch<PostSummary>({ query: FEATURED_POST_QUERY }) : Promise.resolve({ data: null }),
  ])

  return (
    <>
      {page === 1 && featuredPost && (
        <div className="mb-12">
          <FeaturedPost post={featuredPost} />
        </div>
      )}
      <BlogGrid posts={posts || []} />
      <div className="mt-12">
        <Pagination current={page} total={total || 0} baseUrl="/blog" />
      </div>
    </>
  )
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam } = await searchParams
  const page = parseInt(pageParam || '1', 10)

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-ink-900">Blog</h1>
          <p className="mt-3 text-lg text-slate-700">
            Insights, market trends, and company news
          </p>
        </div>

        <Suspense fallback={<BlogGrid posts={[]} />}>
          <BlogContent page={page} />
        </Suspense>
      </div>
    </main>
  )
}