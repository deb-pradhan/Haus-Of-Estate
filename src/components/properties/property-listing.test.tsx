import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyListing } from './property-listing'
import { generateMetadata } from '@/app/(main)/properties/page'
import type { PropertyPreview } from '@/lib/property-previews'
import { PROPERTIES_FILTERED_QUERY } from '@/sanity/queries'

const controls = vi.hoisted(() => ({
  draftMode: vi.fn(),
  fetch: vi.fn(),
  save: vi.fn(),
  previews: vi.fn(),
  assistant: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: controls.draftMode }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))
vi.mock('@/components/saved-content', () => ({
  SaveContentButton: (props: unknown) => { controls.save(props); return null },
}))
vi.mock('@/components/property-assistant/property-assistant-search-entry', () => ({
  PropertyAssistantSearchEntry: () => { controls.assistant(); return null },
}))
vi.mock('@/lib/features', () => ({ isPropertyAssistantEnabled: () => true }))
vi.mock('@/lib/property-catalogue-preview', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/property-catalogue-preview')>(),
  loadCataloguePreviewGroups: controls.previews,
}))

const overview: PropertyPreview = {
  kind: 'development',
  document: {
    _id: 'drafts.local-florence',
    _type: 'property',
    title: 'Azizi Florence',
    slug: { _type: 'slug', current: 'azizi-florence' },
    community: 'Florence',
    city: 'Sharjah',
    country: 'United Arab Emirates',
    summary: 'Florence community overview for editorial review.',
  },
  media: { hero: { src: '/dev/property-previews/media/florence.jpg', alt: 'Florence community artist impression' }, gallery: [] },
}

const homes: PropertyPreview[] = [
  { unitType: 'Villa', bedrooms: 4, priceAmount: 5_000_000 },
  { unitType: 'Villa', bedrooms: 5, priceAmount: 6_000_000 },
  { unitType: 'Townhouse', bedrooms: 3, priceAmount: 3_000_000 },
].map((home) => ({
  ...overview,
  kind: 'home-type',
  document: {
    ...overview.document,
    ...home,
    _id: `drafts.local-${home.bedrooms}-${home.unitType}`,
    title: `Unpublished ${home.bedrooms}-bedroom ${home.unitType} collection`,
    priceCurrency: 'AED',
    priceDisplay: `AED ${home.priceAmount.toLocaleString('en-GB')} · Clusters 1 & 2`,
  },
}))

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', '')
  controls.previews.mockResolvedValue([{ overview, homes }])
  controls.draftMode.mockResolvedValue({ isEnabled: false })
  controls.fetch.mockResolvedValue({ data: [{
    // Draft perspective normalizes native draft IDs to this published ID shape.
    _id: 'florence-preview-id',
    title: 'Florence villas',
    slug: 'florence-villas',
    community: 'Florence',
    city: 'Sharjah',
    unitType: 'Villa',
    summary: 'Four-bedroom villa designs.',
  }] })
})
afterEach(() => vi.unstubAllEnvs())

describe('property catalogue draft isolation', () => {
  it('keeps saving available on the public catalogue', async () => {
    const html = renderToStaticMarkup(await PropertyListing({ params: {} }))
    expect(html).toContain('Florence villas')
    expect(html).not.toContain('Sanity draft preview')
    expect(controls.save).toHaveBeenCalledWith(expect.objectContaining({
      sanityDocumentId: 'florence-preview-id',
    }))
  })

  it('labels draft content and suppresses saves even for normalized IDs', async () => {
    controls.draftMode.mockResolvedValue({ isEnabled: true })
    const html = renderToStaticMarkup(await PropertyListing({ params: {} }))
    expect(html).toContain('Florence villas')
    expect(html).toContain('Sanity draft preview')
    expect(controls.save).not.toHaveBeenCalled()
  })

  it('treats Studio as exactly zero bedrooms while retaining minimum-bedroom searches', async () => {
    const base = { community: 'Test community', city: 'Dubai', unitType: 'Apartment', summary: 'Test listing' }
    controls.fetch.mockResolvedValue({ data: [
      { ...base, _id: 'studio', slug: 'studio', title: 'Canal Studio', bedrooms: 0 },
      { ...base, _id: 'family', slug: 'family', title: 'Family Apartment', bedrooms: 3 },
    ] })
    const studio = renderToStaticMarkup(await PropertyListing({ params: { beds: '0' } }))
    expect(studio).toContain('Canal Studio')
    expect(studio).not.toContain('Family Apartment')
    const family = renderToStaticMarkup(await PropertyListing({ params: { beds: '2' } }))
    expect(family).toContain('Family Apartment')
    expect(family).not.toContain('Canal Studio')
  })

  it('removes monthly budgets with the rental intent chip', async () => {
    const html = renderToStaticMarkup(await PropertyListing({ params: {
      intent: 'rent', minPrice: '500', maxPrice: '1000', currency: 'GBP', country: 'United Kingdom',
    } }))
    const href = html.match(/<a[^>]*href="([^"]*)"[^>]*>To rent</)?.[1]
    expect(href).toBeDefined()
    const url = new URL(href!.replaceAll('&amp;', '&'), 'https://hausofestate.com')
    expect(url.searchParams.get('country')).toBe('United Kingdom')
    for (const key of ['intent', 'minPrice', 'maxPrice', 'currency']) {
      expect(url.searchParams.has(key)).toBe(false)
    }
  })

  it('groups local Florence collections into one community preview above the published cards', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', 'true')
    const html = renderToStaticMarkup(await PropertyListing({ params: {} }))

    expect(html).toContain('Local catalogue preview')
    expect(html).toContain('Unpublished editorial collections')
    expect(html).toContain('1 unpublished community preview')
    expect(html).toContain('1 published listing')
    expect(html.match(/href="\/dev\/property-previews"/g)).toHaveLength(1)
    expect(html).toContain('Villas</dt>')
    expect(html).toContain('Townhouses</dt>')
    expect(html).toContain('5,000,000')
    expect(html).toContain('3,000,000')
    expect(html).not.toContain('6,000,000')
    expect(html).toContain('Clusters 1 &amp; 2')
    expect(html).not.toContain('Unpublished 4-bedroom Villa collection')
    expect(html.indexOf('Azizi Florence')).toBeLessThan(html.indexOf('Florence villas'))
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.assistant).not.toHaveBeenCalled()
    expect(controls.fetch).toHaveBeenCalledWith({
      query: PROPERTIES_FILTERED_QUERY,
      params: { category: '', availability: '', intent: '', type: '' },
    })
    expect(controls.previews).toHaveBeenCalledWith(expect.objectContaining({ intent: undefined }))
  })

  it.each([
    ['production', 'true'],
    ['development', ''],
  ])('does not load local groups in %s when preview flag is "%s"', async (nodeEnv, flag) => {
    vi.stubEnv('NODE_ENV', nodeEnv)
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', flag)
    const html = renderToStaticMarkup(await PropertyListing({ params: {} }))

    expect(html).not.toContain('Local catalogue preview')
    expect(html).not.toContain('Azizi Florence')
    expect(html).not.toContain('href="/dev/property-previews"')
    expect(controls.previews).not.toHaveBeenCalled()
    expect(controls.save).toHaveBeenCalled()
    expect(controls.assistant).toHaveBeenCalled()
    expect(generateMetadata().robots).toBeUndefined()
    expect(generateMetadata().alternates).toEqual({ canonical: '/properties' })
  })

  it('qualifies empty published results while a matching community preview is shown', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', 'true')
    controls.fetch.mockResolvedValue({ data: [] })
    const html = renderToStaticMarkup(await PropertyListing({ params: { city: 'Sharjah' } }))

    expect(html).toContain('No published listings match your filters')
    expect(html).toContain('1 unpublished community preview')
    expect(html).toContain('0 published listings')
    expect(html).toContain('Azizi Florence')
  })

  it('sets noindex and nofollow only on the guarded local catalogue', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', 'true')
    expect(generateMetadata().robots).toEqual({
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    })
    expect(generateMetadata().title).toBe('Properties')
  })

  it('does not invent a starting price or cluster scope when collection pricing is incomplete', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', 'true')
    controls.previews.mockResolvedValue([{ overview, homes: homes.filter(({ document }) => document.unitType === 'Villa').map((home, index) => ({
      ...home,
      document: { ...home.document, priceAmount: index === 0 ? undefined : home.document.priceAmount, priceDisplay: undefined },
    })) }])
    const html = renderToStaticMarkup(await PropertyListing({ params: {} }))

    expect(html).toContain('Pricing awaiting confirmation')
    expect(html).not.toContain('6,000,000')
    expect(html).not.toContain('Clusters 1 &amp; 2')
  })
})
