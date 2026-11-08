import Link from 'next/link'
import { ArrowDown, Mail, MessageCircle } from 'lucide-react'
import { LeadEoiForm } from '@/components/lead-eoi/lead-eoi-form'
import type { LeadLaunchContext } from '@/components/lead-eoi/types'
import { LAUNCH_SECTION_ID, launchRegisterPath, type LaunchInterest } from '@/lib/launches/registry'

export const LAUNCH_FOLLOW_UP_EMAIL = 'sales@hausofestate.com'
const WHATSAPP_HREF = 'https://wa.me/971585607033'

export function launchContextFor(launch: LaunchInterest): LeadLaunchContext {
  return {
    key: launch.key,
    title: launch.title,
    developer: launch.developer,
    community: launch.community,
    city: launch.city,
    country: launch.country,
    unitTypes: launch.reportedUnitTypes,
    bedrooms: launch.reportedBedrooms,
    qualification: launch.qualification,
  }
}

/** Short call to action under the article header, pointing at the form further down. */
export function LaunchInterestCta({ launch }: { launch: LaunchInterest }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-estate-700/15 bg-estate-700/[0.04] px-4 py-3.5">
      <p className="min-w-0 flex-1 text-sm leading-6 text-ink-900">
        <span className="font-semibold">Interested in {launch.title}?</span>{' '}
        Register your interest and the team will follow up as official information is released. No payment, no reservation.
      </p>
      <Link
        href={`#${LAUNCH_SECTION_ID}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-estate-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-estate-600"
      >
        Register your interest <ArrowDown aria-hidden className="size-4" />
      </Link>
    </div>
  )
}

/**
 * The register-interest section of a launch article.
 *
 * With intake ready it embeds the durable lead form with the launch as its
 * project attribution. Otherwise it offers the agreed sales follow-up route
 * instead of a form that could not save anything.
 */
export function LaunchInterestSection({
  launch,
  intakeReady,
  form,
}: {
  launch: LaunchInterest
  intakeReady: boolean
  /** Replaces the live form, for previews that must simulate submission. */
  form?: React.ReactNode
}) {
  const subject = encodeURIComponent(`${launch.title} – register my interest`)
  return (
    <section
      id={LAUNCH_SECTION_ID}
      aria-labelledby={`${LAUNCH_SECTION_ID}-title`}
      className="mt-14 scroll-mt-28 rounded-3xl border border-estate-700/15 bg-subtle p-5 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase text-estate-700">Register your interest</p>
      <h2 id={`${LAUNCH_SECTION_ID}-title`} className="mt-2 font-serif text-3xl font-medium leading-tight text-ink-900 md:text-4xl">
        {launch.title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
        Tell us the home type, size and timing you have in mind. A Haus of Estate consultant will follow up as official {launch.developer} information is released.
      </p>
      <p className="mt-3 max-w-2xl rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700">
        {launch.qualification}
      </p>

      <div className="mt-6">
        {form ?? (intakeReady ? (
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
            <LeadEoiForm surface="launch_article" launchInterest={launchContextFor(launch)} />
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-sm leading-6 text-slate-700">
              Online registration is not open at the moment. Email the team and quote the project name, or send a WhatsApp message, and we will register your interest by hand.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${LAUNCH_FOLLOW_UP_EMAIL}?subject=${subject}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-estate-600"
              >
                <Mail aria-hidden className="size-4" /> Email {LAUNCH_FOLLOW_UP_EMAIL}
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-estate-700/25 px-5 text-sm font-semibold text-estate-700 transition-colors hover:bg-estate-700/5"
              >
                <MessageCircle aria-hidden className="size-4" /> WhatsApp the team
              </a>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Or use the <Link href={launchRegisterPath(launch)} className="font-medium text-estate-700 underline underline-offset-4">register interest page</Link> once online enquiries reopen.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
