'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react'
import {
  MARKETING_CONSENT_WORDING,
  PRIVACY_ACKNOWLEDGEMENT_WORDING,
  PROPERTY_MATCH_CONSENT_WORDING,
} from '@/lib/lead-intake/contract'
import { showcasePropertyPath } from '@/lib/showcase/access'
import {
  buildSimulatedBrochureRequest,
  type SimulatedBrochureErrors,
  type SimulatedBrochureResult,
} from '@/lib/showcase/request'
import { cn } from '@/lib/utils'

export interface RequestDesign {
  id: string
  label: string
  family?: string
  rowHomes?: number
  position?: 'corner' | 'middle' | 'standalone'
  brochureKey: string
  builtUpAreaSqFt: number
  plotAreaSqFt?: number
  plotAreaStatus: 'brochure' | 'conflict'
  /** Withheld-plot or brochure-area explanation carried from the fixture. */
  areaNote?: string
  image: { src: string; alt: string; label?: string }
}

export interface RequestProject {
  slug: string
  title: string
  label: string
  community: string
  city: string
  country: string
  communityTitle?: string
  communityHref?: string
}

interface FormValues {
  firstName: string
  email: string
  phone: string
  message: string
  privacyAcknowledged: boolean
  propertyMatchOptIn: boolean
  newsletterOptIn: boolean
}

const EMPTY: FormValues = {
  firstName: '', email: '', phone: '', message: '',
  privacyAcknowledged: false, propertyMatchOptIn: false, newsletterOptIn: false,
}

const areaFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const inputClass = 'mt-1.5 min-h-12 w-full rounded-xl border bg-white px-3.5 text-base text-estate-700 shadow-sm sm:text-sm'
const subscribeToNothing = () => () => {}

function plotNote(design: RequestDesign): string {
  const withheld = design.plotAreaStatus === 'conflict' || design.plotAreaSqFt === undefined
  if (withheld) return design.areaNote ?? 'Plot area is withheld while the brochure table and diagram are reconciled.'
  return design.areaNote ?? 'Plot area is the brochure figure for this design, separate from built-up area.'
}

function DesignSummary({ design, areaLabel, areaSourceLabel, compact = false }: {
  design: RequestDesign
  areaLabel: string
  areaSourceLabel?: string
  compact?: boolean
}) {
  const meta = [design.rowHomes ? `${design.rowHomes}-home row` : undefined, design.position === 'standalone' ? 'Standalone villa' : design.position ? `${design.position === 'corner' ? 'Corner' : 'Middle'} home` : undefined].filter(Boolean).join(' · ')
  const withheld = design.plotAreaStatus === 'conflict' || design.plotAreaSqFt === undefined
  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-[96px_minmax(0,1fr)] items-start' : 'sm:grid-cols-[180px_minmax(0,1fr)]')}>
      <figure>
        <div className={cn('relative overflow-hidden rounded-xl bg-estate-700/5', compact ? 'aspect-[4/3]' : 'aspect-[5/3] sm:aspect-[4/3]')}>
          <Image src={design.image.src} alt={design.image.alt} fill unoptimized sizes={compact ? '96px' : '(min-width: 640px) 180px, 100vw'} className="object-cover" />
        </div>
        {design.image.label && <figcaption className="mt-1 text-[11px] leading-4 text-muted-foreground">{design.image.label}</figcaption>}
      </figure>
      <div className="min-w-0">
        <p className="font-serif text-xl font-medium leading-tight text-estate-700 sm:text-2xl">{design.label}</p>
        {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{areaLabel}</dt>
            <dd className="font-medium tabular-nums text-estate-700">{areaFormatter.format(design.builtUpAreaSqFt)} sq ft</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Plot area</dt>
            <dd className="font-medium tabular-nums text-estate-700">{withheld ? 'Withheld' : `${areaFormatter.format(design.plotAreaSqFt!)} sq ft`}</dd>
          </div>
        </dl>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
          {areaSourceLabel && <li>{areaSourceLabel}</li>}
          <li>{plotNote(design)}</li>
          {design.rowHomes && <li>Row views and plans show all {design.rowHomes} homes in the row, not one dwelling.</li>}
        </ul>
      </div>
    </div>
  )
}

export function BrochureRequestJourney({ project, designs, initialDesignId, areaLabel, areaSourceLabel }: {
  project: RequestProject
  designs: RequestDesign[]
  initialDesignId?: string
  areaLabel: string
  areaSourceLabel?: string
}) {
  const id = useId()
  const pathname = usePathname()
  // Before hydration (and without JavaScript) the form stays inert: no field
  // names, a disabled submit button and no submission target, so a native
  // browser submit can never put contact details into a URL.
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false)
  const [designId, setDesignId] = useState<string | null>(() => designs.some((design) => design.id === initialDesignId) ? initialDesignId! : null)
  const [choosing, setChoosing] = useState(() => !designs.some((design) => design.id === initialDesignId))
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<SimulatedBrochureErrors>({})
  const [result, setResult] = useState<Extract<SimulatedBrochureResult, { ok: true }> | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const design = designs.find((item) => item.id === designId) ?? null
  const backHref = showcasePropertyPath(project.slug, design ? `?design=${encodeURIComponent(design.id)}#selected-design` : '#designs')

  useEffect(() => {
    if (result) window.requestAnimationFrame(() => successRef.current?.focus())
  }, [result])

  function chooseDesign(nextId: string) {
    setDesignId(nextId)
    setChoosing(false)
    setResult(null)
    const url = new URL(window.location.href)
    url.searchParams.set('design', nextId)
    window.history.replaceState(window.history.state, '', url)
  }

  function update<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key as keyof SimulatedBrochureErrors]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!design) {
      setChoosing(true)
      setErrors({ form: 'Choose the design you are interested in first.' })
      return
    }
    const outcome = buildSimulatedBrochureRequest({
      project: { slug: project.slug, title: project.title },
      design: { id: design.id, label: design.label, brochureKey: design.brochureKey },
      contact: { firstName: values.firstName, email: values.email, phone: values.phone, message: values.message },
      privacyAcknowledged: values.privacyAcknowledged,
      propertyMatchOptIn: values.propertyMatchOptIn,
      newsletterOptIn: values.newsletterOptIn,
      pagePath: pathname,
    })
    if (!outcome.ok) {
      setErrors(outcome.errors)
      window.requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
        if (first) first.focus()
        else summaryRef.current?.focus()
      })
      return
    }
    setErrors({})
    setResult(outcome)
  }

  function reset() {
    setValues(EMPTY)
    setErrors({})
    setResult(null)
  }

  const errorList = Object.entries(errors).filter(([, message]) => Boolean(message)) as [string, string][]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-3 md:px-6">
      <nav aria-label="Back" className="text-sm">
        <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 font-medium text-estate-700 underline underline-offset-4">
          <ArrowLeft aria-hidden className="size-4" /> Back to {design ? design.label : project.label}
        </Link>
      </nav>

      <header className="mt-2 max-w-2xl">
        <p className="sc-eyebrow">Step 3 of 3 · simulated request</p>
        <h1 className="sc-title mt-2 text-estate-700">Request the brochure</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {project.title}{project.communityTitle ? `, part of ${project.communityTitle}` : ''} · {[project.community, project.city].join(', ')}
        </p>
        <p role="note" className="mt-4 inline-flex items-start gap-2 rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-500" />
          <span><strong className="font-semibold">Simulation.</strong> Use sample details. The request is validated against the native lead contract and the email is rendered from the real template, but nothing is saved, sent or subscribed.</span>
        </p>
      </header>

      {result && design ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)]" aria-labelledby={`${id}-success`}>
          <div className="space-y-4">
            <div className="rounded-3xl border border-estate-700/20 bg-surface p-5 sm:p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-estate-700 px-3 py-1 text-xs font-semibold text-white"><Check aria-hidden className="size-3.5" /> Simulated · nothing saved or sent</p>
              <h2 id={`${id}-success`} ref={successRef} tabIndex={-1} className="sc-heading mt-4 text-estate-700 outline-none">Here is the email {result.payload.contact.firstName} would receive</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">In the live journey this request would be saved, the team notified and the brochure email delivered with a signed download link. In this showcase the download button is inactive.</p>
              <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">To</dt><dd className="mt-0.5 break-all font-medium text-estate-700">{result.email.to}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Subject</dt><dd className="mt-0.5 font-medium text-estate-700">{result.email.subject}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Design of interest</dt><dd className="mt-0.5 font-medium text-estate-700">{design.label}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Optional updates chosen</dt><dd className="mt-0.5 text-estate-700">{[result.optIns.propertyMatch && 'Matching properties', result.optIns.newsletter && 'Newsletter'].filter(Boolean).join(' and ') || 'None'}. No subscription was created.</dd></div>
              </dl>
              <div className="mt-6 flex flex-col gap-3">
                <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-estate-700/25 px-5 text-sm font-semibold text-estate-700 hover:bg-estate-700/5">Start another request</button>
                <Link href={backHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-5 text-sm font-semibold text-white hover:bg-estate-600"><ArrowLeft aria-hidden className="size-4" /> Back to {design.label}</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-5"><DesignSummary design={design} areaLabel={areaLabel} areaSourceLabel={areaSourceLabel} compact /></div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email preview · links inactive</p>
            <iframe title={`Preview of the brochure email for ${design.label}`} srcDoc={result.email.html} sandbox="" referrerPolicy="no-referrer"
              className="mt-2 h-[1180px] w-full rounded-2xl border border-border bg-white sm:h-[980px]" />
            <details className="mt-3 rounded-2xl border border-border bg-surface">
              <summary className="min-h-12 cursor-pointer px-4 py-3 text-sm font-semibold text-estate-700">Plain-text version</summary>
              <pre className="whitespace-pre-wrap border-t border-border px-4 py-4 font-sans text-sm leading-6 text-foreground/85">{result.email.text}</pre>
            </details>
          </div>
        </section>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)] lg:items-start">
          <aside className="rounded-3xl border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-24" aria-labelledby={`${id}-design-title`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="sc-eyebrow">Your design</p>
                <h2 id={`${id}-design-title`} className="mt-1 font-serif text-xl font-medium text-estate-700">{design ? 'Selected design' : 'Choose a design'}</h2>
              </div>
              {design && !choosing && (
                <button type="button" onClick={() => setChoosing(true)} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-estate-700 underline underline-offset-4">Change design</button>
              )}
            </div>
            {design && !choosing ? (
              <div className="mt-4"><DesignSummary design={design} areaLabel={areaLabel} areaSourceLabel={areaSourceLabel} /></div>
            ) : (
              <fieldset className="mt-4">
                <legend className="text-sm leading-6 text-muted-foreground">The PDF covers the whole {project.label} collection. Your choice records which design interests you.</legend>
                <ul className="mt-3 space-y-2">
                  {designs.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => chooseDesign(item.id)} aria-pressed={item.id === designId}
                        className={cn('grid w-full grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-2 text-left', item.id === designId ? 'border-estate-700 ring-1 ring-estate-700' : 'border-border hover:border-estate-700/50')}>
                        <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-estate-700/5"><Image src={item.image.src} alt="" fill unoptimized sizes="72px" className="object-cover" /></span>
                        <span className="min-w-0 py-1">
                          <span className="block truncate text-sm font-semibold text-estate-700">{item.label}</span>
                          <span className="block text-xs tabular-nums text-muted-foreground">{areaLabel} {areaFormatter.format(item.builtUpAreaSqFt)} sq ft</span>
                        </span>
                        <ArrowRight aria-hidden className="mr-2 size-4 text-estate-700" />
                      </button>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Requesting the brochure does not reserve a home or confirm availability.</p>
          </aside>

          <form ref={formRef} onSubmit={submit} noValidate autoComplete="on" className="rounded-3xl border border-border bg-surface p-5 sm:p-7" aria-labelledby={`${id}-form-title`}>
            <p className="sc-eyebrow">Your details</p>
            <h2 id={`${id}-form-title`} className="mt-1 font-serif text-2xl font-medium text-estate-700">Where should the brochure go?</h2>
            {errorList.length > 0 && (
              <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-4 rounded-xl border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none">
                <p className="font-semibold">Please check the following:</p>
                <ul className="mt-1 list-disc pl-5">{errorList.map(([key, message]) => <li key={key}>{message}</li>)}</ul>
              </div>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-estate-700" htmlFor={`${id}-first-name`}>First name
                <input id={`${id}-first-name`} autoComplete="given-name" required maxLength={80} value={values.firstName} onChange={(event) => update('firstName', event.target.value)}
                  aria-invalid={errors.firstName ? 'true' : undefined} aria-describedby={errors.firstName ? `${id}-first-name-error` : undefined}
                  className={cn(inputClass, errors.firstName ? 'border-red-700' : 'border-estate-700/20')} />
                {errors.firstName && <span id={`${id}-first-name-error`} className="mt-1 block text-xs font-medium text-red-700">{errors.firstName}</span>}
              </label>
              <label className="block text-sm font-semibold text-estate-700" htmlFor={`${id}-email`}>Email address
                <input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" required maxLength={254} value={values.email} onChange={(event) => update('email', event.target.value)}
                  aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? `${id}-email-error` : undefined}
                  className={cn(inputClass, errors.email ? 'border-red-700' : 'border-estate-700/20')} />
                {errors.email && <span id={`${id}-email-error`} className="mt-1 block text-xs font-medium text-red-700">{errors.email}</span>}
              </label>
              <label className="block text-sm font-semibold text-estate-700" htmlFor={`${id}-phone`}>Phone number <span className="font-normal text-muted-foreground">(optional)</span>
                <input id={`${id}-phone`} type="tel" autoComplete="tel" inputMode="tel" maxLength={40} value={values.phone} onChange={(event) => update('phone', event.target.value)}
                  aria-invalid={errors.phone ? 'true' : undefined} aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
                  className={cn(inputClass, errors.phone ? 'border-red-700' : 'border-estate-700/20')} />
                {errors.phone && <span id={`${id}-phone-error`} className="mt-1 block text-xs font-medium text-red-700">{errors.phone}</span>}
              </label>
              <label className="block text-sm font-semibold text-estate-700 sm:col-span-2" htmlFor={`${id}-message`}>Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
                <textarea id={`${id}-message`} rows={3} maxLength={2000} value={values.message} onChange={(event) => update('message', event.target.value)}
                  aria-invalid={errors.message ? 'true' : undefined} aria-describedby={errors.message ? `${id}-message-error` : undefined}
                  className={cn(inputClass, 'py-3 leading-6', errors.message ? 'border-red-700' : 'border-estate-700/20')} />
                {errors.message && <span id={`${id}-message-error`} className="mt-1 block text-xs font-medium text-red-700">{errors.message}</span>}
              </label>
            </div>

            <fieldset className="mt-6 border-t border-border pt-5">
              <legend className="text-sm font-semibold text-estate-700">Privacy</legend>
              <label className={cn('mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3', errors.privacyAcknowledged ? 'border-red-700' : 'border-transparent')} htmlFor={`${id}-privacy`}>
                <input id={`${id}-privacy`} type="checkbox" required checked={values.privacyAcknowledged} onChange={(event) => update('privacyAcknowledged', event.target.checked)}
                  aria-invalid={errors.privacyAcknowledged ? 'true' : undefined} aria-describedby={`${id}-privacy-help${errors.privacyAcknowledged ? ` ${id}-privacy-error` : ''}`}
                  className="mt-1 size-5 shrink-0 accent-estate-700" />
                <span className="text-sm leading-6 text-foreground/85">{PRIVACY_ACKNOWLEDGEMENT_WORDING}</span>
              </label>
              <p id={`${id}-privacy-help`} className="px-3 text-xs leading-5 text-muted-foreground">
                Required to send the brochure. Read our <Link href="/legal/privacy-policy" className="font-medium text-estate-700 underline underline-offset-4">privacy policy</Link>.
              </p>
              {errors.privacyAcknowledged && <p id={`${id}-privacy-error`} className="mt-1 px-3 text-xs font-medium text-red-700">{errors.privacyAcknowledged}</p>}
            </fieldset>

            <fieldset className="mt-5 border-t border-border pt-5">
              <legend className="text-sm font-semibold text-estate-700">Optional email updates <span className="font-normal text-muted-foreground">(not required for the brochure)</span></legend>
              <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-3" htmlFor={`${id}-property-match`}>
                <input id={`${id}-property-match`} type="checkbox" checked={values.propertyMatchOptIn} onChange={(event) => update('propertyMatchOptIn', event.target.checked)} className="mt-1 size-5 shrink-0 accent-estate-700" />
                <span className="text-sm leading-6 text-foreground/85">{PROPERTY_MATCH_CONSENT_WORDING}</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-3" htmlFor={`${id}-newsletter`}>
                <input id={`${id}-newsletter`} type="checkbox" checked={values.newsletterOptIn} onChange={(event) => update('newsletterOptIn', event.target.checked)} className="mt-1 size-5 shrink-0 accent-estate-700" />
                <span className="text-sm leading-6 text-foreground/85">{MARKETING_CONSENT_WORDING}</span>
              </label>
              <p className="px-3 text-xs leading-5 text-muted-foreground">Requesting the brochure does not subscribe you to marketing emails.</p>
            </fieldset>

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">Submitting shows the email preview on this page. No message is sent.</p>
              <button type="submit" disabled={!hydrated} aria-disabled={!hydrated} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-6 text-sm font-semibold text-white hover:bg-estate-600 disabled:cursor-not-allowed disabled:opacity-60">
                {hydrated ? 'Preview the brochure email' : 'Loading the preview…'} <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
            <noscript>
              <p className="mt-3 rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700">The simulated email preview needs JavaScript. Without it this form does nothing and sends nothing.</p>
            </noscript>
          </form>
        </div>
      )}
    </div>
  )
}
