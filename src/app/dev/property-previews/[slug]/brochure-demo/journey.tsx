'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { LeadEoiForm } from '@/components/lead-eoi/lead-eoi-form'
import type { LeadProjectContext } from '@/components/lead-eoi/types'
import type { LeadIntakeV2Input } from '@/lib/lead-intake/contract'
import { renderBrochureEmail } from '@/lib/email/brochure'

interface DemoDesign {
  id: string
  label: string
  summary?: string
  brochureKey: string
  image: { src: string; alt: string }
  sellableAreaSqFt: number
  plotAreaSqFt?: number
  plotAreaStatus?: 'brochure' | 'conflict'
  position?: 'corner' | 'middle' | 'standalone'
}

const areaFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

function DesignAreas({ design }: { design: DemoDesign }) {
  return (
    <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
      <div>
        <dt className="text-xs text-muted-foreground">Built-up area</dt>
        <dd className="mt-1 font-medium text-estate-700">{areaFormatter.format(design.sellableAreaSqFt)} sq ft</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Plot area</dt>
        <dd className="mt-1 font-medium text-estate-700">{design.plotAreaStatus !== 'conflict' && typeof design.plotAreaSqFt === 'number'
          ? `${areaFormatter.format(design.plotAreaSqFt)} sq ft`
          : 'To be confirmed'}</dd>
      </div>
    </dl>
  )
}

export function BrochureJourneyDemo({ project, designs, initialDesignId }: {
  project: LeadProjectContext
  designs: DemoDesign[]
  initialDesignId?: string
}) {
  const [design, setDesign] = useState<DemoDesign | null>(() => designs.find((item) => item.id === initialDesignId) ?? null)
  const [email, setEmail] = useState<{ to: string; subject: string; html: string; propertyMatchOptIn: boolean; newsletterOptIn: boolean } | null>(null)
  const designHeadingRef = useRef<HTMLHeadingElement>(null)

  function chooseDesign(nextDesign: DemoDesign | null) {
    setDesign(nextDesign)
    setEmail(null)
    window.requestAnimationFrame(() => designHeadingRef.current?.focus())
  }

  async function previewRequest(payload: Omit<LeadIntakeV2Input, 'submissionId'>) {
    if (!design || payload.project?.slug !== project.slug ||
      payload.brochure?.designId !== design.id || !payload.privacyAcknowledged) {
      throw new Error('Choose a design and acknowledge the privacy notice to preview this brochure request.')
    }
    const rendered = renderBrochureEmail({
      key: design.brochureKey, revision: 'local-demonstration',
      projectSlug: project.slug, projectTitle: project.title ?? project.slug,
      designId: design.id, designLabel: design.label,
      recipientName: payload.contact.firstName, recipientEmail: payload.contact.email,
    }, '#preview-only')
    setEmail({
      to: payload.contact.email,
      subject: rendered.subject,
      propertyMatchOptIn: payload.propertyMatchOptIn,
      newsletterOptIn: payload.newsletterOptIn,
      // This isolated sample must not load remote resources or offer a real download.
      html: rendered.html.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><style>a{pointer-events:none}</style>'),
    })
  }

  return (
    <div className="bg-background px-4 py-5 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Brochure navigation" className="text-sm text-estate-700">
          <Link href={`/dev/property-previews/${project.slug}`} className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to the property</Link>
        </nav>
        <div className="mb-5 mt-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs leading-5 text-estate-700">
          <strong>Local demo · nothing saved or emailed.</strong> Use sample details to see the email preview.
        </div>
        <div>
          <h1 className="font-serif text-3xl leading-tight text-estate-700 md:text-4xl">Request the brochure</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.title}</p>
        </div>
        {!design ? (
          <section aria-labelledby="choose-design" className="mt-8">
            <h2 id="choose-design" ref={designHeadingRef} tabIndex={-1} className="scroll-mt-32 font-serif text-2xl text-estate-700 outline-none lg:scroll-mt-48">Which design interests you?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose your design of interest. The PDF covers the collection, rather than one individual home.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map((item) => (
                <button key={item.id} type="button" onClick={() => chooseDesign(item)}
                  className="group grid grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-surface text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-estate-700 sm:flex sm:flex-col">
                  <div className="relative bg-estate-700/5 sm:aspect-[3/2] sm:w-full">
                    <Image src={item.image.src} alt={item.image.alt} fill unoptimized sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 76px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="text-sm font-medium text-estate-700 sm:font-serif sm:text-xl">{item.label}</h3>
                    <div className="mt-3"><DesignAreas design={item} /></div>
                    <span className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-estate-700">Select design<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="mt-5 grid items-start gap-4 lg:mt-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.4fr)] lg:gap-8">
            <aside aria-labelledby="selected-design-title" className="overflow-hidden rounded-2xl border border-border bg-surface lg:sticky lg:top-48">
              <div className="relative hidden aspect-[3/2] bg-estate-700/5 lg:block">
                <Image src={design.image.src} alt={design.image.alt} fill unoptimized sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
              </div>
              <div className="p-4 lg:p-6">
                <div className="flex items-start justify-between gap-3 lg:block">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Selected design</p>
                    <h2 id="selected-design-title" ref={designHeadingRef} tabIndex={-1} className="mt-1 scroll-mt-32 text-base font-medium leading-6 text-estate-700 outline-none lg:scroll-mt-48 lg:font-serif lg:text-3xl lg:leading-tight">{design.label}</h2>
                  </div>
                  <button type="button" className="-my-1 inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-medium text-estate-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 lg:my-2 lg:px-0" onClick={() => chooseDesign(null)}>Change design</button>
                </div>
                <div className="hidden lg:block">
                  {design.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{design.summary}</p>}
                  <div className="mt-4"><DesignAreas design={design} /></div>
                </div>
                <details className="group mt-2 border-t border-border lg:hidden">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm text-estate-700 [&::-webkit-details-marker]:hidden">View image & areas<ChevronDown className="h-4 w-4 group-open:rotate-180" aria-hidden="true" /></summary>
                  <div className="relative mb-3 aspect-[2/1] overflow-hidden rounded-lg"><Image src={design.image.src} alt={design.image.alt} fill unoptimized sizes="100vw" className="object-cover" /></div>
                  <DesignAreas design={design} />
                  {design.summary && <p className="mt-3 text-xs leading-5 text-muted-foreground">{design.summary}</p>}
                </details>
                <p className="mt-2 text-xs leading-5 text-muted-foreground lg:mt-5">The PDF covers this collection. Your design choice records your interest; it does not reserve a home.</p>
              </div>
            </aside>
            <div className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-7">
              <LeadEoiForm key={design.id} project={project} initialInterest="buy" surface="manual_cta"
                brochureRequest={{ design: { id: design.id, label: design.label } }}
                localDemo={{
                  onSubmit: previewRequest,
                  onReset: () => setEmail(null),
                  confirmation: email ? (
                    <section className="mt-6 w-full min-w-0 text-left" aria-labelledby="email-preview-title">
                      <h3 id="email-preview-title" className="font-serif text-2xl text-estate-700">Your brochure email preview</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Prepared for {design.label}. The download button below is inactive in this demonstration.</p>
                      <dl className="my-5 space-y-3 rounded-lg bg-subtle p-4 text-sm">
                        <div><dt className="text-xs text-muted-foreground">To</dt><dd className="mt-1 break-all font-medium text-foreground">{email.to}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Subject</dt><dd className="mt-1 text-foreground">{email.subject}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Optional updates chosen for this demo</dt><dd className="mt-1 text-foreground">{[email.propertyMatchOptIn && 'Matching properties', email.newsletterOptIn && 'Newsletter'].filter(Boolean).join(' and ') || 'None selected'}. No subscription was created.</dd></div>
                      </dl>
                      <iframe title="Requested property brochure email" srcDoc={email.html} sandbox=""
                        referrerPolicy="no-referrer" className="h-[1300px] w-full rounded-xl border border-border min-[380px]:h-[1150px] sm:h-[940px]" />
                    </section>
                  ) : null,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
