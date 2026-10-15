import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BLOG_AUTHOR_NAME } from '@/lib/blog-author'
import { blogThumbnailPosition } from '@/lib/blog-thumbnail'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'

interface FeaturedPostProps {
  post: {
    _id: string
    title: string
    subtitle?: string
    slug: string
    featuredImage?: { url?: string; asset?: { url?: string }; alt?: string }
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
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block overflow-hidden rounded-[1.5rem] bg-ink-900 ring-1 ring-black/5 md:rounded-[2rem]"
    >
      <div className="relative aspect-video w-full">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 1216px"
            className="object-cover"
            style={{ objectPosition: blogThumbnailPosition(imageUrl) }}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-6 sm:p-9 lg:p-12">
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
              <span className="font-medium text-white">By {BLOG_AUTHOR_NAME}</span>
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
  )
}
