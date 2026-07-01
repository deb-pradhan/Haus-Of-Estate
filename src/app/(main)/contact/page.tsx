import type { Metadata } from 'next'
import { Mail, Phone, MessageCircle, MapPin, ArrowRight } from 'lucide-react'

const COMPANY_EMAIL = 'info@hausofestate.com'
const COMPANY_PHONE_DISPLAY = '+971 58 560 7033'
const COMPANY_PHONE_HREF = 'tel:+971585607033'
const WHATSAPP_URL =
  'https://wa.me/971585607033?utm_source=site&utm_medium=contact&utm_campaign=whatsapp'

export const metadata: Metadata = {
  title: 'Contact | Haus of Estate',
  description:
    'Get in touch with Haus of Estate. Speak to a property specialist by email, phone or WhatsApp — offices in the UK and UAE, serving buyers, landlords and investors worldwide.',
  openGraph: {
    title: 'Contact | Haus of Estate',
    description:
      'Speak to a Haus of Estate specialist by email, phone or WhatsApp. Offices in the UK and UAE, serving clients worldwide.',
  },
}

const METHODS = [
  {
    icon: Mail,
    label: 'Email',
    value: COMPANY_EMAIL,
    href: `mailto:${COMPANY_EMAIL}`,
    hint: 'We reply within two working hours.',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: COMPANY_PHONE_DISPLAY,
    href: COMPANY_PHONE_HREF,
    hint: 'Speak to a specialist directly.',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: 'Chat with us',
    href: WHATSAPP_URL,
    hint: 'The fastest way to reach our team.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-serif text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
            Contact
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-5xl">
            Talk to a{' '}
            <span className="text-gold-400">specialist.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Whether you&apos;re buying, letting, selling or investing across the
            UK, UAE and beyond, a vetted specialist is ready to help. Reach us by
            email, phone or WhatsApp — we&apos;ll reply within two working hours.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="bg-surface px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
            {METHODS.map((m) => {
              const isExternal = m.href.startsWith('http')
              return (
                <a
                  key={m.label}
                  href={m.href}
                  {...(isExternal
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="group rounded-2xl border border-border bg-canvas/50 p-7 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 font-serif text-lg font-medium text-estate-700">
                    {m.label}
                  </p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    {m.value}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {m.hint}
                  </p>
                </a>
              )
            })}
          </div>

          {/* Offices */}
          <div className="mt-12 rounded-2xl border border-border bg-canvas/50 p-7 md:p-9">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-estate-700/10 text-estate-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-medium text-estate-700 md:text-2xl">
                  Offices in the UK &amp; UAE
                </h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  A 24-hour business spread across the United Kingdom and the
                  United Arab Emirates, serving buyers, landlords and investors
                  worldwide. Wherever you&apos;re moving capital, a specialist in
                  your timezone is ready to help.
                </p>
              </div>
            </div>
          </div>

          {/* Enquire prompt */}
          <div className="mt-12 rounded-2xl border border-border bg-surface p-7 text-center shadow-sm md:p-9">
            <h2 className="font-serif text-xl font-medium text-estate-700 md:text-2xl">
              Ready to enquire?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Send us a message and a member of our team will be in touch. A
              15-minute conversation is enough to know whether we&apos;re the
              right firm for what you&apos;re trying to do.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-estate-600"
            >
              Enquire on WhatsApp <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
