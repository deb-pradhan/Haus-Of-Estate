'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Link2, Check, Mail } from 'lucide-react'
import { useLeadModals } from '@/components/lead-modal'
import { BlogCard } from './BlogCard'
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

const SITE = 'https://hausofestate.com'

export function BlogSidebar({ title, slug, tags, related }: BlogSidebarProps) {
  const { openAccount } = useLeadModals()
  const [copied, setCopied] = useState(false)
  const url = `${SITE}/blog/${slug}`
  const enc = encodeURIComponent(url)
  const encTitle = encodeURIComponent(title)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const shares = [
    {
      name: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
        </svg>
      ),
    },
    {
      name: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="space-y-8 lg:sticky lg:top-24">
      {/* Share */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h3 className="font-serif text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
          Share this article
        </h3>
        <div className="mt-4 flex gap-2">
          {shares.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              title={s.name}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-slate-700 transition-colors hover:border-estate-700 hover:bg-estate-700 hover:text-white"
            >
              {s.icon}
            </a>
          ))}
          <button
            type="button"
            onClick={copy}
            aria-label="Copy link"
            title="Copy link"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-slate-700 transition-colors hover:border-estate-700 hover:bg-estate-700 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>
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
