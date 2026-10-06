import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { loadPropertyPreviews, type PropertyPreview } from '@/lib/property-previews'
import PropertyPreviewsPage from './page'

vi.mock('@/lib/property-previews', () => ({ loadPropertyPreviews: vi.fn() }))
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => createElement('img', { src, alt, className }),
}))

const london: PropertyPreview = {
  kind: 'property',
  document: {
    _id: 'drafts.north-london-three-bedroom',
    _type: 'property',
    title: '3-bedroom property for sale in North London',
    slug: { _type: 'slug', current: 'north-london-three-bedroom' },
    community: 'North London',
    city: 'London',
    country: 'United Kingdom',
    bedrooms: 3,
    summary: 'A three-bedroom property offered for sale in North London.',
  },
  media: {
    hero: { src: '/comparison.jpg', alt: 'Existing view and proposed interiors', mediaKind: 'concept-comparison' },
    gallery: [],
  },
}

describe('local property preview index', () => {
  it('shows a London-only bundle without Florence claims and labels the complete concept image', async () => {
    vi.mocked(loadPropertyPreviews).mockResolvedValue([london])
    const html = renderToStaticMarkup(await PropertyPreviewsPage())

    expect(html).toContain('Property draft previews</h1>')
    expect(html).toContain('Individual property drafts')
    expect(html).toContain('3-bedroom property for sale in North London')
    expect(html).toContain('Existing view and proposed interiors — AI-assisted concept; not completed works</figcaption>')
    expect(html).toContain('class="object-contain"')
    expect(html).toContain('href="/dev/property-previews/north-london-three-bedroom"')
    expect(html).not.toContain('Florence')
    expect(html).not.toContain('Clusters')
    expect(html).not.toContain('Villas')
  })

  it('retains the Florence overview and home-type sections alongside individual drafts', async () => {
    const overview: PropertyPreview = {
      ...london,
      kind: 'development',
      document: { ...london.document, _id: 'drafts.florence', title: 'Azizi Florence', slug: { _type: 'slug', current: 'azizi-florence' } },
    }
    const villa: PropertyPreview = {
      ...overview,
      kind: 'home-type',
      document: { ...overview.document, _id: 'drafts.florence-villas', unitType: 'Villa', bedrooms: 4, slug: { _type: 'slug', current: 'florence-villas' } },
    }
    vi.mocked(loadPropertyPreviews).mockResolvedValue([overview, villa, london])
    const html = renderToStaticMarkup(await PropertyPreviewsPage())

    expect(html).toContain('Azizi Florence</h1>')
    expect(html).toContain('Explore the community')
    expect(html).toContain('Find your home at Florence')
    expect(html).toContain('4-bedroom villas')
    expect(html).toContain('Individual property drafts')
  })
})
