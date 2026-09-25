import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import type { ComponentProps } from 'react'
import { CAREERS_PUBLIC_ENABLED } from '@/lib/careers-availability'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Briefcase,
  Building2,
  Check,
} from 'lucide-react'
import { sanityFetch } from '@/sanity/live'
import { ROLE_BY_SLUG_QUERY, ROLES_QUERY } from '@/sanity/queries'
import { careerRoleLabel, resolveCareerRole, resolveCareerRoles, type CareerRole } from '@/lib/career-roles'
import { getCareersInbox, isCareersIntakeEnabled } from '@/lib/careers-settings'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'
import { PortableTextRenderer } from '@/components/blog'
import { ApplicationForm } from '@/components/careers/application-form'
import type { Metadata } from 'next'

interface RolePageProps {
  params: Promise<{ slug: string }>
}

async function getVisibleCareerRole(slug: string) {
  if (!resolveCareerRole(slug)) return null
  const [{ data }, { isEnabled: draftPreview }] = await Promise.all([
    sanityFetch<{ role: CareerRole | null }>({
      // The envelope distinguishes an absent brief from a failed CMS request.
      query: `{ "role": ${ROLE_BY_SLUG_QUERY} }`,
      params: { slug },
    }),
    draftMode(),
  ])
  if (!data) throw new Error('Unable to load the current career opportunity')
  return draftPreview ? data.role : resolveCareerRole(slug, data.role)
}

export async function generateMetadata({ params }: RolePageProps): Promise<Metadata> {
  if (!CAREERS_PUBLIC_ENABLED) notFound()

  const { slug } = await params
  const data = await getVisibleCareerRole(slug)
  if (!data) notFound()
  const label = careerRoleLabel(data)
  return {
    title: `${label} — Careers`,
    description: data.summary || `Explore the ${label} opportunity at Haus of Estate.`,
    alternates: { canonical: `/careers/${slug}` },
    openGraph: {
      title: `${label} — Careers at Haus of Estate`,
      description: data.summary || `Explore the ${label} opportunity at Haus of Estate.`,
      url: `/careers/${slug}`,
      type: 'article',
      images: DEFAULT_OG_IMAGES,
    },
  }
}

export async function generateStaticParams() {
  if (!CAREERS_PUBLIC_ENABLED) return []

  const { data } = await sanityFetch<CareerRole[]>({ query: ROLES_QUERY })
  return data === null ? [] : resolveCareerRoles(data).map(({ slug }) => ({ slug }))
}

export const revalidate = 60

export default async function RolePage({ params }: RolePageProps) {
  if (!CAREERS_PUBLIC_ENABLED) notFound()

  const { slug } = await params
  const [role, { isEnabled: draftPreview }] = await Promise.all([
    getVisibleCareerRole(slug),
    draftMode(),
  ])
  if (!role) notFound()

  const applyEmail = getCareersInbox()
  const intakeEnabled = isCareersIntakeEnabled() && !draftPreview

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All opportunities
          </Link>

          <p className="mt-8 font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            {role.department || 'Careers'}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-[1.1] text-white md:text-5xl">
            {role.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
            {role.location && <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {role.location}
            </span>}
            {role.employmentType && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> {role.employmentType}
              </span>
            )}
            {role.department && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {role.department}
              </span>
            )}
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            {role.summary}
          </p>

          <a
            href="#applications"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold-400"
          >
            {intakeEnabled ? 'Apply for this role' : 'Application information'} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.4fr_1fr]">
          {/* Main content */}
          <div className="space-y-10">
            {!role.description && !role.summary && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Full role details will be added here. For questions about this opportunity, contact our team using the email below.
              </p>
            )}
            {role.description ? (
              <div className="prose prose-neutral max-w-none">
                <PortableTextRenderer content={role.description as ComponentProps<typeof PortableTextRenderer>['content']} />
              </div>
            ) : null}

            {role.responsibilities?.length ? (
              <div>
                <h2 className="font-serif text-2xl font-medium text-estate-700">
                  What you&apos;ll do
                </h2>
                <ul className="mt-4 space-y-3">
                  {role.responsibilities.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {role.requirements?.length ? (
              <div>
                <h2 className="font-serif text-2xl font-medium text-estate-700">
                  What we&apos;re looking for
                </h2>
                <ul className="mt-4 space-y-3">
                  {role.requirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-estate-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {role.niceToHave?.length ? (
              <div>
                <h2 className="font-serif text-2xl font-medium text-estate-700">
                  Nice to have
                </h2>
                <ul className="mt-4 space-y-3">
                  {role.niceToHave.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Apply card (sticky on desktop) */}
          <aside id="applications" className="scroll-mt-24">
            <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
                Applications
              </p>
              <h3 className="mt-2 font-serif text-xl font-medium text-estate-700">
                {intakeEnabled ? 'Apply for this role' : 'Online applications are not open yet'}
              </h3>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-muted-foreground">
                {intakeEnabled ? 'Share your details and CV with our recruitment team.' : 'Please check back for application updates.'}
              </p>
              {intakeEnabled ? <ApplicationForm
                roleSlug={role.slug}
                roleTitle={role.title}
                applyEmail={applyEmail}
              /> : <p className="text-sm leading-relaxed text-muted-foreground">
                Questions about this role?{' '}
                <a href={`mailto:${applyEmail}`} className="break-words text-estate-700 underline underline-offset-4">{applyEmail}</a>
              </p>}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
