import Image from 'next/image'
import Link from 'next/link'
import { showcasePath } from '@/lib/showcase/access'
import { ShowcaseNavLinks } from './showcase-nav-links'

export function ShowcaseHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-estate-700/10 bg-[#f7f5f1]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:h-[72px] md:px-6">
        <Link href={showcasePath()} aria-label="Haus of Estate design showcase home" className="flex min-h-11 shrink-0 items-center gap-3 rounded-md">
          <Image src="/logo.svg" alt="Haus of Estate" width={140} height={36} className="h-7 w-auto md:h-8" priority />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-estate-700/60 lg:inline">Design showcase</span>
        </Link>
        <ShowcaseNavLinks />
      </div>
    </header>
  )
}
