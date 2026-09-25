import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Wrench, Zap } from 'lucide-react'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Property Maintenance',
  description: 'Plumbing and electrical services from Haus of Estate. Discuss repairs, bathroom upgrades, wiring and installation for your property.',
  alternates: { canonical: '/maintenance' },
  openGraph: {
    title: 'Property Maintenance — Haus of Estate',
    description: 'Discuss plumbing and electrical work for your property with Haus of Estate.',
    url: '/maintenance',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

const SERVICES = [
  {
    icon: Wrench,
    title: 'Plumbing',
    body: 'Plumbing repairs, bathroom upgrades and full re-pipes. Tell us about the work your property needs.',
  },
  {
    icon: Zap,
    title: 'Electrical Wiring & Installation',
    body: 'Full or partial rewires, consumer units and lighting installation. Discuss the scope of your electrical work with our team.',
  },
]

export default function MaintenancePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-estate-700 px-4 py-20 text-white md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">Maintenance</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight md:text-6xl">Plumbing and electrical services.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            From plumbing repairs to electrical wiring and installation, speak to Haus of Estate about the work your property needs.
          </p>
          <Link href="/contact" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-gold-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gold-400">
            Discuss maintenance <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
      <section className="bg-background px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl font-medium text-estate-700">What we cover</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {SERVICES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-2xl border border-border bg-surface p-7 md:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700"><Icon className="h-6 w-6" aria-hidden /></span>
                <h3 className="mt-5 font-serif text-2xl font-medium text-estate-700">{title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
          <p className="mt-10 border-t border-border pt-8 text-sm leading-relaxed text-muted-foreground">
            Looking for painting, decorating or flooring?{' '}
            <Link href="/renovations" className="text-estate-700 underline underline-offset-4">Explore Renovations</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
