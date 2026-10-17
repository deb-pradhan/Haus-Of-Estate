import type { Metadata } from 'next'
import { Mail, Phone, MessageCircle, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'
import { COMPANY_IDENTITY } from '@/lib/company-identity'
import { RESPONSE_TIME_COPY } from '@/lib/site-claims'

const COMPANY_EMAIL = COMPANY_IDENTITY.generalEmail
const COMPANY_PHONE_DISPLAY = '+44 7496 033321'
const COMPANY_PHONE_HREF = 'tel:+447496033321'
const WHATSAPP_URL =
  'https://wa.me/971585607033?utm_source=site&utm_medium=contact&utm_campaign=whatsapp'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Haus of Estate by email, phone or WhatsApp. We introduce buyers, landlords and investors to estate agents and brokers in the UK, UAE and selected international markets.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact — Haus of Estate',
    description:
      'Contact Haus of Estate by email, phone or WhatsApp.',
    url: '/contact',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

const METHODS = [
  {
    icon: Mail,
    label: 'Email',
    value: COMPANY_EMAIL,
    href: `mailto:${COMPANY_EMAIL}`,
    hint: `We reply ${RESPONSE_TIME_COPY}.`,
  },
  {
    icon: Phone,
    label: 'Phone',
    value: COMPANY_PHONE_DISPLAY,
    href: COMPANY_PHONE_HREF,
    hint: 'Speak to our team by phone.',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+971 58 560 7033',
    href: WHATSAPP_URL,
    hint: 'Message us and we will reply when we can.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="bg-estate-700 px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow eyebrow-dark">Contact</p>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.05] text-white md:text-5xl">
            Get in{' '}
            <span className="text-gold-400">touch.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            Whether you&apos;re buying, letting, selling or investing across the
            UK, UAE and beyond, tell us what you are looking for. Reach us by
            email, phone or WhatsApp and we&apos;ll reply {RESPONSE_TIME_COPY}.
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-700">
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
                  Trading address
                </h2>
                <address className="mt-3 text-base not-italic leading-relaxed text-muted-foreground">
                  115 City Road, Unit A, Cardiff, Wales, United Kingdom, CF24 3BP
                </address>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {COMPANY_IDENTITY.name} is a trading name of {COMPANY_IDENTITY.legalName},
                  registered in {COMPANY_IDENTITY.registeredJurisdiction} (company number{' '}
                  {COMPANY_IDENTITY.number}). Registered office:{' '}
                  {COMPANY_IDENTITY.registeredOffice}.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  If you are unhappy with our service, see{' '}
                  <Link
                    href="/legal/complaints"
                    className="underline underline-offset-4 hover:text-estate-700"
                  >
                    how to make a complaint
                  </Link>
                  .
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
              Send us a message and a member of our team will be in touch. There
              is no obligation.
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
