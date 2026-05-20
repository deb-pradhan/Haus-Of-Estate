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
} from 'lucide-react'
import { sanityFetch } from '@/sanity'
import { ROLES_QUERY } from '@/sanity/queries'

const COMPANY_EMAIL = 'info@hausofestate.com'

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
    body: "Property is a life-level decision for our clients. We move at the speed of clarity, not the speed of urgency — measured, precise, never panicked.",
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

export const metadata: Metadata = {
  title: 'Careers | Haus of Estate',
  description:
    'Join Haus of Estate — open roles in advisory, lettings, operations and technology across the UK, UAE and beyond.',
  openGraph: {
    title: 'Careers | Haus of Estate',
    description:
      'Join Haus of Estate — open roles in advisory, lettings, operations and technology across the UK, UAE and beyond.',
    type: 'website',
  },
}

export const revalidate = 60

export default async function CareersPage() {
  const { data: roles } = await sanityFetch<RoleCard[]>({ query: ROLES_QUERY })
  const openRoles = roles ?? []

  // Group by department (preserve order: featured first, then publishedAt desc)
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
            We&apos;re a small, deliberate team building the international
            property service we wished existed. If you care about doing right by
            people over chasing the next listing, we&apos;d like to meet you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#open-roles"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold-400"
            >
              See open roles <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(
                'Speculative application — Careers at Haus of Estate',
              )}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              Send a speculative CV
            </a>
          </div>
        </div>
      </section>

      {/* Why work here */}
      <section className="bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
              Why us
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
              The standard we hold ourselves to.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Property attracts a lot of noise. Our team is built around four
              quiet convictions — they shape how we hire, how we work, and how
              clients eventually describe us.
            </p>
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

      {/* Open roles */}
      <section id="open-roles" className="bg-subtle px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
                Open roles
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium text-estate-700 md:text-4xl">
                {openRoles.length > 0
                  ? `${openRoles.length} role${openRoles.length === 1 ? '' : 's'} live now.`
                  : 'No live roles right now.'}
              </h2>
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">
              Applications go to{' '}
              <a
                href={`mailto:${COMPANY_EMAIL}`}
                className="text-estate-700 underline-offset-4 hover:underline"
              >
                {COMPANY_EMAIL}
              </a>
            </p>
          </div>

          {departments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <h3 className="font-serif text-xl font-medium text-estate-700">
                We&apos;re not actively hiring at the moment.
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                We still read every speculative application. If you think you
                belong here, tell us why — we keep a longlist for when the right
                seat opens.
              </p>
              <a
                href={`mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(
                  'Speculative application — Careers at Haus of Estate',
                )}`}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
              >
                Send a speculative CV
                <ArrowRight className="h-4 w-4" />
              </a>
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
    </div>
  )
}
