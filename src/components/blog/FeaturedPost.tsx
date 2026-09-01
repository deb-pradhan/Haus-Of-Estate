import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { urlFor } from '@/sanity'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'
import { SaveContentButton } from '@/components/saved-content'

type SanityImage = {
  alt?: string
  url?: string
  asset?: { url?: string }
} & Record<string, unknown>

interface FeaturedPostProps {
  post: {
    _id: string
    title: string
    subtitle?: string
    slug: string
    featuredImage?: SanityImage
    author?: { name: string; avatar?: SanityImage; role?: string }
    categories?: Array<{ title: string; slug: string; color?: string }>
    publishedAt: string
    readMins?: number
  }
}

function getImageUrl(post: FeaturedPostProps['post']): { url: string; alt: string } {
  if (post.featuredImage) {
    const sanityUrl = post.featuredImage?.url || post.featuredImage?.asset?.url
    if (sanityUrl) return { url: sanityUrl, alt: post.featuredImage.alt || post.title }
  }
  const fallbackUrl = FALLBACK_IMAGES[post.slug]
  if (fallbackUrl) return { url: fallbackUrl, alt: FALLBACK_ALTS[post.slug] || post.title }
  return { url: '', alt: post.title }
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  const { url: imageUrl, alt } = getImageUrl(post)
  const eyebrow = post.categories?.[0]?.title
  const readMins = Math.max(1, post.readMins || 1)
  const date = new Date(post.publishedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] bg-ink-900 ring-1 ring-black/5 md:rounded-[2rem]">
      <Link
        href={`/blog/${post.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-inset"
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[21/9]">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1216px"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-12">
          <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-400">
                Featured
              </span>
              {eyebrow && (
                <>
                  <span className="h-3 w-px bg-white/30" />
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {eyebrow}
                  </span>
                </>
              )}
            </div>

            <h2 className="mt-4 font-serif text-[1.9rem] font-medium leading-[1.08] text-white sm:text-4xl lg:text-[3.15rem] lg:leading-[1.03]">
              {post.title}
            </h2>

            {post.subtitle && (
              <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {post.subtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/75">
              {post.author?.avatar && (
                <span className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white/25">
                  <Image
                    src={urlFor(post.author.avatar).width(64).height(64).url()}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </span>
              )}
              {post.author?.name && <span className="font-medium text-white">{post.author.name}</span>}
              <span className="text-white/40">·</span>
              <span>{date}</span>
              <span className="text-white/40">·</span>
              <span>{readMins} min read</span>
            </div>
          </div>

          {/* Read affordance */}
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-ink-900 transition-all duration-300 group-hover:bg-gold-400 lg:flex">
            <ArrowUpRight className="h-6 w-6 transition-transform duration-300 group-hover:rotate-45" />
          </span>
          </div>
        </div>
      </Link>
      <SaveContentButton
        contentType="ARTICLE"
        sanityDocumentId={post._id}
        title={post.title}
        className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6"
      />
    </article>
  )
}
