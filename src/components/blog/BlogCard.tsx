'use client'

import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity'
import { CategoryBadge } from './CategoryBadge'
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
}

interface BlogCardProps {
  post: Post
  variant?: 'default' | 'horizontal'
}

function getImageUrl(post: Post, width = 600, height = 400): { url: string; alt: string } {
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

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const { url: imageUrl, alt } = getImageUrl(post)

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group flex gap-6 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-lg hover:shadow-primary/5"
      >
        {imageUrl && (
          <div className="relative aspect-[4/3] w-40 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={imageUrl.replace('w=1200&h=630', 'w=400&h=300')}
              alt={alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-col justify-between">
          <div>
            {post.categories && post.categories.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {post.categories.slice(0, 2).map((cat, i) => (
                  <CategoryBadge key={cat.slug || `cat-${i}`} category={cat} size="sm" />
                ))}
              </div>
            )}
            <h3 className="font-serif text-lg leading-snug text-ink-900 line-clamp-2 group-hover:text-estate-700">
              {post.title}
            </h3>
            {post.subtitle && (
              <p className="mt-1 text-sm text-slate-700 line-clamp-2">{post.subtitle}</p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {post.author?.avatar && (
              <div className="relative h-6 w-6 overflow-hidden rounded-full">
                <Image
                  src={urlFor(post.author.avatar).width(48).height(48).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-xs text-slate-700">{post.author?.name}</span>
            <span className="text-xs text-mist-400">·</span>
            <span className="text-xs text-slate-700">
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-surface transition-all hover:shadow-xl hover:shadow-primary/5"
    >
      {imageUrl && (
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-col p-5">
        {post.categories && post.categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.categories.slice(0, 2).map((cat, i) => (
              <CategoryBadge key={cat.slug || `cat-${i}`} category={cat} />
            ))}
          </div>
        )}
        <h3 className="font-serif text-xl leading-snug text-ink-900 line-clamp-2 group-hover:text-estate-700">
          {post.title}
        </h3>
        {post.subtitle && (
          <p className="mt-2 text-sm text-slate-700 line-clamp-2">{post.subtitle}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          {post.author?.avatar && (
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image
                src={urlFor(post.author.avatar).width(64).height(64).url()}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-ink-900">{post.author?.name}</p>
            <p className="text-xs text-slate-700">
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