import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LeadOpenOptions, LeadProjectContext } from '@/components/lead-eoi/types'
import { PropertyDetailView, type PropertyDetail, type PropertyMedia } from './PropertyDetailView'
import PropertyDetailPage from '@/app/(main)/properties/[slug]/page'

const controls = vi.hoisted(() => ({
  save: vi.fn(),
  share: vi.fn(),
  project: vi.fn(),
  lead: vi.fn(),
  openLead: vi.fn(),
  draftMode: vi.fn(),
  fetch: vi.fn(),
  urlFor: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: controls.draftMode }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))
vi.mock('@/sanity', () => ({ urlFor: controls.urlFor }))
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => createElement('img', { src, alt, className }),
}))
vi.mock('@/components/blog', () => ({ PortableTextRenderer: () => null }))
vi.mock('@/components/saved-content', () => ({
  SaveContentButton: (props: unknown) => { controls.save(props); return null },
}))
vi.mock('@/components/share/content-share', () => ({
  ContentShare: (props: unknown) => { controls.share(props); return null },
}))
vi.mock('@/components/lead-eoi/lead-project-context', () => ({
  LeadProjectContextRegistration: ({ project }: { project: LeadProjectContext }) => {
    controls.project(project)
    return null
  },
}))
vi.mock('@/components/lead-eoi/lead-eoi-trigger', () => ({
  LeadEoiTrigger: ({ options, children }: { options: LeadOpenOptions; children: ReactNode }) => {
    controls.lead(options)
    return createElement('button', null, children)
  },
}))
vi.mock('@/components/lead-eoi/lead-eoi-controller', () => ({
  useLeadEoi: () => ({ enabled: true, openLead: controls.openLead }),
}))

const property: PropertyDetail = {
  _id: 'property-florence',
  title: 'Azizi Florence',
  slug: 'azizi-florence',
  community: 'Azizi Venice',
  city: 'Dubai',
  country: 'United Arab Emirates',
  summary: 'Florence community overview.',
  listingType: ['sale'],
  availability: ['off-plan'],
  amenities: ['Community pool'],
}

const media = {
  hero: { src: '/dev/property-previews/media/florence.jpg', alt: 'Florence rendering' },
  gallery: [{ src: '/dev/property-previews/media/interior.jpg', alt: 'Florence interior' }],
}

beforeEach(() => {
  vi.stubEnv('PURCHASE_READINESS_ENABLED', 'true')
  controls.draftMode.mockResolvedValue({ isEnabled: false })
  controls.fetch.mockResolvedValue({ data: property })
})
afterEach(() => vi.unstubAllEnvs())

describe('shared property details', () => {
  it('preserves a Monaco-style property without designs, including its original media, sizes and public actions', () => {
    const monaco: PropertyDetail = {
      ...property,
      _id: 'property-monaco',
      title: 'Azizi Monaco Mansions',
      slug: 'azizi-monaco-mansions',
      unitType: 'Villa',
      sizeDisplay: 'Size supplied by listing',
      plotSizeDisplay: 'Plot supplied by listing',
    }
    const monacoMedia = {
      hero: { src: '/monaco-exterior.jpg', alt: 'Monaco exterior' },
      gallery: [{ src: '/monaco-interior.jpg', alt: 'Monaco interior' }],
    }
    const html = renderToStaticMarkup(<PropertyDetailView property={monaco} media={monacoMedia} />)

    expect(html).toContain('src="/monaco-exterior.jpg"')
    expect(html).toContain('src="/monaco-interior.jpg"')
    expect(html).toContain('Size supplied by listing')
    expect(html).toContain('Plot supplied by listing')
    expect(html).not.toContain('Home designs')
    expect(html).not.toContain('Varies by design')
    expect(html).not.toContain('Request full brochure')
    expect(controls.save).toHaveBeenCalledWith(expect.objectContaining({ sanityDocumentId: monaco._id }))
    expect(controls.share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://hausofestate.com/properties/azizi-monaco-mansions' }))
    expect(controls.lead).toHaveBeenCalledWith(expect.objectContaining({ project: expect.objectContaining({ slug: monaco.slug }) }))
  })

  it.each(['local', 'sanity'] as const)('shows matched collection designs and hides disputed plot figures while disabling brochure requests in %s preview', (previewKind) => {
    const collection: PropertyDetail = {
      ...property,
      sizeDisplay: 'Old collection size',
      plotSizeDisplay: 'Old collection plot',
      designVariants: [{
        _key: 'type-a',
        label: 'Brochure Type A',
        plotAreaStatus: 'conflict',
        plotAreaSqFt: 2260,
        sellableAreaSqFt: 2660,
        images: [{ src: '/type-a-exterior.jpg', alt: 'Type A exterior' }],
        floorPlans: [{ src: '/type-a-plan.jpg', alt: 'Type A floor plan', label: 'Ground and first floor' }],
      }, {
        _key: 'type-b',
        label: 'Brochure Type B',
        plotAreaSqFt: 3363,
        sellableAreaSqFt: 3714,
        images: [{ src: '/type-b-exterior.jpg', alt: 'Type B exterior' }],
        floorPlans: [],
      }],
    }
    const html = renderToStaticMarkup(
      <PropertyDetailView
        property={collection}
        media={media}
        preview={previewKind === 'local' ? { kind: 'home-type' } : undefined}
        draftPreview={previewKind === 'sanity'}
      />,
    )

    expect(html.match(/<img[^>]+src="([^"]+)"/)?.[1]).toBe('/type-a-exterior.jpg')
    expect(html).not.toContain(media.hero.src)
    expect(html).not.toContain(media.gallery[0].src)
    expect(html).toContain('Home designs')
    expect(html).toContain('Varies by design')
    expect(html).not.toContain('Old collection size')
    expect(html).not.toContain('Old collection plot')
    expect(html).toContain('Brochure Type A')
    expect(html).toContain('Brochure Type B')
    expect(html).toContain('Plot area')
    expect(html).toContain('Built-up area')
    expect(html).toContain('2,660 sq ft')
    expect(html).toContain('Awaiting confirmation')
    expect(html).not.toContain('2,260')
    expect(html).not.toContain('2260')
    expect(html).toContain('href="/type-a-plan.jpg" target="_blank"')
    expect(html).toMatch(/<button\b[^>]*disabled=""[^>]*>Request full brochure<\/button>/)
    expect(controls.openLead).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
  })

  it('keeps existing photos unbranded and preserves their sources when a listing opts into the logo', () => {
    const original = renderToStaticMarkup(<PropertyDetailView property={property} media={media} />)
    const branded = renderToStaticMarkup(
      <PropertyDetailView property={{ ...property, showHausLogo: true }} media={media} />,
    )
    const disabled = renderToStaticMarkup(
      <PropertyDetailView property={{ ...property, showHausLogo: false }} media={media} />,
    )

    expect(original).not.toContain('src="/logo.svg"')
    expect(disabled).not.toContain('src="/logo.svg"')
    expect(branded.match(/src="\/logo.svg"/g)).toHaveLength(2)
    for (const image of [media.hero, ...media.gallery]) {
      expect(branded).toContain(`src="${image.src}"`)
      expect(branded).toContain(`alt="${image.alt}"`)
    }
    expect(branded).toContain('Enquire about this property')
  })

  it('preserves published saves, canonical sharing, property enquiries and purchase guidance', () => {
    const html = renderToStaticMarkup(<PropertyDetailView property={property} media={media} />)

    expect(controls.save).toHaveBeenCalledWith(expect.objectContaining({
      sanityDocumentId: property._id,
      contentType: 'PROPERTY',
    }))
    expect(controls.share).toHaveBeenCalledTimes(2)
    expect(controls.share).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://hausofestate.com/properties/azizi-florence',
    }))
    expect(controls.project).toHaveBeenCalledWith(expect.objectContaining({ slug: property.slug }))
    expect(controls.lead).toHaveBeenCalledWith(expect.objectContaining({
      interest: 'buy',
      project: expect.objectContaining({ slug: property.slug, title: property.title }),
    }))
    expect(html).toContain('How protected payment works')
    expect(html).toContain('Dubai off-plan purchase')
    expect(html).toContain('href="/mortgage-calculator"')
  })

  it('keeps Florence local previews editorial, including image media and unconfirmed details', () => {
    const html = renderToStaticMarkup(
      <PropertyDetailView property={property} media={media} preview={{ kind: 'home-type' }} />,
    )

    expect(html).toContain('Local draft preview')
    expect(html).toContain('Awaiting confirmation')
    expect(html).toContain('View the Florence community overview')
    expect(html).toContain('Community amenities')
    expect(html).toContain(media.hero.src)
    expect(html).toContain(media.gallery[0].src)
    expect(html).toContain('Enquiries disabled in preview')
    expect(html).not.toContain('How protected payment works')
    expect(html).not.toContain('href="/mortgage-calculator"')
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.project).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
  })

  it('labels a London property draft honestly and keeps complete concept comparisons visible', () => {
    const london: PropertyDetail = {
      _id: 'drafts.north-london-three-bedroom',
      title: '3-bedroom property for sale in North London',
      slug: 'north-london-three-bedroom',
      community: 'North London',
      city: 'London',
      country: 'United Kingdom',
      summary: 'A three-bedroom property offered for sale in North London.',
      listingType: ['sale'],
      bedrooms: 3,
    }
    const conceptMedia: PropertyMedia = {
      hero: { src: '/london-concept.jpg', alt: 'Living room proposal', mediaKind: 'concept', caption: 'Living room — AI-assisted proposed interiors; not completed works' },
      gallery: [{ src: '/london-comparison.jpg', alt: 'Existing living room beside a proposed interior', mediaKind: 'concept-comparison' }],
    }
    const html = renderToStaticMarkup(<PropertyDetailView property={london} media={conceptMedia} preview={{ kind: 'property' }} />)

    expect(html).toContain('For sale')
    expect(html).toContain('Awaiting confirmation: asking price, exact address, property type, floor area, tenure and EPC.')
    expect(html).toContain('Living room — AI-assisted proposed interiors; not completed works</p>')
    expect(html).toContain('Existing view and proposed interiors — AI-assisted concept; not completed works</figcaption>')
    expect(html.match(/class="object-contain"/g)).toHaveLength(2)
    expect(html).not.toContain('Florence')
    expect(html).not.toContain('Master community')
    expect(html).not.toContain('Handover')
    expect(html).not.toContain('Payment plan')
    expect(html).toContain('Enquiries disabled in preview')
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.project).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
  })

  it('preserves concept captions and full images when mapping Sanity media to the property view', async () => {
    const builder = {
      ignoreImageParams: vi.fn().mockReturnThis(),
      width: vi.fn().mockReturnThis(),
      height: vi.fn().mockReturnThis(),
      fit: vi.fn().mockReturnThis(),
      url: vi.fn().mockReturnValue('/resolved-concept.jpg'),
    }
    controls.urlFor.mockReturnValue(builder)
    controls.fetch.mockResolvedValue({ data: {
      ...property,
      featuredImage: { alt: 'Proposal', caption: 'Proposed interior — AI-assisted concept; not completed works', mediaKind: 'concept' },
      gallery: [{ alt: 'Comparison', mediaKind: 'concept-comparison' }],
    } })
    const page = await PropertyDetailPage({ params: Promise.resolve({ slug: property.slug }) })
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Proposed interior — AI-assisted concept; not completed works</p>')
    expect(html).toContain('Existing view and proposed interiors — AI-assisted concept; not completed works</figcaption>')
    expect(html.match(/class="object-contain"/g)).toHaveLength(2)
    expect(builder.ignoreImageParams).toHaveBeenCalledTimes(2)
    expect(builder.height).not.toHaveBeenCalled()
    expect(builder.fit).toHaveBeenCalledWith('max')
  })

  it.each(['drafts.property-florence', 'versions.release.property-florence'])(
    'does not expose public actions for an unpublished Sanity ID (%s)',
    (_id) => {
      const html = renderToStaticMarkup(<PropertyDetailView property={{ ...property, _id }} media={media} />)
      expect(html).toContain('Enquiries disabled in preview')
      expect(html).not.toContain('How protected payment works')
      expect(controls.save).not.toHaveBeenCalled()
      expect(controls.share).not.toHaveBeenCalled()
      expect(controls.project).not.toHaveBeenCalled()
      expect(controls.lead).not.toHaveBeenCalled()
    },
  )

  it('passes Draft Mode through the page even when Sanity normalizes the document ID', async () => {
    controls.draftMode.mockResolvedValue({ isEnabled: true })
    const page = await PropertyDetailPage({ params: Promise.resolve({ slug: property.slug }) })
    const html = renderToStaticMarkup(page)
    expect(html).toContain('Sanity preview')
    expect(html).toContain('Enquiries disabled in preview')
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
  })

  it('keeps rent-only enquiries while omitting purchase guidance', () => {
    const html = renderToStaticMarkup(
      <PropertyDetailView property={{ ...property, listingType: ['rent'] }} media={media} />,
    )
    expect(html).not.toContain('How protected payment works')
    expect(html).not.toContain('href="/mortgage-calculator"')
    expect(controls.lead).toHaveBeenCalledWith(expect.objectContaining({ interest: 'rent' }))
    expect(controls.save).toHaveBeenCalled()
  })

  it('respects the purchase-readiness feature flag', () => {
    vi.stubEnv('PURCHASE_READINESS_ENABLED', 'false')
    const html = renderToStaticMarkup(<PropertyDetailView property={property} media={media} />)
    expect(html).not.toContain('How protected payment works')
    expect(controls.lead).toHaveBeenCalledTimes(1)
  })
})
