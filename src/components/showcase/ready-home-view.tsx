import Link from 'next/link'
import { ArrowRight, Check, Mail } from 'lucide-react'
import { showcaseImageCaption } from '@/lib/showcase/captions'
import { showcasePath, showcasePropertyPath } from '@/lib/showcase/access'
import type { ShowcaseProperty } from '@/lib/showcase/fixture'
import { Breadcrumbs, FactGrid, FixtureImage, Notice, PlanFigure, SectionHeading, TextBlocks } from './primitives'

const SALES_EMAIL = 'sales@hausofestate.com'

export function ReadyHomeView({ home }: { home: ShowcaseProperty }) {
  const heroCaption = showcaseImageCaption(home.media.hero)
  const area = home.sizeDisplay?.replace(/^Approx\. Gross Internal Floor Area:\s*/i, '')
  const mailto = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Enquiry — ${home.title}`)}`
  return (
    <article>
      <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6">
        <Breadcrumbs items={[{ label: 'Showcase', href: showcasePath() }, { label: 'Find a home', href: showcasePath('/properties') }, { label: home.title }]} />
      </div>
      <section className="mx-auto max-w-7xl px-4 pt-3 md:px-6" aria-labelledby="home-title">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <div>
            <figure className="overflow-hidden rounded-3xl border border-border bg-surface">
              <div className="relative aspect-[3/2] bg-[#f3efe6]">
                <FixtureImage image={home.media.hero} fit="contain" sizes="(min-width: 1024px) 760px, 100vw" preload />
              </div>
              {heroCaption && <figcaption className="border-t border-border px-4 py-3 text-sm leading-6 text-estate-700">{heroCaption}</figcaption>}
            </figure>
            {home.display.imageNotice && <Notice className="mt-4">{home.display.imageNotice}</Notice>}
          </div>
          <div>
            <p className="sc-eyebrow">Ready home · {[home.community, home.city, home.country].join(', ')}</p>
            <h1 id="home-title" className="sc-title mt-3 text-estate-700">{home.title}</h1>
            {home.price && (
              <p className="mt-5 flex flex-wrap items-baseline gap-x-3">
                <span className="font-serif text-4xl font-semibold tabular-nums text-estate-700">{home.price.display}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Asking price</span>
              </p>
            )}
            <p className="mt-4 text-base leading-7 text-muted-foreground">{home.summary}</p>
            <FactGrid className="mt-6 sm:grid-cols-2" items={[
              ...(typeof home.bedrooms === 'number' ? [{ label: 'Bedrooms', value: String(home.bedrooms) }] : []),
              { label: 'Type', value: home.unitType },
              ...(area ? [{ label: home.display.areaLabel, value: area, note: 'Internal floor area, not plot size. Measurements are approximate.' }] : []),
              { label: 'Location', value: [home.community, home.city].join(', '), note: 'Broad area only; the road and postcode are not published here.' },
            ]} />
            <Notice className="mt-5">{home.display.inventoryNotice}</Notice>
            <div className="mt-6 rounded-3xl border border-border bg-surface p-5">
              <p className="font-serif text-xl font-medium text-estate-700">Ask about this home</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">No brochure is supplied for this home. This link opens your own email app addressed to the sales team; the showcase itself sends nothing.</p>
              <a href={mailto} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-estate-700 px-5 text-sm font-semibold text-white hover:bg-estate-600">
                <Mail aria-hidden className="size-4" /> Email {SALES_EMAIL}
              </a>
              <Link href={showcasePropertyPath('azizi-florence')} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-medium text-estate-700 underline underline-offset-4">
                Compare with the Florence designs <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {home.media.gallery.length > 0 && (
        <section className="sc-section px-4 md:px-6" aria-labelledby="home-gallery-title">
          <div className="mx-auto max-w-7xl">
            <SectionHeading id="home-gallery-title" eyebrow="Before and after" title="Existing views and proposed interiors" intro="Panels marked BEFORE show the supplied existing views. Panels marked AFTER are AI-assisted proposals, not completed works or confirmation of what is included in the sale." />
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {home.media.gallery.map((image) => (
                <li key={image.src}>
                  <figure className="overflow-hidden rounded-2xl border border-border bg-surface">
                    <div className="relative aspect-[4/3] bg-[#f3efe6]"><FixtureImage image={image} fit="contain" sizes="(min-width: 1024px) 600px, 100vw" /></div>
                    <figcaption className="px-4 py-3 text-sm leading-6 text-estate-700">{showcaseImageCaption(image)}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="px-4 md:px-6" aria-labelledby="home-details-title">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <SectionHeading id="home-details-title" eyebrow="About this home" title="Details supplied with the listing" />
            <TextBlocks blocks={home.description} className="mt-6" />
          </div>
          {home.keyFeatures.length > 0 && (
            <div>
              <h3 className="font-serif text-xl font-medium text-estate-700">Key features</h3>
              <ul className="mt-4 space-y-2.5">
                {home.keyFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/85"><Check aria-hidden className="mt-1 size-4 shrink-0 text-estate-700" />{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {home.floorPlans.length > 0 && (
        <section className="sc-section px-4 md:px-6" aria-labelledby="home-plan-title">
          <div className="mx-auto max-w-4xl">
            <SectionHeading id="home-plan-title" eyebrow="Floor plan" title={home.floorPlans.length === 1 ? 'Supplied floor plan' : 'Supplied floor plans'} intro="Shown uncropped. Open the full-size file to zoom in." />
            <div className="mt-6 space-y-6">
              {home.floorPlans.map((plan) => <PlanFigure key={plan.src} plan={plan} headingLevel="h3" />)}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
