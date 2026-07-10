'use client'

import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'

interface Post {
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

interface BlogCardProps {
  post: Post
  variant?: 'default' | 'compact'
}

function getImageUrl(post: Post): { url: string; alt: string } {
  if (post.featuredImage) {
    const sanityUrl = post.featuredImage?.url || post.featuredImage?.asset?.url
    if (sanityUrl) return { url: sanityUrl, alt: post.featuredImage.alt || post.title }
  }
  const fallbackUrl = FALLBACK_IMAGES[post.slug]
  if (fallbackUrl) return { url: fallbackUrl, alt: FALLBACK_ALTS[post.slug] || post.title }
  return { url: '', alt: post.title }
}

function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(
    'en-GB',
    opts || { day: 'numeric', month: 'short', year: 'numeric' }
  )
}

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const { url: imageUrl, alt } = getImageUrl(post)
  const eyebrow = post.categories?.[0]?.title
  const readMins = Math.max(1, post.readMins || 1)

  // ── Compact row (sidebar "Related") ──────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3">
        {imageUrl && (
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
            <Image src={imageUrl} alt={alt} fill sizes="56px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-slate-700">{formatDate(post.publishedAt)}</p>
          <h4 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-ink-900 transition-colors group-hover:text-estate-700">
            {post.title}
          </h4>
        </div>
      </Link>
    )
  }

  // ── Default card (Horizone-style grid) ───────────────────────────────
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-ink-900/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {eyebrow && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-900 backdrop-blur-sm">
            {eyebrow}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-2 text-xs text-slate-700">
          <span>{formatDate(post.publishedAt)}</span>
          <span className="h-1 w-1 rounded-full bg-mist-400" />
          <span>{readMins} min read</span>
        </p>
        <h3 className="mt-3 font-serif text-xl font-medium leading-snug text-ink-900 transition-colors group-hover:text-estate-700 line-clamp-2">
          {post.title}
        </h3>
        {post.subtitle && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-700">{post.subtitle}</p>
        )}
        <div className="mt-5 flex items-center gap-2.5 border-t border-border/60 pt-4">
          {post.author?.avatar && (
            <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/5">
              <Image
                src={urlFor(post.author.avatar).width(56).height(56).url()}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          {post.author?.name && (
            <span className="text-sm font-medium text-ink-900">{post.author.name}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
