import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { ChevronRight, Clock, CalendarDays } from 'lucide-react'
import { urlFor } from '@/sanity'
import { sanityFetch } from '@/sanity/live'
import { POST_BY_SLUG_QUERY, RELATED_POSTS_QUERY, SEO_QUERY } from '@/sanity/queries'
import {
  PortableTextRenderer,
  AuthorCard,
  BlogSidebar,
  ReadingProgress,
} from '@/components/blog'
import { ContentShare } from '@/components/share/content-share'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'
import { readingTimeFromBlocks } from '@/lib/reading-time'
import type { Post, PostSummary } from '@/sanity/types'
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'
import { HAUS_SITE_ORIGIN, canonicalHausUrl } from '@/lib/share'

// Revalidate every 60s so edits in Sanity (e.g. a replaced cover image)
// propagate to the statically-generated post pages without a full rebuild.
export const revalidate = 60

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data } = await sanityFetch<{ title: string; subtitle?: string; publishedAt?: string; image?: string; seo?: { seoTitle?: string; seoDesc?: string } }>({ query: SEO_QUERY, params: { slug } })

  if (!data) return { title: 'Post Not Found' }

  const title = data.seo?.seoTitle || data.title
  const description = data.seo?.seoDesc || data.subtitle || ''
  const images = [data.image || DEFAULT_OG_IMAGE]

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${slug}`,
      type: 'article',
      publishedTime: data.publishedAt,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
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
    if (sanityUrl) return { url: sanityUrl, alt: post.featuredImage.alt || post.title }
  }
  const fallbackUrl = FALLBACK_IMAGES[post.slug]
  if (fallbackUrl) return { url: fallbackUrl, alt: FALLBACK_ALTS[post.slug] || post.title }
  return { url: '', alt: post.title }
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function PostContent({ slug }: { slug: string }) {
  const { data: post } = await sanityFetch<Post>({
    query: POST_BY_SLUG_QUERY,
    params: { slug },
  })

  if (!post) return null

  const categoryIds = post.categories?.map((c) => c._id).filter(Boolean) || []
  const { data: relatedPosts } = await sanityFetch<PostSummary[]>({
    query: RELATED_POSTS_QUERY,
    params: { postId: post._id, categoryIds },
  })

  const { url: imageUrl, alt } = getPostImageUrl(post)
  const readMins = readingTimeFromBlocks(post.body)
  const authorName = post.author?.name || 'Haus of Estate'
  const primaryCategory = post.categories?.[0]
  const tags = (post.categories || []).map((c) => ({ title: c.title, slug: c.slug }))
  const canonicalUrl = canonicalHausUrl(`/blog/${post.slug}`)
  const shareText = post.subtitle || `Read ${post.title} on Haus of Estate`

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    ...(post.subtitle ? { description: post.subtitle } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(post.publishedAt
      ? { datePublished: post.publishedAt, dateModified: post.publishedAt }
      : {}),
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: 'Haus of Estate',
      url: HAUS_SITE_ORIGIN,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${HAUS_SITE_ORIGIN}/blog/${post.slug}`,
    },
  }

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-700">
          <Link href="/" className="transition-colors hover:text-estate-700">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 text-mist-400" />
          <Link href="/blog" className="transition-colors hover:text-estate-700">Insights</Link>
          {primaryCategory && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-mist-400" />
              <Link
                href={`/blog?category=${primaryCategory.slug}`}
                className="transition-colors hover:text-estate-700"
              >
                {primaryCategory.title}
              </Link>
            </>
          )}
        </nav>

        {/* Title + meta */}
        <header className="mt-6 max-w-3xl">
          <h1 className="font-serif text-[2.25rem] font-medium leading-[1.1] text-ink-900 md:text-[3rem] md:leading-[1.05]">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-slate-700 md:text-xl">{post.subtitle}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-700">
            <span className="flex items-center gap-2">
              {post.author?.avatar && (
                <span className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-black/5">
                  <Image
                    src={urlFor(post.author.avatar).width(64).height(64).url()}
                    alt={authorName}
                    fill
                    className="object-cover"
                  />
                </span>
              )}
              <span className="font-medium text-ink-900">{authorName}</span>
            </span>
            {primaryCategory && (
              <Link
                href={`/blog?category=${primaryCategory.slug}`}
                className="rounded-full bg-estate-700/8 px-3 py-1 text-xs font-semibold text-estate-700 transition-colors hover:bg-estate-700/15"
              >
                {primaryCategory.title}
              </Link>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-mist-400" />
              {readMins} min read
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-mist-400" />
              {formatDate(post.publishedAt)}
            </span>
          </div>

          {/* Compact share action below desktop-rail breakpoint. */}
          <div className="mt-6 border-t border-border/70 pt-5 xl:hidden">
            <ContentShare
              url={canonicalUrl}
              title={post.title}
              text={shareText}
              contentLabel="this article"
            />
          </div>
        </header>

        {/* Hero image */}
        {imageUrl && (
          <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100 sm:aspect-[16/9] md:rounded-3xl">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
          </div>
        )}

        {/* Body + sidebar */}
        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16 xl:grid-cols-[3rem_minmax(0,1fr)_20rem] xl:gap-8">
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <p className="mb-2 text-center text-[10px] font-semibold uppercase text-muted-foreground">
                Share
              </p>
              <ContentShare
                url={canonicalUrl}
                title={post.title}
                text={shareText}
                contentLabel="this article"
                variant="rail"
              />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-8 xl:col-auto">
            {post.body && <PortableTextRenderer content={post.body} />}
            {post.author && (
              <div className="mt-14 border-t border-border pt-10">
                <AuthorCard author={post.author} variant="full" />
              </div>
            )}
          </div>
          <div className="lg:col-span-4 xl:col-auto">
            <BlogSidebar
              tags={tags}
              related={relatedPosts || []}
            />
          </div>
        </div>
      </div>
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
    <main className="min-h-screen bg-canvas pb-24 pt-10 md:pt-14">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-5">
            <div className="h-10 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="mt-8 h-72 animate-pulse rounded-3xl bg-stone-200" />
          </div>
        }
      >
        <PostContent slug={slug} />
      </Suspense>
    </main>
  )
}
