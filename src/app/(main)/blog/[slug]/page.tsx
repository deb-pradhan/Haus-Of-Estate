import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { ChevronRight, Clock, CalendarDays } from 'lucide-react'
import { sanityFetch, urlFor } from '@/sanity'
import { BLOG_AUTHOR_NAME, BLOG_AUTHOR_JSON_LD } from '@/lib/blog-author'
import { POST_FIELDS, RELATED_POSTS_QUERY } from '@/sanity/queries'
import {
  PortableTextRenderer,
  AuthorCard,
  BlogSidebar,
  ReadingProgress,
  ShareLinks,
} from '@/components/blog'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'
import { readingTimeFromBlocks } from '@/lib/reading-time'
import type { Post, PostSummary } from '@/sanity/types'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/json-ld'
import {
  DEFAULT_OG_IMAGES,
  ORGANIZATION_ID,
  SITE_URL,
  blogDescription,
  blogTitle,
  breadcrumbJsonLd,
  isThinPost,
} from '@/lib/seo'

// Revalidate every 60s so edits in Sanity (e.g. a replaced cover image)
// propagate to the statically-generated post pages without a full rebuild.
export const revalidate = 60

interface PostPageProps {
  params: Promise<{ slug: string }>
}

// Local SEO query: adds `_updatedAt` (real dateModified), the full featured
// image (for a 1200x630 social crop) and a word count (thin-content rule).
const POST_SEO_QUERY = `
  *[_type == "post" && slug.current == $slug && status == "published"][0] {
    title,
    subtitle,
    seo,
    publishedAt,
    _updatedAt,
    featuredImage,
    "wordCount": length(string::split(pt::text(body), " "))
  }
`

// Same as POST_BY_SLUG_QUERY plus `_updatedAt` for an honest dateModified.
const POST_PAGE_QUERY = `
  *[_type == "post" && slug.current == $slug && status == "published"][0] {
    ${POST_FIELDS},
    _updatedAt,
    body[]{
      ...,
      _type == "image" => { ..., "url": asset->url }
    }
  }
`

interface PostSeoData {
  title: string
  subtitle?: string
  seo?: { seoTitle?: string; seoDesc?: string }
  publishedAt?: string
  _updatedAt?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featuredImage?: any
  wordCount?: number
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data } = await sanityFetch<PostSeoData>({ query: POST_SEO_QUERY, params: { slug } })

  if (!data) return { title: 'Post not found', robots: { index: false, follow: false } }

  const title = blogTitle(data.seo?.seoTitle, data.title)
  const description = blogDescription(data.seo?.seoDesc, data.subtitle)
  const path = `/blog/${slug}`

  // 1200x630 crop of the cover image; fall back to the curated fallback, then the brand image.
  let imageUrl: string | undefined
  try {
    imageUrl = data.featuredImage?.asset
      ? urlFor(data.featuredImage).width(1200).height(630).fit('crop').url()
      : FALLBACK_IMAGES[slug]
  } catch {
    imageUrl = FALLBACK_IMAGES[slug]
  }
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630, alt: data.title }]
    : DEFAULT_OG_IMAGES

  return {
    // `absolute` so the root template never re-appends the brand.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    // Thin posts (see THIN_POST_WORDS) stay reachable but out of the index.
    ...(isThinPost(data.wordCount) ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: path,
      type: 'article',
      siteName: 'Haus of Estate',
      locale: 'en_GB',
      publishedTime: data.publishedAt,
      modifiedTime: data._updatedAt,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
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
  const { data: post } = await sanityFetch<Post & { _updatedAt?: string }>({
    query: POST_PAGE_QUERY,
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
  const primaryCategory = post.categories?.[0]
  const tags = (post.categories || []).map((c) => ({ title: c.title, slug: c.slug }))

  const postUrl = `${SITE_URL}/blog/${post.slug}`
  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    ...(post.subtitle ? { description: post.subtitle } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(post.publishedAt
      ? {
          datePublished: post.publishedAt,
          // Real last-edit time from Sanity; never earlier than publication.
          dateModified:
            post._updatedAt && post._updatedAt > post.publishedAt ? post._updatedAt : post.publishedAt,
        }
      : {}),
    inLanguage: 'en-GB',
    ...(primaryCategory ? { articleSection: primaryCategory.title } : {}),
    author: BLOG_AUTHOR_JSON_LD,
    publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: 'Haus of Estate', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  }
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Insights', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ])

  return (
    <>
      <ReadingProgress />
      <JsonLd data={[blogPostingJsonLd, breadcrumbs]} />

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
              <span className="font-medium text-ink-900">By {BLOG_AUTHOR_NAME}</span>
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

          {/* Mobile share (sidebar carries it on desktop) */}
          <div className="mt-6 flex items-center gap-3 border-t border-border/70 pt-5 lg:hidden">
            <span className="text-sm font-medium text-slate-700">Share</span>
            <ShareLinks title={post.title} slug={post.slug} />
          </div>
        </header>

        {/* Hero image */}
        {imageUrl && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-stone-100 md:rounded-3xl">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              preload
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-contain"
            />
          </div>
        )}

        {/* Body + sidebar */}
        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-8">
            {post.body && <PortableTextRenderer content={post.body} />}
            <div className="mt-14 border-t border-border pt-10">
              <AuthorCard variant="full" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <BlogSidebar
              title={post.title}
              slug={post.slug}
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
  const { data: post } = await sanityFetch<Post & { _updatedAt?: string }>({
    query: POST_PAGE_QUERY,
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
