import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { showcasePath } from '@/lib/showcase/access'

export default function ShowcaseNotFound() {
  return (
    <section className="sc-section px-4 md:px-6" aria-labelledby="showcase-not-found">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-8 text-center md:p-12">
        <p className="sc-eyebrow">Not in this showcase</p>
        <h1 id="showcase-not-found" className="sc-title mt-3 text-estate-700">We couldn’t find that page.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          The showcase holds Azizi Florence in Sharjah, one existing home in North London and the draft Palm Springs article. The link may be out of date, or the design you chose is not part of this collection.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={showcasePath('/properties')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-estate-600">
            <Search aria-hidden className="size-4" /> Find a home
          </Link>
          <Link href={showcasePath()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-estate-700/25 px-6 text-sm font-semibold text-estate-700 transition-colors hover:bg-estate-700/5">
            <ArrowLeft aria-hidden className="size-4" /> Showcase home
          </Link>
        </div>
      </div>
    </section>
  )
}
