import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Briefcase,
  Building2,
  Check,
} from 'lucide-react'
import { getCareerRole, getCareerRoles } from '@/sanity/careers'
import { HR_INBOX } from '@/lib/careers'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'
import { PortableTextRenderer } from '@/components/blog'
import { ApplicationForm } from '@/components/careers/application-form'
import type { Metadata } from 'next'

interface RolePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: RolePageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCareerRole(slug)
  if (!data) return { title: 'Role Not Found' }
  return {
    title: `${data.title} — Careers`,
    description: data.summary,
    alternates: { canonical: `/careers/${slug}` },
    openGraph: {
      title: `${data.title} — Careers at Haus of Estate`,
      description: data.summary,
      url: `/careers/${slug}`,
      type: 'article',
      images: DEFAULT_OG_IMAGES,
    },
  }
}

export async function generateStaticParams() {
  return (await getCareerRoles()).map(({ slug }) => ({ slug }))
}

export const revalidate = 60

export default async function RolePage({ params }: RolePageProps) {
  const { slug } = await params
  const role = await getCareerRole(slug)
  if (!role) notFound()

  const applyEmail = role.applyEmail || HR_INBOX

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All open roles
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
            href="#apply"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gold-400"
          >
            Apply for this role <ArrowRight className="h-4 w-4" />
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
                Contact our team for details about this opportunity, or apply using the form.
              </p>
            )}
            {role.description ? (
              <div className="prose prose-neutral max-w-none">
                <PortableTextRenderer content={role.description as any} />
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
          <aside id="apply">
            <div className="sticky top-24 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
                Apply
              </p>
              <h3 className="mt-2 font-serif text-xl font-medium text-estate-700">
                Apply for this role
              </h3>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-muted-foreground">
                Share a few details and we&apos;ll reply within two working days.
              </p>
              <ApplicationForm
                roleSlug={role.slug}
                roleTitle={role.title}
                applyEmail={applyEmail}
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
