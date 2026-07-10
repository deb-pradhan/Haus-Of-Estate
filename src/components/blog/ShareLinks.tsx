'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface ShareLinksProps {
  title: string
  slug: string
  /** 'row' = horizontal inline; 'grid' = wraps for the sidebar. */
  className?: string
}

const SITE = 'https://hausofestate.com'

export function ShareLinks({ title, slug, className = '' }: ShareLinksProps) {
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

  const links = [
    {
      name: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem] fill-current" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem] fill-current" aria-hidden>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
        </svg>
      ),
    },
    {
      name: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem] fill-current" aria-hidden>
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07z" />
        </svg>
      ),
    },
    {
      name: 'Share on WhatsApp',
      href: `https://wa.me/?text=${encTitle}%20${enc}`,
      icon: (
        <svg viewBox="0 0 32 32" className="h-[1.05rem] w-[1.05rem] fill-current" aria-hidden>
          <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.49 2.04 7.79L.5 31.5l7.93-2.07A15.45 15.45 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28a12.45 12.45 0 0 1-6.36-1.74l-.46-.27-4.71 1.23 1.26-4.59-.3-.47A12.5 12.5 0 1 1 16 28.5zm6.86-9.36c-.38-.19-2.22-1.1-2.57-1.22-.34-.13-.59-.19-.84.19s-.96 1.22-1.18 1.47-.43.28-.81.09c-2.2-1.1-3.65-1.97-5.1-4.46-.39-.66.39-.62 1.11-2.05.13-.25.06-.47-.03-.66s-.84-2.03-1.15-2.78c-.3-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1.01.47s-1.32 1.29-1.32 3.13 1.35 3.62 1.54 3.87c.19.25 2.66 4.06 6.45 5.69.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.78.31-.88.31-1.62.22-1.78s-.34-.25-.72-.44z" />
        </svg>
      ),
    },
  ]

  const btn =
    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-estate-700 hover:bg-estate-700 hover:text-white'

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          title={s.name}
          className={btn}
        >
          {s.icon}
        </a>
      ))}
      <button type="button" onClick={copy} aria-label="Copy link" title="Copy link" className={btn}>
        {copied ? <Check className="h-[1.05rem] w-[1.05rem]" /> : <Link2 className="h-[1.05rem] w-[1.05rem]" />}
      </button>
    </div>
  )
}
