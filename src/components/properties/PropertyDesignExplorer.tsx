'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { Check, Expand, House } from 'lucide-react'
import type { PropertyDesign, PropertyDesignImage, PropertyInteriorScheme } from '@/lib/property-designs'
import type { LeadProjectContext } from '@/components/lead-eoi/types'
import { PropertyBrochureRequestTrigger } from '@/components/lead-eoi/property-brochure-request-trigger'
import { PropertyPhotoBranding } from './property-photo-branding'

const areaFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

function DesignPhotos({ images, preview, showHausLogo }: {
  images: PropertyDesignImage[]
  preview: boolean
  showHausLogo?: boolean
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? images[0]
  if (!selected) return null

  return (
    <div>
      <figure>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-estate-700/5">
          <Image src={selected.src} alt={selected.alt} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-contain" unoptimized={preview} />
          <PropertyPhotoBranding enabled={showHausLogo} />
        </div>
        <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">{selected.label || selected.alt}</figcaption>
      </figure>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Design photographs">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              aria-label={`Show ${image.label || image.alt}`}
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700 ${selectedIndex === index ? 'border-estate-700' : 'border-transparent'}`}
            >
              <Image src={image.src} alt="" fill sizes="96px" className="object-cover" unoptimized={preview} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PropertyDesignExplorer({ designs, interiorSchemes = [], project, interactionsEnabled = false, preview = false, showHausLogo }: {
  designs: PropertyDesign[]
  interiorSchemes?: PropertyInteriorScheme[]
  project: LeadProjectContext
  interactionsEnabled?: boolean
  preview?: boolean
  showHausLogo?: boolean
}) {
  const [selectedKey, setSelectedKey] = useState(designs[0]?._key)
  const [schemeKey, setSchemeKey] = useState(interiorSchemes[0]?._key)
  const sectionId = useId()
  const selected = designs.find((design) => design._key === selectedKey) ?? designs[0]
  const scheme = interiorSchemes.find((item) => item._key === schemeKey) ?? interiorSchemes[0]
  if (!selected) return null

  const plotArea = selected.plotAreaStatus !== 'conflict' && typeof selected.plotAreaSqFt === 'number'
    ? `${areaFormatter.format(selected.plotAreaSqFt)} sq ft`
    : 'Awaiting confirmation'
  const position = selected.position === 'standalone' ? 'Standalone villa' : selected.position ? `${selected.position === 'corner' ? 'Corner' : 'Middle'} home` : undefined

  return (
    <section className="mt-10 border-t border-border pt-8" aria-labelledby={`${sectionId}-heading`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${sectionId}-heading`} className="font-serif text-2xl font-medium text-estate-700">Home designs</h2>
        <span className="text-xs text-muted-foreground">{designs.length} brochure designs</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Explore each design’s images, floor plans and areas. Designs illustrate the collection; individual homes and availability are confirmed on enquiry.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Choose a home design">
        {designs.map((design) => {
          const active = selected._key === design._key
          const thumbnail = design.images[0]
          return (
            <button
              key={design._key}
              type="button"
              aria-pressed={active}
              aria-controls={`${sectionId}-design`}
              onClick={() => setSelectedKey(design._key)}
              className={`overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700 ${active ? 'border-estate-700 bg-estate-700/5 ring-1 ring-estate-700' : 'border-border bg-surface hover:border-estate-700/50'}`}
            >
              <span className="relative flex aspect-[3/2] items-center justify-center overflow-hidden bg-estate-700/5">
                {thumbnail ? <Image src={thumbnail.src} alt="" fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" unoptimized={preview} /> : <House className="h-8 w-8 text-estate-700/40" aria-hidden="true" />}
              </span>
              <span className="flex min-h-16 items-center justify-between gap-2 p-3 text-sm font-medium text-estate-700">
                {design.label}
                {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </span>
            </button>
          )
        })}
      </div>

      <div id={`${sectionId}-design`} className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selected design</p>
        <h3 className="mt-1 font-serif text-xl font-medium text-estate-700" aria-live="polite">{selected.label}</h3>
        {(selected.rowHomes || position) && (
          <p className="mt-2 text-sm text-muted-foreground">{[selected.rowHomes ? `${selected.rowHomes}-home row` : undefined, position].filter(Boolean).join(' · ')}</p>
        )}
        {selected.summary && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{selected.summary}</p>}

        <dl className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Plot area</dt>
            <dd className="mt-1 text-lg font-medium text-estate-700">{plotArea}</dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Sellable area</dt>
            <dd className="mt-1 text-lg font-medium text-estate-700">{areaFormatter.format(selected.sellableAreaSqFt)} sq ft</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{selected.plotAreaStatus === 'conflict' ? 'The brochure’s plot dimensions and area table differ. Plot area is awaiting confirmation.' : 'Areas shown are from the supplied brochure.'}{selected.plotAreaStatus !== 'conflict' && selected.areaNote ? ` ${selected.areaNote}` : ''}</p>

        <div className="mt-6">
          <DesignPhotos key={selected._key} images={selected.images} preview={preview} showHausLogo={showHausLogo} />
        </div>

        {selected.floorPlans.length > 0 && (
          <div className="mt-7">
            <h4 className="font-serif text-lg font-medium text-estate-700">Floor plans</h4>
            <p className="mt-1 text-xs text-muted-foreground">Open a plan to zoom in. Each plan opens in a new tab.</p>
            <div className="mt-4 space-y-4">
              {selected.floorPlans.map((plan, index) => (
                <a
                  key={`${plan.src}-${index}`}
                  href={plan.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${plan.label || plan.alt} in a new tab`}
                  className="block overflow-hidden rounded-xl border border-border bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700"
                >
                  <span className="relative block aspect-[4/3]">
                    <Image src={plan.src} alt={plan.alt} fill sizes="(max-width: 1024px) 100vw, 700px" className="object-contain" unoptimized={preview} />
                  </span>
                  <span className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm font-medium text-estate-700">
                    {plan.label || plan.alt}<Expand className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 border-t border-border pt-5">
          <PropertyBrochureRequestTrigger
            project={project}
            design={{ id: selected._key, label: selected.label }}
            disabled={!interactionsEnabled}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-estate-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-estate-600 disabled:cursor-not-allowed disabled:bg-estate-700/15 disabled:text-estate-700/70 sm:w-auto"
          />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{interactionsEnabled ? 'Request the collection’s full brochure with this design noted as your interest.' : 'Brochure requests are disabled in preview.'}</p>
        </div>
      </div>

      {scheme && (
        <section className="mt-8" aria-labelledby={`${sectionId}-interiors`}>
          <h3 id={`${sectionId}-interiors`} className="font-serif text-xl font-medium text-estate-700">Interior schemes shown in the brochure</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">These images show the brochure’s interior schemes. Whether a scheme can be chosen, which homes it applies to and what is included are awaiting confirmation.</p>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Compare brochure interior schemes">
            {interiorSchemes.map((item) => (
              <button
                key={item._key}
                type="button"
                aria-pressed={scheme._key === item._key}
                onClick={() => setSchemeKey(item._key)}
                className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-estate-700 ${scheme._key === item._key ? 'border-estate-700 bg-estate-700 text-white' : 'border-border text-estate-700 hover:bg-estate-700/5'}`}
              >{item.label}</button>
            ))}
          </div>
          <div className="mt-4">
            <DesignPhotos key={scheme._key} images={scheme.images} preview={preview} showHausLogo={showHausLogo} />
          </div>
        </section>
      )}
    </section>
  )
}
