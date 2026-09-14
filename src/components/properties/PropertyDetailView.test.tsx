import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LeadOpenOptions, LeadProjectContext } from '@/components/lead-eoi/types'
import { PropertyDetailView, type PropertyDetail } from './PropertyDetailView'
import PropertyDetailPage from '@/app/(main)/properties/[slug]/page'

const controls = vi.hoisted(() => ({
  save: vi.fn(),
  share: vi.fn(),
  project: vi.fn(),
  lead: vi.fn(),
  draftMode: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: controls.draftMode }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))
vi.mock('@/sanity', () => ({ urlFor: vi.fn() }))
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
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
    expect(controls.save).not.toHaveBeenCalled()
    expect(controls.share).not.toHaveBeenCalled()
    expect(controls.project).not.toHaveBeenCalled()
    expect(controls.lead).not.toHaveBeenCalled()
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
