import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'

interface FeaturedPostProps {
  post: {
    _id: string
    title: string
    subtitle?: string
    slug: string
    featuredImage?: any
    author?: {
      name: string
      avatar?: any
      role?: string
    }
    categories?: Array<{
      title: string
      slug: string
      color?: string
    }>
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
      className="group relative block overflow-hidden rounded-3xl bg-ink-900"
    >
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1152px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-ink-900/5" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between md:p-10">
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {eyebrow}
            </span>
          )}
          <h2 className="mt-4 font-serif text-2xl font-medium leading-tight text-white md:text-4xl">
            {post.title}
          </h2>
          {post.subtitle && (
            <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/80 md:text-base">
              {post.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 md:flex-col md:items-end md:text-right">
          <div className="flex items-center gap-2.5">
            {post.author?.avatar && (
              <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/25">
                <Image
                  src={urlFor(post.author.avatar).width(72).height(72).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {post.author?.name && (
              <span className="text-sm font-medium text-white">{post.author.name}</span>
            )}
          </div>
          <p className="text-xs text-white/70">
            {date} · {readMins} min read
          </p>
        </div>
      </div>
    </Link>
  )
}
