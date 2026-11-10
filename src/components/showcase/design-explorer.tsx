'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Check, Mail, Phone, Rows3 } from 'lucide-react'
import { showcasePropertyPath } from '@/lib/showcase/access'
import { SHOWCASE_SALES_EMAIL, showcaseMailto } from '@/lib/showcase/contact'
import type { ShowcaseDesign, ShowcaseDisplay, ShowcaseInteriorScheme } from '@/lib/showcase/fixture'
import { designMetaLabel, formatArea, formatAreaDual } from '@/lib/showcase/format'
import { cn } from '@/lib/utils'
import { ImageViews } from './image-views'
import { PlanFigure, ProvenanceLine } from './primitives'

interface ExplorerProps {
  collection: { slug: string; title: string; label: string }
  designs: ShowcaseDesign[]
  interiorSchemes: ShowcaseInteriorScheme[]
  display: ShowcaseDisplay
  initialDesignKey?: string
}

const designMeta = designMetaLabel

function requestHref(slug: string, key: string) {
  return showcasePropertyPath(slug, `/request?design=${encodeURIComponent(key)}`)
}

export function DesignExplorer({ collection, designs, interiorSchemes, display, initialDesignKey }: ExplorerProps) {
  const id = useId()
  const [selectedKey, setSelectedKey] = useState(() => designs.some((design) => design.key === initialDesignKey) ? initialDesignKey! : designs[0]?.key)
  const [schemeKey, setSchemeKey] = useState(interiorSchemes[0]?.key)
  const [barHidden, setBarHidden] = useState(false)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const selectedHeadingRef = useRef<HTMLHeadingElement>(null)
  const selected = designs.find((design) => design.key === selectedKey) ?? designs[0]
  const scheme = interiorSchemes.find((item) => item.key === schemeKey) ?? interiorSchemes[0]
  const families = [...new Set(designs.map((design) => design.family ?? ''))]
  const grouped = families.length > 1
  const groups = grouped ? families.map((family) => ({ family, designs: designs.filter((design) => (design.family ?? '') === family) })) : [{ family: '', designs }]

  // The sticky mobile bar steps aside while the in-page button or the footer is visible.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const targets = [ctaRef.current, document.querySelector('footer')].filter((node): node is HTMLElement => node !== null)
    const visible = new Set<HTMLElement>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target as HTMLElement)
        else visible.delete(entry.target as HTMLElement)
      }
      setBarHidden(visible.size > 0)
    })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [selectedKey])

  function revealSelected() {
    const heading = selectedHeadingRef.current
    if (!heading) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
  }

  function choose(key: string) {
    setSelectedKey(key)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('design', key)
      window.history.replaceState(window.history.state, '', url)
      // On narrow screens the detail panel sits below the list: take the reader there.
      if (window.matchMedia('(max-width: 1023px)').matches) window.requestAnimationFrame(revealSelected)
    }
  }

  if (!selected) return null
  const plotWithheld = selected.plotAreaStatus === 'conflict' || selected.plotAreaSqFt === undefined

  return (
    <section id="designs" className="scroll-mt-24" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="sc-eyebrow">Step 2 of 3</p>
          <h2 id={`${id}-title`} className="sc-heading mt-2 text-estate-700">Choose a design</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">Compare layouts and areas, then open a design to see its views and floor plans. Individual homes, prices and availability are confirmed on enquiry.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{designs.length} brochure designs</p>
          <button type="button" onClick={revealSelected} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-estate-700/20 bg-surface px-3.5 text-sm font-medium text-estate-700 lg:hidden">
            View selected design <ArrowDown aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      {designs.some((design) => design.rowHomes) && (
        <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><Rows3 aria-hidden className="mt-1 size-4 shrink-0 text-estate-700" />Row views and whole-row plans show several connected homes. Corner and middle layouts can share the same exterior illustration.</p>
      )}

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-8">
        <div className="space-y-6" role="group" aria-label="Designs in this collection">
          {groups.map((group) => (
            <div key={group.family || 'all'}>
              {grouped && <h3 className="mb-2 font-serif text-lg font-medium text-estate-700">{group.family || 'Other designs'}</h3>}
              <ul className="space-y-2">
                {group.designs.map((design) => {
                  const active = design.key === selected.key
                  const thumbnail = design.images[0]
                  return (
                    <li key={design.key}>
                      <button type="button" aria-pressed={active} aria-controls={`${id}-selected`} onClick={() => choose(design.key)}
                        className={cn('grid w-full grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-surface p-2 text-left transition-colors',
                          active ? 'border-estate-700 ring-1 ring-estate-700' : 'border-border hover:border-estate-700/50')}>
                        <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-estate-700/5">
                          {thumbnail && <Image src={thumbnail.src} alt="" fill unoptimized sizes="88px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 py-1">
                          <span className="block truncate text-sm font-semibold text-estate-700">{design.label}</span>
                          {designMeta(design) && <span className="mt-0.5 block text-xs text-muted-foreground">{designMeta(design)}</span>}
                          <span className="mt-1 block text-xs tabular-nums text-muted-foreground">{display.areaLabel} {formatArea(design.builtUpAreaSqFt)}</span>
                        </span>
                        <span className={cn('mr-2 flex size-6 items-center justify-center rounded-full border', active ? 'border-estate-700 bg-estate-700 text-white' : 'border-border text-transparent')} aria-hidden>
                          <Check className="size-3.5" />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div id={`${id}-selected`} className="mt-8 scroll-mt-24 rounded-3xl border border-border bg-surface p-4 sm:p-6 lg:mt-0" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="sc-eyebrow">Selected design</p>
              <h3 id="selected-design" ref={selectedHeadingRef} tabIndex={-1} className="mt-1 scroll-mt-28 font-serif text-2xl font-medium leading-tight text-estate-700 sm:text-3xl">{selected.label}</h3>
              {designMeta(selected) && <p className="mt-1 text-sm text-muted-foreground">{designMeta(selected)}</p>}
            </div>
          </div>
          {selected.summary && <p className="mt-4 text-sm leading-6 text-muted-foreground">{selected.summary}</p>}

          {/* Three plain next steps, side by side. None is a countdown or a reservation. */}
          <div className="mt-5 grid gap-2.5 sm:grid-cols-3" role="group" aria-label={`Next steps for ${selected.label}`}>
            <Link ref={ctaRef} href={requestHref(collection.slug, selected.key)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-estate-700 px-4 text-center text-sm font-semibold text-white hover:bg-estate-600">
              Request the brochure <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
            <a href={showcaseMailto(`Question — ${collection.title} — ${selected.label}`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-estate-700/25 px-4 text-center text-sm font-semibold text-estate-700 hover:bg-estate-700/5">
              <Mail aria-hidden className="size-4 shrink-0" /> Email a question
            </a>
            <a href={showcaseMailto(`Call request — ${collection.title} — ${selected.label}`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-estate-700/25 px-4 text-center text-sm font-semibold text-estate-700 hover:bg-estate-700/5">
              <Phone aria-hidden className="size-4 shrink-0" /> Email to arrange a call
            </a>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">The email links open your own email app addressed to {SHOWCASE_SALES_EMAIL}. The showcase itself sends nothing.</p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-subtle p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{display.areaLabel}</dt>
              <dd className="mt-1 font-serif text-2xl font-medium tabular-nums text-estate-700">{formatAreaDual(selected.builtUpAreaSqFt)}</dd>
              {display.areaSourceLabel && <dd className="mt-1 text-xs leading-5 text-muted-foreground">{display.areaSourceLabel}</dd>}
            </div>
            <div className="rounded-2xl bg-subtle p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Plot area</dt>
              <dd className="mt-1 font-serif text-2xl font-medium tabular-nums text-estate-700">{plotWithheld ? 'Withheld' : formatAreaDual(selected.plotAreaSqFt!)}</dd>
              <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                {plotWithheld
                  ? (selected.areaNote ?? 'The brochure’s plot table and diagram differ; the figure is withheld until reconciled.')
                  : (selected.areaNote ?? 'Brochure figure for this design, separate from built-up area.')}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Areas are design-level brochure figures, not an available-unit schedule. Square-metre figures are conversions. The brochure covers the whole collection; your design choice records your interest and does not reserve a home.</p>
          <ProvenanceLine provenance={display.provenance} className="mt-2" />

          <div className="mt-6"><ImageViews key={selected.key} images={selected.images} label="Design views" /></div>

          {selected.floorPlans.length > 0 && (
            <div className="mt-8">
              <h4 className="font-serif text-xl font-medium text-estate-700">Floor plans</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {selected.rowHomes ? `Whole-row plans show every home in the ${selected.rowHomes}-home row; this design is one ${selected.position ?? ''} home within it. Plans are shown uncropped.` : 'Plans are shown uncropped. Open the full-size file to zoom in.'}
              </p>
              <div className="mt-4 space-y-5">
                {selected.floorPlans.map((plan) => <PlanFigure key={plan.src} plan={plan} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {scheme && (
        <section className="mt-12 border-t border-border pt-10" aria-labelledby={`${id}-interiors`}>
          <p className="sc-eyebrow">Interior illustrations</p>
          <h3 id={`${id}-interiors`} className="sc-heading mt-2 text-estate-700">Palettes shown in the brochure</h3>
          {display.interiorNotice && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{display.interiorNotice}</p>}
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Brochure interior palettes">
            {interiorSchemes.map((item) => (
              <button key={item.key} type="button" aria-pressed={scheme.key === item.key} onClick={() => setSchemeKey(item.key)}
                className={cn('min-h-11 rounded-xl border px-4 text-sm font-medium', scheme.key === item.key ? 'border-estate-700 bg-estate-700 text-white' : 'border-border bg-surface text-estate-700 hover:border-estate-700/50')}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-5 max-w-4xl"><ImageViews key={scheme.key} images={scheme.images} label="Palette illustrations" /></div>
        </section>
      )}

      {/* Mobile action bar */}
      <div aria-hidden={barHidden} className={cn('sc-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden', barHidden && 'pointer-events-none translate-y-full')}>
        <div className="flex items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected</span>
            <span className="block truncate text-sm font-semibold text-estate-700">{selected.label}</span>
          </p>
          <Link href={requestHref(collection.slug, selected.key)} tabIndex={barHidden ? -1 : undefined} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-estate-700 px-4 text-sm font-semibold text-white">
            Request brochure <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
