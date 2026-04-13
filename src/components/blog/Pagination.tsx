import Link from 'next/link'

interface PaginationProps {
  current: number
  total: number
  baseUrl: string
}

export function Pagination({ current, total, baseUrl }: PaginationProps) {
  const totalPages = Math.ceil(total / 10)
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1">
      {current > 1 && (
        <Link
          href={`${baseUrl}?page=${current - 1}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-sm text-slate-700 transition-colors hover:bg-stone-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}
      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="flex h-10 w-10 items-center justify-center text-sm text-slate-400">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={`${baseUrl}?page=${page}`}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors ${
              page === current
                ? 'bg-estate-700 text-white'
                : 'border border-border text-slate-700 hover:bg-stone-100'
            }`}
          >
            {page}
          </Link>
        )
      )}
      {current < totalPages && (
        <Link
          href={`${baseUrl}?page=${current + 1}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-sm text-slate-700 transition-colors hover:bg-stone-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </nav>
  )
}