import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity'
import { CategoryBadge } from './CategoryBadge'
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
  }
}

function getImageUrl(post: FeaturedPostProps['post']): { url: string; alt: string } {
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

export function FeaturedPost({ post }: FeaturedPostProps) {
  const { url: imageUrl, alt } = getImageUrl(post)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface"
    >
      {imageUrl && (
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-transparent" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="flex flex-wrap gap-2">
          {post.categories?.slice(0, 2).map((cat, i) => (
            <CategoryBadge key={cat.slug || `cat-${i}`} category={cat} />
          ))}
        </div>
        <h2 className="mt-4 font-serif text-2xl md:text-4xl font-medium leading-tight text-white">
          {post.title}
        </h2>
        {post.subtitle && (
          <p className="mt-2 hidden text-sm text-white/80 md:block md:text-base md:max-w-2xl line-clamp-2">
            {post.subtitle}
          </p>
        )}
        <div className="mt-6 flex items-center gap-3">
          {post.author?.avatar && (
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/20">
              <Image
                src={urlFor(post.author.avatar).width(80).height(80).url()}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{post.author?.name}</p>
            <p className="text-xs text-white/70">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}