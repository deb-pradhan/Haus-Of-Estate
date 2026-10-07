import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, Briefcase, MapPin } from 'lucide-react'
import { CAREERS_PUBLIC_ENABLED } from '@/lib/careers-availability'
import { getCareersInbox, isCareersIntakeEnabled } from '@/lib/careers-settings'
import { resolveCareerRoles, type CareerRole } from '@/lib/career-roles'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'
import { sanityFetch } from '@/sanity/live'
import { ROLES_QUERY } from '@/sanity/queries'

export const metadata: Metadata = CAREERS_PUBLIC_ENABLED ? {
  title: 'Careers',
  description: 'Explore current opportunities at Haus of Estate in lettings, sales and career experience.',
  alternates: { canonical: '/careers' },
  openGraph: {
    title: 'Careers — Haus of Estate',
    description: 'Explore current opportunities at Haus of Estate.',
    url: '/careers',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
} : {
  title: 'Page unavailable',
  robots: { index: false, follow: false },
}

export const revalidate = 60

export default async function CareersPage() {
  if (!CAREERS_PUBLIC_ENABLED) notFound()

  const [{ data }, { isEnabled: draftPreview }] = await Promise.all([
    sanityFetch<CareerRole[]>({ query: ROLES_QUERY }),
    draftMode(),
  ])
  // A successful public CMS read can use the supplied title-only openings;
  // an outage must not override explicit editorial closures.
  const roles = data === null ? null : draftPreview ? data : resolveCareerRoles(data)
  const groups = new Map<string, CareerRole[]>()
  for (const role of roles ?? []) {
    const group = role.department || 'Current opportunities'
    groups.set(group, [...(groups.get(group) ?? []), role])
  }
  const intakeEnabled = isCareersIntakeEnabled() && !draftPreview
  const inbox = getCareersInbox()

  return (
    <div className="min-h-screen">
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">Careers</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-white md:text-6xl">
            Find your next opportunity <span className="text-gold-400">with Haus of Estate.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Explore our lettings, sales and career experience openings below.
          </p>
          <a href="#opportunities" className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-medium text-white transition-colors hover:bg-gold-400">
            View opportunities <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      <section id="opportunities" className="scroll-mt-24 bg-background px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">Current opportunities</h2>
          {!intakeEnabled && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Online applications are not open yet. You can explore the opportunities and check back for application updates.
            </p>
          )}
          {roles === null ? (
            <p role="status" className="mt-8 rounded-xl border border-border bg-surface p-6 text-muted-foreground">
              We cannot load current opportunities right now. Please try again later.
            </p>
          ) : roles.length === 0 ? (
            <p className="mt-8 text-muted-foreground">There are no current opportunities. Please check back for updates.</p>
          ) : (
            <div className="mt-10 space-y-12">
              {[...groups].map(([group, openings]) => (
                <section key={group}>
                  <h3 className="font-serif text-2xl font-medium text-estate-700">{group}</h3>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    {openings.map((role) => (
                      <Link key={role.slug} href={`/careers/${role.slug}`} className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-estate-700/40">
                        <h4 className="font-serif text-xl font-medium text-estate-700">{role.title}</h4>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          {role.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{role.location}</span>}
                          {role.employmentType && <span className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4" aria-hidden />{role.employmentType}</span>}
                        </div>
                        {role.summary && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{role.summary}</p>}
                        <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-estate-700">View opportunity <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          <p className="mt-12 border-t border-border pt-8 text-sm text-muted-foreground">
            Questions about an opportunity? <a href={`mailto:${inbox}`} className="text-estate-700 underline underline-offset-4">{inbox}</a>
          </p>
        </div>
      </section>
    </div>
  )
}
