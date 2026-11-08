'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import {
  MARKETING_CONSENT_WORDING,
  PRIVACY_ACKNOWLEDGEMENT_WORDING,
  PROPERTY_MATCH_CONSENT_WORDING,
} from '@/lib/lead-intake/contract'
import type { LaunchInterest } from '@/lib/launches/registry'
import {
  buildSimulatedLaunchRegistration,
  type SimulatedLaunchErrors,
  type SimulatedLaunchResult,
} from '@/lib/showcase/launch-request'
import { cn } from '@/lib/utils'

interface FormValues {
  interest: 'buy' | 'invest'
  propertyType: string
  bedrooms: string
  timeframe: string
  firstName: string
  email: string
  phone: string
  message: string
  privacyAcknowledged: boolean
  propertyMatchOptIn: boolean
  newsletterOptIn: boolean
}

const EMPTY: FormValues = {
  interest: 'buy', propertyType: '', bedrooms: '', timeframe: '',
  firstName: '', email: '', phone: '', message: '',
  privacyAcknowledged: false, propertyMatchOptIn: false, newsletterOptIn: false,
}
const TIMEFRAMES = ['Immediately', 'Within 3 months', '3-6 months', '6-12 months', 'More than 12 months', 'Just researching']
const inputClass = 'mt-1.5 min-h-12 w-full rounded-xl border bg-white px-3.5 text-base text-estate-700 shadow-sm sm:text-sm'
const subscribeToNothing = () => () => {}

/**
 * Simulated register-interest form for the draft launch article.
 * Same fields and consent wording as the live form; the result shows the
 * sales notification the team would receive instead of saving anything.
 */
export function LaunchRegisterSimulated({ launch, livePath }: { launch: LaunchInterest; livePath: string }) {
  const id = useId()
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false)
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<SimulatedLaunchErrors>({})
  const [result, setResult] = useState<Extract<SimulatedLaunchResult, { ok: true }> | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (result) window.requestAnimationFrame(() => successRef.current?.focus())
  }, [result])

  function update<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key as keyof SimulatedLaunchErrors]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const outcome = buildSimulatedLaunchRegistration({
      launch,
      interest: values.interest,
      preferences: { propertyType: values.propertyType, bedrooms: values.bedrooms, timeframe: values.timeframe },
      contact: { firstName: values.firstName, email: values.email, phone: values.phone, message: values.message },
      privacyAcknowledged: values.privacyAcknowledged,
      propertyMatchOptIn: values.propertyMatchOptIn,
      newsletterOptIn: values.newsletterOptIn,
      pagePath: livePath,
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

  const errorList = Object.entries(errors).filter(([, message]) => Boolean(message)) as [string, string][]

  if (result) {
    return (
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" aria-labelledby={`${id}-success`}>
        <div className="rounded-3xl border border-estate-700/20 bg-surface p-5 sm:p-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-estate-700 px-3 py-1 text-xs font-semibold text-white"><Check aria-hidden className="size-3.5" /> Simulated · nothing saved or sent</p>
          <h3 id={`${id}-success`} ref={successRef} tabIndex={-1} className="mt-4 font-serif text-2xl font-medium text-estate-700 outline-none">Thank you, {result.payload.contact.firstName}. Here is what the team would receive.</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">In the live journey this registration is saved with the launch as its project, the sales inbox is notified, and a consultant follows up by email. Registering does not reserve a home.</p>
          <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Saved as project</dt><dd className="mt-0.5 font-medium text-estate-700">{result.saved.project}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Source · campaign</dt><dd className="mt-0.5 text-estate-700">{result.saved.source} · {result.saved.campaign}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Landing page</dt><dd className="mt-0.5 break-all text-estate-700">{result.saved.landingPage}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notification</dt><dd className="mt-0.5 text-estate-700">To {result.notification.to} · reply-to {result.notification.replyTo}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Optional updates chosen</dt><dd className="mt-0.5 text-estate-700">{[result.optIns.propertyMatch && 'Matching properties', result.optIns.newsletter && 'Newsletter'].filter(Boolean).join(' and ') || 'None'}. No subscription was created.</dd></div>
          </dl>
          <button type="button" onClick={() => { setValues(EMPTY); setResult(null) }} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-estate-700/25 px-5 text-sm font-semibold text-estate-700 hover:bg-estate-700/5">Start another registration</button>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sales notification · exact text</p>
          <p className="mt-1 text-sm text-estate-700">Subject: {result.notification.subject}</p>
          <pre className="mt-2 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-white px-4 py-4 font-mono text-[13px] leading-6 text-foreground/85">{result.notification.text}</pre>
        </div>
      </section>
    )
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate autoComplete="on" className="rounded-3xl border border-border bg-surface p-5 sm:p-7" aria-labelledby={`${id}-form-title`}>
      <p role="note" className="inline-flex items-start gap-2 rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-500" />
        <span><strong className="font-semibold">Simulation.</strong> Use sample details. The registration is validated against the native lead contract, but nothing is saved, sent or subscribed.</span>
      </p>
      <h3 id={`${id}-form-title`} className="mt-5 font-serif text-2xl font-medium text-estate-700">Your interest in {launch.title}</h3>
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-4 rounded-xl border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none">
          <p className="font-semibold">Please check the following:</p>
          <ul className="mt-1 list-disc pl-5">{errorList.map(([key, message]) => <li key={key}>{message}</li>)}</ul>
        </div>
      )}

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-estate-700">I am looking to</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {([['buy', 'Buy a home to live in'], ['invest', 'Invest']] as const).map(([value, label]) => (
            <label key={value} htmlFor={`${id}-${value}`} className={cn('flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm font-medium text-estate-700', values.interest === value ? 'border-estate-700 bg-estate-700/[0.04]' : 'border-estate-700/20')}>
              <input id={`${id}-${value}`} type="radio" name={`${id}-interest`} checked={values.interest === value} onChange={() => update('interest', value)} className="size-4 accent-estate-700" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-estate-700" htmlFor={`${id}-type`}>Home type <span className="font-normal text-muted-foreground">(reported options)</span>
          <select id={`${id}-type`} value={values.propertyType} onChange={(event) => update('propertyType', event.target.value)} className={cn(inputClass, 'border-estate-700/20')}>
            <option value="">Not sure yet</option>
            {launch.reportedUnitTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-estate-700" htmlFor={`${id}-beds`}>Bedrooms
          <select id={`${id}-beds`} value={values.bedrooms} onChange={(event) => update('bedrooms', event.target.value)} className={cn(inputClass, 'border-estate-700/20')}>
            <option value="">Not sure yet</option>
            {launch.reportedBedrooms.map((beds) => <option key={beds} value={beds}>{beds}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-estate-700" htmlFor={`${id}-timeframe`}>Timeframe
          <select id={`${id}-timeframe`} value={values.timeframe} onChange={(event) => update('timeframe', event.target.value)} className={cn(inputClass, 'border-estate-700/20')}>
            <option value="">Prefer not to say</option>
            {TIMEFRAMES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

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
          Required to register your interest. Read our <Link href="/legal/privacy-policy" className="font-medium text-estate-700 underline underline-offset-4">privacy policy</Link>.
        </p>
        {errors.privacyAcknowledged && <p id={`${id}-privacy-error`} className="mt-1 px-3 text-xs font-medium text-red-700">{errors.privacyAcknowledged}</p>}
      </fieldset>

      <fieldset className="mt-5 border-t border-border pt-5">
        <legend className="text-sm font-semibold text-estate-700">Optional email updates <span className="font-normal text-muted-foreground">(not required to register)</span></legend>
        <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-3" htmlFor={`${id}-property-match`}>
          <input id={`${id}-property-match`} type="checkbox" checked={values.propertyMatchOptIn} onChange={(event) => update('propertyMatchOptIn', event.target.checked)} className="mt-1 size-5 shrink-0 accent-estate-700" />
          <span className="text-sm leading-6 text-foreground/85">{PROPERTY_MATCH_CONSENT_WORDING}</span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl p-3" htmlFor={`${id}-newsletter`}>
          <input id={`${id}-newsletter`} type="checkbox" checked={values.newsletterOptIn} onChange={(event) => update('newsletterOptIn', event.target.checked)} className="mt-1 size-5 shrink-0 accent-estate-700" />
          <span className="text-sm leading-6 text-foreground/85">{MARKETING_CONSENT_WORDING}</span>
        </label>
        <p className="px-3 text-xs leading-5 text-muted-foreground">Registering your interest does not subscribe you to marketing emails.</p>
      </fieldset>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">Submitting shows the sales notification on this page. No message is sent.</p>
        <button type="submit" disabled={!hydrated} aria-disabled={!hydrated} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-6 text-sm font-semibold text-white hover:bg-estate-600 disabled:cursor-not-allowed disabled:opacity-60">
          {hydrated ? 'Preview the registration' : 'Loading the preview…'} <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      <noscript>
        <p className="mt-3 rounded-xl border border-gold-500/35 bg-gold-500/10 px-3.5 py-3 text-sm leading-6 text-estate-700">The simulated preview needs JavaScript. Without it this form does nothing and sends nothing.</p>
      </noscript>
    </form>
  )
}
