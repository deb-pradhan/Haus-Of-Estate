import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { sanityFetch, urlFor } from '@/sanity'
import { POST_BY_SLUG_QUERY, RELATED_POSTS_QUERY, SEO_QUERY } from '@/sanity/queries'
import { PortableTextRenderer, TableOfContents, AuthorCard, CategoryBadge, BlogCard } from '@/components/blog'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'
import type { Post, PostSummary } from '@/sanity/types'
import type { Metadata } from 'next'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data } = await sanityFetch<{ title: string; subtitle?: string; publishedAt?: string; seo?: { seoTitle?: string; seoDesc?: string } }>({ query: SEO_QUERY, params: { slug } })

  if (!data) return { title: 'Post Not Found' }

  return {
    title: data.seo?.seoTitle || data.title,
    description: data.seo?.seoDesc || data.subtitle || '',
    openGraph: {
      title: data.seo?.seoTitle || data.title,
      description: data.seo?.seoDesc || data.subtitle || '',
      type: 'article',
      publishedTime: data.publishedAt,
    },
  }
}

export async function generateStaticParams() {
  const { data } = await sanityFetch<Array<{ slug: string }>>({
    query: `*[_type == "post" && status == "published" && defined(slug.current)]{ "slug": slug.current }`,
  })
  return data?.map((post) => ({ slug: post.slug })) || []
}

function getPostImageUrl(post: Post): { url: string; alt: string } {
  if (post.featuredImage) {
    const sanityUrl = post.featuredImage?.url || post.featuredImage?.asset?.url
    if (sanityUrl) {
      return { url: sanityUrl, alt: post.featuredImage.alt || post.title }
    }
  }

  const fallbackUrl = FALLBACK_IMAGES[post.slug]
  if (fallbackUrl) {
    return { url: fallbackUrl, alt: FALLBACK_ALTS[post.slug] || post.title }
  }

  return { url: '', alt: post.title }
}

async function PostContent({ slug }: { slug: string }) {
  const { data: post } = await sanityFetch<Post>({
    query: POST_BY_SLUG_QUERY,
    params: { slug },
  })

  if (!post) return null

  const categoryIds = post.categories?.map((c) => c._ref) || []
  const { data: relatedPosts } = await sanityFetch<PostSummary[]>({
    query: RELATED_POSTS_QUERY,
    params: { postId: post._id, categoryIds },
  })

  const { url: imageUrl, alt } = getPostImageUrl(post)

  return (
    <>
      <article className="mx-auto max-w-3xl">
        <header className="mb-10">
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.categories.map((cat, i) => (
                <CategoryBadge key={cat.slug || `cat-${i}`} category={cat} />
              ))}
            </div>
          )}
          <h1 className="font-serif text-3xl md:text-5xl font-medium leading-tight text-ink-900">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-4 text-xl text-slate-700">{post.subtitle}</p>
          )}
          <div className="mt-8 flex items-center gap-4">
            {post.author?.avatar && (
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={urlFor(post.author.avatar).width(96).height(96).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-medium text-ink-900">{post.author?.name}</p>
              <p className="text-sm text-slate-700">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </header>

        {imageUrl && (
          <div className="mb-10 relative aspect-[16/9] overflow-hidden rounded-2xl">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {post.body && (
          <div className="relative">
            <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
              <div className="min-w-0">
                <PortableTextRenderer content={post.body} />
              </div>
              <aside className="hidden lg:block">
                <TableOfContents content={post.body} />
              </aside>
            </div>
          </div>
        )}

        {post.author && <AuthorCard author={post.author} variant="full" />}
      </article>

      {relatedPosts && relatedPosts.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl">
          <h2 className="mb-6 font-serif text-2xl text-ink-900">Related Posts</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <BlogCard key={related._id} post={related} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const { data: post } = await sanityFetch<Post>({
    query: POST_BY_SLUG_QUERY,
    params: { slug },
  })

  if (!post) notFound()

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-estate-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
        <Suspense fallback={<div className="animate-pulse h-96 bg-stone-200 rounded-xl" />}>
          <PostContent slug={slug} />
        </Suspense>
      </div>
    </main>
  )
}