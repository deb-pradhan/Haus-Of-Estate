'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { urlFor } from '@/sanity'
import { FALLBACK_IMAGES, FALLBACK_ALTS } from '@/sanity/fallbackImages'

interface Post {
  _id: string
  title: string
  subtitle?: string
  slug: string
  featuredImage?: any
  author?: { name: string; avatar?: any; role?: string }
  categories?: Array<{ title: string; slug: string; color?: string }>
  publishedAt: string
  readMins?: number
}

interface BlogCardProps {
  post: Post
  variant?: 'default' | 'compact'
  index?: number
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function BlogCard({ post, variant = 'default', index = 0 }: BlogCardProps) {
  const { url: imageUrl, alt } = getImageUrl(post)
  const eyebrow = post.categories?.[0]?.title
  const readMins = Math.max(1, post.readMins || 1)

  // ── Compact row (sidebar "Related") ──────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3">
        {imageUrl && (
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
            <Image src={imageUrl} alt={alt} fill sizes="56px" className="object-contain" />
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

  // ── Default card ─────────────────────────────────────────────────────
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms`, animationFillMode: 'both' }}
      className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_20px_50px_-20px_rgba(30,31,33,0.28)] motion-reduce:animate-none"
    >
      {eyebrow && (
        <div className="flex min-h-16 items-center px-6 py-3">
          <span className="text-xs font-semibold text-ink-900">{eyebrow}</span>
        </div>
      )}
      <div className="relative aspect-video overflow-hidden bg-stone-100">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-contain"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <span>{formatDate(post.publishedAt)}</span>
          <span className="h-1 w-1 rounded-full bg-mist-400" />
          <span>{readMins} min read</span>
        </p>

        <h3 className="mt-3 font-serif text-[1.35rem] font-medium leading-snug text-ink-900 transition-colors duration-200 group-hover:text-estate-700 line-clamp-2">
          {post.title}
        </h3>

        {post.subtitle && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-700">{post.subtitle}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
          <span className="flex items-center gap-2.5">
            {post.author?.avatar && (
              <span className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/5">
                <Image
                  src={urlFor(post.author.avatar).width(56).height(56).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </span>
            )}
            {post.author?.name && (
              <span className="text-sm font-medium text-ink-900">{post.author.name}</span>
            )}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-estate-700 transition-all duration-300 group-hover:bg-estate-700 group-hover:text-white">
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
