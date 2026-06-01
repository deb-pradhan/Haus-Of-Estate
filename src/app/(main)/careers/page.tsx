import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Heart,
  Compass,
  ShieldCheck,
  Users,
  GraduationCap,
  CalendarClock,
} from 'lucide-react'
import { sanityFetch } from '@/sanity'
import { ROLES_QUERY } from '@/sanity/queries'
import { ApplicationForm } from '@/components/careers/application-form'
import { HR_INBOX } from '@/lib/careers'
import { LifeAtHoE } from '@/components/careers/life-at-hoe'

interface RoleCard {
  _id: string
  title: string
  slug: string
  department?: string
  location: string
  employmentType?: string
  summary: string
  featured?: boolean
  publishedAt?: string
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust is the product.',
    body: 'We hire people who would rather be honest than be the loudest in the room. Every enquiry, every brief, every introduction — handled with care.',
  },
  {
    icon: Compass,
    title: 'Calm under pressure.',
    body: 'Property is a life-level decision for our clients. We move at the speed of clarity, not the speed of urgency — measured, precise, never panicked.',
  },
  {
    icon: Heart,
    title: 'Caregiver first, salesperson never.',
    body: "We don't chase commission. We protect clients from costly mistakes and route them to the right vetted agent, even when it isn't us closing the deal.",
  },
  {
    icon: Users,
    title: 'One team, three continents.',
    body: 'Cardiff, London, Manchester, Birmingham, Dubai, Sharjah, Abu Dhabi, Bali — different time zones, same standard. Async by default, available when it matters.',
  },
]

const SUB_NAV = [
  { href: '#jobs', label: 'Jobs' },
  { href: '#life-at-hoe', label: 'Life at HoE' },
]

export const metadata: Metadata = {
  title: 'Careers | Haus of Estate',
  description:
    'Join Haus of Estate — part-time and full-time jobs across the UK, UAE and beyond.',
  openGraph: {
    title: 'Careers | Haus of Estate',
    description:
      'Part-time and full-time jobs at Haus of Estate.',
    type: 'website',
  },
}

export const revalidate = 60

export default async function CareersPage() {
  const { data: roles } = await sanityFetch<RoleCard[]>({ query: ROLES_QUERY })
  const openRoles = roles ?? []

  const byDept = new Map<string, RoleCard[]>()
  for (const r of openRoles) {
    const dept = r.department || 'Other'
    if (!byDept.has(dept)) byDept.set(dept, [])
    byDept.get(dept)!.push(r)
  }
  const departments = [...byDept.entries()]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            Careers
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-6xl md:leading-[1.04]">
            Build a property service{' '}
            <span className="text-gold-400">people can trust.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Jobs with a small, deliberate team
            building the international property service we wished existed.
            Browse open roles below.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#jobs"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold-400"
            >
              See open jobs <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Sticky sub-nav */}
      <nav
        aria-label="Careers sections"
        className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 md:px-6">
          {SUB_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-3 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-estate-700"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Why work here */}
      <section className="bg-background px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
              Why us
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              The standard we hold ourselves to.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-6"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-estate-700/8 text-estate-700">
                  <v.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-medium text-estate-700">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {v.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs — part-time & full-time */}
      <section id="jobs" className="scroll-mt-32 bg-subtle px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
              Jobs
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              Part-time &amp; full-time jobs
            </h2>
          </div>

          {departments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <h3 className="font-serif text-xl font-medium text-estate-700">
                No live jobs at this moment.
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Check back soon — we publish new roles here as they open.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {departments.map(([dept, list]) => (
                <div key={dept}>
                  <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {dept}
                  </h3>
                  <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
                    {list.map((role, i) => (
                      <li
                        key={role._id}
                        className={i > 0 ? 'border-t border-border' : ''}
                      >
                        <Link
                          href={`/careers/${role.slug}`}
                          className="group grid items-center gap-4 px-6 py-5 transition-colors hover:bg-estate-700/[0.04] md:grid-cols-[1fr_auto_auto] md:gap-8"
                        >
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-serif text-lg font-medium text-estate-700">
                              {role.title}
                              {role.featured && (
                                <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold-600">
                                  Featured
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {role.summary}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground md:justify-end">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" /> {role.location}
                            </span>
                            {role.employmentType && (
                              <span className="inline-flex items-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5" />{' '}
                                {role.employmentType}
                              </span>
                            )}
                          </div>
                          <span
                            aria-hidden
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-estate-700 transition-all duration-200 group-hover:border-estate-700 group-hover:bg-estate-700 group-hover:text-white"
                          >
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <LifeAtHoE />
    </div>
  )
}
