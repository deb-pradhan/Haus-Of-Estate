'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useLeadModals } from '@/components/lead-modal'
import { BlogCard } from './BlogCard'
import { ShareLinks } from './ShareLinks'
import type { PostSummary } from '@/sanity/types'

interface Tag {
  title: string
  slug: string
}

interface BlogSidebarProps {
  title: string
  slug: string
  tags: Tag[]
  related: PostSummary[]
}

export function BlogSidebar({ title, slug, tags, related }: BlogSidebarProps) {
  const { openAccount } = useLeadModals()

  return (
    <aside className="space-y-8 lg:sticky lg:top-24">
      {/* Share */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
          Share this article
        </h3>
        <ShareLinks title={title} slug={slug} className="mt-4" />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
            Topics
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog?category=${tag.slug}`}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-estate-700/40 hover:text-estate-700"
              >
                {tag.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
            Related articles
          </h3>
          <div className="mt-5 space-y-5">
            {related.slice(0, 3).map((post) => (
              <BlogCard key={post._id} post={post} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      <div className="rounded-2xl border border-estate-700/15 bg-estate-700/[0.04] p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-estate-700/10 text-estate-700">
          <Mail className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-serif text-xl font-medium text-ink-900">Join our newsletter</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
          Market insights, investment guides and new opportunities — straight to your inbox.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            openAccount()
          }}
          className="mt-4 space-y-2.5"
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            aria-label="Your email address"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-slate-400 focus:border-estate-700 focus:ring-2 focus:ring-estate-700/10"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-estate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-estate-700/90"
          >
            Subscribe
          </button>
        </form>
      </div>
    </aside>
  )
}
