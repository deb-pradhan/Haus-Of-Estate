import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropertyPreview, PropertyPreviewDocument } from './property-previews'
import { isLocalCataloguePreviewEnabled, loadCataloguePreviewGroups } from './property-catalogue-preview'
import { GET } from '../app/api/property-locations/route'

const controls = vi.hoisted(() => ({ previews: vi.fn(), fetch: vi.fn() }))
vi.mock('./property-previews', () => ({ loadPropertyPreviews: controls.previews }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))

function preview(kind: PropertyPreview['kind'], slug: string, fields: Partial<PropertyPreviewDocument> = {}): PropertyPreview {
  return {
    kind,
    document: {
      _id: 'drafts.' + slug, _type: 'property', title: 'Orchard Grove',
      slug: { _type: 'slug', current: slug }, community: 'Orchard Grove', city: 'Sharjah',
      country: 'United Arab Emirates', category: 'residential', summary: 'Editorial property collection.',
      ...fields,
    },
    media: { hero: { src: '/dev/property-previews/media/' + slug + '.jpg', alt: 'Development rendering' }, gallery: [] },
  }
}

let previews: PropertyPreview[]
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', 'true')
  previews = [preview('development', 'orchard')]
  for (const [index, [unitType, bedrooms]] of ([['Villa', 4], ['Villa', 5], ['Villa', 6],
    ['Townhouse', 3], ['Townhouse', 4]] as const).entries()) {
    previews.push(preview('home-type', 'orchard-home-' + index, {
      title: `Orchard Grove ${bedrooms}-bedroom ${unitType}`, unitType, bedrooms,
      priceAmount: (index + 1) * 100000, priceCurrency: 'AED',
    }))
  }
  controls.previews.mockResolvedValue(previews)
  controls.fetch.mockResolvedValue({ data: [{ country: 'United Kingdom', city: 'London' }] })
})

afterEach(() => vi.unstubAllEnvs())

describe('local catalogue preview groups', () => {
  it.each([
    ['production', 'true'], ['test', 'true'], ['development', 'false'], ['development', 'TRUE'], ['development', ''],
  ])('never loads local drafts in %s with flag %s', async (mode, flag) => {
    vi.stubEnv('NODE_ENV', mode)
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', flag)
    expect(isLocalCataloguePreviewEnabled()).toBe(false)
    expect(await loadCataloguePreviewGroups()).toEqual([])
    expect(controls.previews).not.toHaveBeenCalled()
  })

  it('returns one development with its five homes and preserves unset sale and availability fields', async () => {
    const before = JSON.stringify(previews)
    const groups = await loadCataloguePreviewGroups({ category: 'residential', intent: 'sale' })
    expect(groups).toEqual([{ overview: previews[0], homes: previews.slice(1) }])
    expect(JSON.stringify(previews)).toBe(before)
    expect(groups[0].overview.document).not.toHaveProperty('listingType')
    expect(groups[0].homes[0].document).not.toHaveProperty('availability')
  })

  it('joins by community, city and country, excluding individual properties and unrelated homes', async () => {
    previews.push(preview('home-type', 'other-city', { city: 'Dubai' }))
    previews.push(preview('home-type', 'other-country', { country: 'United Kingdom' }))
    previews.push(preview('home-type', 'other-community', { community: 'Another Grove' }))
    previews.push(preview('property', 'individual'))
    previews.push(preview('home-type', 'same-location', {
      community: ' orchard   grove ', city: ' SHARJAH ', country: ' united arab emirates ',
    }))
    const groups = await loadCataloguePreviewGroups()
    expect(groups).toHaveLength(1)
    expect(groups[0].homes.map(({ document }) => document.slug.current)).toEqual([
      'orchard-home-0', 'orchard-home-1', 'orchard-home-2', 'orchard-home-3', 'orchard-home-4', 'same-location',
    ])
  })

  it.each([
    { availability: 'ready' }, { availability: 'off-plan' }, { intent: 'rent' },
    { category: 'commercial' }, { country: 'United Kingdom' }, { city: 'Dubai' },
    { location: 'Dubai' }, { beds: '7' }, { beds: '0' }, { type: 'Apartment' }, { q: 'unrelated' },
  ])('excludes unsupported collection filters %j', async (params) => {
    expect(await loadCataloguePreviewGroups(params)).toEqual([])
  })

  it('filters homes by country, city, legacy location, type and minimum bedrooms', async () => {
    const groups = await loadCataloguePreviewGroups({ country: ' united arab emirates ', city: 'SHARJAH',
      location: 'Orchard Grove', type: 'Townhouse', beds: '4' })
    expect(groups).toHaveLength(1)
    expect(groups[0].overview).toBe(previews[0])
    expect(groups[0].homes).toEqual([previews[5]])
  })

  it('uses shared keyword and source-currency budget matching for collection homes', async () => {
    const villas = await loadCataloguePreviewGroups({ q: 'ORCHARD villa', maxPrice: '200000', currency: 'AED' })
    expect(villas[0].homes).toEqual(previews.slice(1, 3))
    const exact = await loadCataloguePreviewGroups({ minPrice: '200000', maxPrice: '200000', currency: 'AED' })
    expect(exact[0].homes).toEqual([previews[2]])
    expect(await loadCataloguePreviewGroups({ maxPrice: '200000', currency: 'GBP' })).toEqual([])
    expect(await loadCataloguePreviewGroups({ maxPrice: '0', currency: 'AED' })).toEqual([])
  })

  it('can show a matching overview alone and returns no groups for absent bundles', async () => {
    previews[0].document.title = 'Community masterplan'
    expect(await loadCataloguePreviewGroups({ q: 'masterplan' })).toEqual([{ overview: previews[0], homes: [] }])
    controls.previews.mockResolvedValue([])
    expect(await loadCataloguePreviewGroups()).toEqual([])
  })
})

describe('local catalogue geography isolation', () => {
  it('merges draft geography through the existing hierarchy with private no-store responses', async () => {
    controls.fetch.mockResolvedValue({ data: [
      { country: 'United Kingdom', city: 'London' },
      { country: 'United Arab Emirates', city: 'Dubai' },
      { country: 'United Arab Emirates', city: 'SHARJAH' },
    ] })
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
    expect(await response.json()).toEqual({ locations: [
      { country: 'United Arab Emirates', cities: ['Dubai', 'SHARJAH'] },
      { country: 'United Kingdom', cities: ['London'] },
    ] })
  })

  it.each(['production', 'development'])('keeps normal %s responses unchanged with the preview disabled', async (mode) => {
    vi.stubEnv('NODE_ENV', mode)
    vi.stubEnv('HAUS_LOCAL_PROPERTY_CATALOGUE_PREVIEW', mode === 'production' ? 'true' : 'false')
    const response = await GET()
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=300')
    expect(response.headers.has('x-robots-tag')).toBe(false)
    expect(await response.json()).toEqual({ locations: [{ country: 'United Kingdom', cities: ['London'] }] })
    expect(controls.previews).not.toHaveBeenCalled()
  })

  it('can use verified local geography if Sanity is unavailable, without changing the production failure', async () => {
    controls.fetch.mockResolvedValue({ data: null })
    const local = await GET()
    expect(local.status).toBe(200)
    expect(await local.json()).toEqual({ locations: [{ country: 'United Arab Emirates', cities: ['Sharjah'] }] })
    vi.stubEnv('NODE_ENV', 'production')
    const production = await GET()
    expect(production.status).toBe(503)
    expect(production.headers.has('cache-control')).toBe(false)
    expect(await production.json()).toEqual({ error: 'Property locations are temporarily unavailable.' })
  })

  it('marks local failed responses no-store too', async () => {
    controls.fetch.mockResolvedValue({ data: null })
    controls.previews.mockResolvedValue([])
    const response = await GET()
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
})
