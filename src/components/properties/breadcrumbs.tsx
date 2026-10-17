import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type Category,
  type Availability,
  type Intent,
  buildBreadcrumbs,
} from '@/lib/property-taxonomy'

/**
 * Breadcrumb strip: Home / Properties / Residential / Ready / To buy / Apartment.
 * Every segment links to the progressively-widened URL; the last is current.
 */
export function Breadcrumbs({
  category,
  availability,
  intent,
  type,
  className,
}: {
  category?: Category
  availability?: Availability
  intent?: Intent
  type?: string
  className?: string
}) {
  const crumbs = [
    { label: 'Home', href: '/' },
    ...buildBreadcrumbs({ category, availability, intent, type }),
  ]

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className={cn('py-3 font-medium text-estate-900')}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="rounded py-3 transition-colors hover:text-estate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700/60"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
