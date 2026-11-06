'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'

const LINKS = [
  { href: showcasePath(), label: 'Overview', exact: true },
  { href: showcasePropertyPath('azizi-florence'), label: 'Florence, Sharjah' },
  { href: showcasePropertyPath('north-london-three-bedroom-property'), label: 'North London' },
]

export function ShowcaseNavLinks() {
  const pathname = usePathname()
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)
  const searchHref = showcasePath('/properties')
  const searchActive = pathname === searchHref

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <nav aria-label="Showcase" className="hidden items-center gap-1 md:flex">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
            className={cn('inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-estate-700/80 transition-colors hover:bg-estate-700/5 hover:text-estate-700',
              isActive(link.href, link.exact) && 'bg-estate-700/8 text-estate-700')}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link href={searchHref} aria-label="Find a home" aria-current={searchActive ? 'page' : undefined}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-estate-700 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-estate-600 sm:px-4">
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="hidden whitespace-nowrap sm:inline">Find a home</span>
      </Link>
      <details className="relative md:hidden">
        <summary aria-label="Open showcase menu" className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-xl border border-estate-700/20 px-3 text-sm font-medium text-estate-700">
          Menu <ChevronDown aria-hidden className="sc-chevron size-4 transition-transform" />
        </summary>
        <nav aria-label="Showcase" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-xl">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
              className={cn('flex min-h-12 items-center rounded-xl px-3 text-sm font-medium text-estate-700 hover:bg-estate-700/5',
                isActive(link.href, link.exact) && 'bg-estate-700/8')}>
              {link.label}
            </Link>
          ))}
        </nav>
      </details>
    </div>
  )
}
