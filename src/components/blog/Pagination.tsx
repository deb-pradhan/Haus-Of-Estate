import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  current: number
  total: number
  baseUrl: string
  /** Extra query params to preserve across pages (category, q, sort). */
  params?: Record<string, string | undefined>
}

export function Pagination({ current, total, baseUrl, params = {} }: PaginationProps) {
  const totalPages = Math.ceil(total / 10)
  if (totalPages <= 1) return null

  const href = (page: number) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
    if (page > 1) qs.set('page', String(page))
    const s = qs.toString()
    return s ? `${baseUrl}?${s}` : baseUrl
  }

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const arrow =
    'flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-slate-700 transition-colors hover:border-estate-700/40 hover:text-estate-700'

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {current > 1 && (
        <Link href={href(current - 1)} className={arrow} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="flex h-10 w-10 items-center justify-center text-sm text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page)}
            aria-current={page === current ? 'page' : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              page === current
                ? 'bg-estate-700 text-white'
                : 'border border-border bg-surface text-slate-700 hover:border-estate-700/40 hover:text-estate-700'
            }`}
          >
            {page}
          </Link>
        )
      )}
      {current < totalPages && (
        <Link href={href(current + 1)} className={arrow} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  )
}
