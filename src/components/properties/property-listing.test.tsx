import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyListing } from './property-listing'

const controls = vi.hoisted(() => ({
  draftMode: vi.fn(),
  fetch: vi.fn(),
  save: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: controls.draftMode }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))
vi.mock('@/components/saved-content', () => ({
  SaveContentButton: (props: unknown) => { controls.save(props); return null },
}))
vi.mock('@/lib/features', () => ({ isPropertyAssistantEnabled: () => false }))

beforeEach(() => {
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
})
