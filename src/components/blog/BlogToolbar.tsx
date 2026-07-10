'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown } from 'lucide-react'

interface Category {
  _id: string
  title: string
  slug: string
}

interface BlogToolbarProps {
  categories: Category[]
}

export function BlogToolbar({ categories }: BlogToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const activeCategory = params.get('category') || ''
  const activeSort = params.get('sort') || 'newest'
  const [term, setTerm] = useState(params.get('q') || '')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build a new URL from a set of param overrides (page always resets).
  const buildUrl = useCallback(
    (overrides: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      next.delete('page')
      for (const [key, value] of Object.entries(overrides)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      const qs = next.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [params, pathname]
  )

  const push = useCallback(
    (overrides: Record<string, string | null>) => {
      router.push(buildUrl(overrides), { scroll: false })
    },
    [router, buildUrl]
  )

  // Debounced search-as-you-type.
  useEffect(() => {
    if (term === (params.get('q') || '')) return
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => push({ q: term.trim() || null }), 350)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  const tabs = [{ title: 'All', slug: '' }, ...categories.map((c) => ({ title: c.title, slug: c.slug }))]

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search articles…"
          aria-label="Search articles"
          className="w-full rounded-full border border-border bg-surface py-3.5 pl-12 pr-4 text-[0.95rem] text-ink-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-estate-700 focus:ring-4 focus:ring-estate-700/10"
        />
      </div>

      {/* Category tabs + sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.slug
            return (
              <button
                key={tab.slug || 'all'}
                type="button"
                onClick={() => push({ category: tab.slug || null })}
                aria-pressed={isActive}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-estate-700 bg-estate-700 text-white'
                    : 'border-border bg-surface text-slate-700 hover:border-estate-700/40 hover:text-estate-700'
                }`}
              >
                {tab.title}
              </button>
            )
          })}
        </div>

        <div className="relative hidden shrink-0 sm:block">
          <select
            value={activeSort}
            onChange={(e) => push({ sort: e.target.value === 'newest' ? null : e.target.value })}
            aria-label="Sort articles"
            className="cursor-pointer appearance-none rounded-full border border-border bg-surface py-2 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:text-estate-700 focus:border-estate-700"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </div>
  )
}
