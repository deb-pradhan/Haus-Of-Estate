'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput, isValidMobile } from '@/components/ui/phone-input'
import { LeadConsent } from '@/components/legal/lead-consent'
import { submitLead } from '@/lib/submit-lead'
import { trackAnalytics } from '@/lib/analytics'
import {
  ENQUIRY_RECEIVED_COPY,
  RESPONSE_SENTENCE,
} from '@/lib/site-claims'
import { cn } from '@/lib/utils'

export interface EnquiryContext {
  title: string
  slug: string
  unitType?: string
  place?: string
  market?: 'dubai' | 'uk'
  rentOnly: boolean
  bedrooms?: number | null
  fallbackEmail: string
  whatsappHref: string
}

type Errors = Partial<Record<'name' | 'email' | 'mobile', string>>

/**
 * Inline enquiry form. Posts to /api/leads with consentNotice (the notice
 * sits beside the button; there is no mandatory tickbox) and an optional,
 * unticked marketing box. Never reports success unless the server accepted it.
 */
export function EnquiryForm({ context }: { context: EnquiryContext }) {
  const uid = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [message, setMessage] = useState('')
  const [marketing, setMarketing] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [failure, setFailure] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const id = (field: string) => `${uid}-${field}`

  function validate(): Errors {
    const next: Errors = {}
    if (!name.trim()) next.name = 'Please tell us your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Please enter a valid email address.'
    }
    if (!isValidMobile(mobile)) {
      next.mobile = 'Please enter a valid phone or WhatsApp number.'
    }
    return next
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (status === 'sending') return
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      if (found.name) nameRef.current?.focus()
      else if (found.email) emailRef.current?.focus()
      else document.getElementById(id('mobile'))?.focus()
      return
    }

    setStatus('sending')
    const [firstName, ...rest] = name.trim().split(/\s+/)
    const result = await submitLead({
      marketingConsent: marketing,
      fields: {
        intent: 'buyer',
        buyOrRent: context.rentOnly ? 'rent' : 'buy',
        market: context.market,
        propertyType: context.unitType,
        location: context.place,
        bedrooms:
          typeof context.bedrooms === 'number' ? String(context.bedrooms) : undefined,
        firstName,
        surname: rest.length > 0 ? rest.join(' ') : undefined,
        email: email.trim(),
        mobile,
        message: message.trim() || undefined,
        propertyTitle: context.title,
        propertySlug: context.slug,
        propertyUrl: `https://hausofestate.com/properties/${context.slug}`,
        source: 'property-enquiry',
      },
    })

    if (result.ok) {
      trackAnalytics('haus_contact_click', { contact_method: 'enquiry' })
      setStatus('sent')
    } else {
      setFailure(result.error)
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="space-y-4 py-2">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-trust-teal" />
          <div>
            <p className="font-serif text-xl font-medium text-estate-900">Thank you.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {ENQUIRY_RECEIVED_COPY}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="lg" className="w-full">
          <a
            href={context.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAnalytics('haus_contact_click', { contact_method: 'whatsapp' })}
          >
            <MessageCircle aria-hidden="true" />
            Prefer WhatsApp? Message us
          </a>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={status === 'sending'}>
      <Field id={id('name')} label="Full name" error={errors.name}>
        <Input
          ref={nameRef}
          id={id('name')}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id('name')}-error` : undefined}
          required
        />
      </Field>

      <Field id={id('email')} label="Email" error={errors.email}>
        <Input
          ref={emailRef}
          id={id('email')}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${id('email')}-error` : undefined}
          required
        />
      </Field>

      <Field id={id('mobile')} label="Phone or WhatsApp" error={errors.mobile}>
        <PhoneInput
          id={id('mobile')}
          value={mobile}
          onChange={setMobile}
          invalid={Boolean(errors.mobile)}
          className="h-12 rounded-xl bg-white/60"
          placeholder="Phone or WhatsApp number"
        />
      </Field>

      <Field id={id('message')} label="Message (optional)">
        <Textarea
          id={id('message')}
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="For example, when you plan to buy or what you would like to know."
          className="min-h-24 rounded-xl bg-white/60"
        />
      </Field>

      <LeadConsent
        idPrefix={uid}
        marketing={marketing}
        onMarketingChange={setMarketing}
        purpose="reply to this enquiry about this property and, if you ask, introduce you to a suitable agent or partner"
      />

      {status === 'failed' && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-destructive"
        >
          {failure}{' '}
          <a
            href={`mailto:${context.fallbackEmail}?subject=${encodeURIComponent(`Enquiry: ${context.title}`)}`}
            className="font-medium underline underline-offset-2"
          >
            {context.fallbackEmail}
          </a>
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
        {status === 'sending' ? (
          <>
            <Loader2 aria-hidden="true" className="animate-spin" />
            Sending
          </>
        ) : (
          <>
            Send my enquiry
            <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        No obligation. {RESPONSE_SENTENCE}
      </p>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5')}>
      <label htmlFor={id} className="block text-sm font-medium text-estate-900">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
