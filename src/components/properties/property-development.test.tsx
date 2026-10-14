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
