import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PropertyDevelopmentCard, PropertyDevelopmentShowcase } from './property-development'
import type { PropertyDevelopment } from '@/lib/property-developments'

vi.mock('@/sanity', async () => {
  const { createImageUrlBuilder } = await import('@sanity/image-url')
  const builder = createImageUrlBuilder({ projectId: 'testproject', dataset: 'production' })
  return { urlFor: (source: Parameters<typeof builder.image>[0]) => builder.image(source) }
})
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}))

const overview: PropertyDevelopment = {
  _id: 'florence', title: 'Azizi Florence', slug: 'azizi-florence', unitType: 'Development',
  community: 'Florence', city: 'Sharjah', country: 'United Arab Emirates', summary: 'Community overview.', collections: [],
}

describe('public development presentation', () => {
  it('sizes matched design thumbnails and retains their label on public collection links', () => {
    const development = { ...overview, collections: [{
      ...overview, _id: 'villa', title: 'Four-bedroom villas', slug: 'florence-villas', unitType: 'Villa', bedrooms: 4,
      masterDevelopment: overview.title, priceAmount: 3_350_000, priceCurrency: 'AED', priceDisplay: 'Clusters 1 & 2',
      designImage: { src: 'https://cdn.sanity.io/images/testproject/production/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1600x900.jpg', alt: 'Villa rendering', label: 'Four-bedroom Type A' },
    }] }
    const html = renderToStaticMarkup(<PropertyDevelopmentShowcase development={development} />)
    const source = new URL(html.match(/<img[^>]*src="([^"]+)"/)![1].replaceAll('&amp;', '&'))
    expect(source.searchParams.get('w')).toBe('1120')
    expect(source.searchParams.get('h')).toBe('746')
    expect(html).toContain('Shown: Four-bedroom Type A')
    expect(html).toContain('href="/properties/florence-villas"')
    expect(html).toContain('current availability are confirmed on enquiry')
  })

  it('keeps overview-only cards useful without a blank or invented price', () => {
    const html = renderToStaticMarkup(<PropertyDevelopmentCard development={overview} />)
    expect(html).toContain('Community overview.')
    expect(html).toContain('Explore community and home designs')
    expect(html).not.toContain('<dl')
    expect(html).not.toContain('From ')
    expect(html).not.toContain('Clusters')
  })
})

describe('merged live price wording and community hero', () => {
  const villa = {
    ...overview, _id: 'villa', title: 'Four-bedroom villas', slug: 'florence-villas', unitType: 'Villa', bedrooms: 4,
    masterDevelopment: overview.title, priceAmount: 3_350_000, priceCurrency: 'AED',
  }

  it('keeps a single collection’s supplied range and scope instead of recomputing a starting price', () => {
    const development = { ...overview, collections: [{ ...villa, priceDisplay: 'AED 3,350,000–5,115,000 · Clusters 1 & 2' }] }
    const html = renderToStaticMarkup(<PropertyDevelopmentShowcase development={development} />)
    expect(html).toContain('3,350,000–5,115,000 · Clusters 1 &amp; 2')
    expect(html).toContain('href="/currency/uae-dirham.png"')
    expect(html).not.toContain('Pricing on enquiry')
  })

  it('treats a scope-only note as a qualifier, never as the price', () => {
    const development = { ...overview, collections: [{ ...villa, priceDisplay: 'Clusters 1 & 2' }] }
    const html = renderToStaticMarkup(<PropertyDevelopmentShowcase development={development} />)
    expect(html).toContain('From ')
    expect(html).toContain('3,350,000')
    expect(html).toContain('Clusters 1 &amp; 2')
  })

  it('shows one title under a wide hero with its caption, and keeps preview links inside the preview', () => {
    const development = { ...overview, collections: [villa] }
    const hero = { src: '/hero.jpg', alt: 'Community masterplan', caption: 'Artist’s impression of the masterplan.' }
    const html = renderToStaticMarkup(<PropertyDevelopmentShowcase development={development} hero={hero} />)
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toContain('aspect-[16/9] max-h-[520px]')
    expect(html).toContain('Artist’s impression of the masterplan.')
    expect(html).toContain('id="villas"')

    const preview = renderToStaticMarkup(<PropertyDevelopmentShowcase development={development} preview basePath="/dev/florence-preview" />)
    expect(preview).toContain('href="/dev/florence-preview/florence-villas"')
    expect(renderToStaticMarkup(<PropertyDevelopmentCard development={development} basePath="/dev/florence-preview" />))
      .toContain('href="/dev/florence-preview/azizi-florence"')
  })
})
