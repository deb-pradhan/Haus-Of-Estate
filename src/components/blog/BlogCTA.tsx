'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useLeadModals } from '@/components/lead-modal'

interface BlogCTAProps {
  articleCount: number
}

export function BlogCTA({ articleCount }: BlogCTAProps) {
  const { openAccount } = useLeadModals()

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-estate-700 px-6 py-12 sm:px-10 sm:py-14 md:rounded-[2rem] md:px-14">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-trust-teal/20 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-400">
            Ready when you are
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-white md:text-[2.6rem]">
            Insight is the start. Let&apos;s find your property.
          </h2>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/70">
            Speak with a specialist for advice tailored to your goals across the UK, Dubai and
            beyond — no obligation, replied to within two hours.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openAccount}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-gold-500 hover:text-white"
            >
              Book a consultation <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/properties"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Explore properties <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 border-t border-white/15 pt-8 lg:justify-end lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          <div>
            <p className="font-serif text-4xl font-semibold text-white md:text-5xl">{articleCount}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-white/60">Articles published</p>
          </div>
          <div>
            <p className="font-serif text-4xl font-semibold text-white md:text-5xl">3</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-white/60">Continents covered</p>
          </div>
        </div>
      </div>
    </div>
  )
}
