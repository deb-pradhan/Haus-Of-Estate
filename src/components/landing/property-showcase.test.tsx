import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyShowcase } from './property-showcase'

const controls = vi.hoisted(() => ({
  fetch: vi.fn(),
  image: vi.fn(),
  save: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: false }) }))
vi.mock('@/sanity/live', () => ({ sanityFetch: controls.fetch }))
vi.mock('@/sanity', async () => {
  const { createImageUrlBuilder } = await import('@sanity/image-url')
  const builder = createImageUrlBuilder({ projectId: 'testproject', dataset: 'production' })
  return { urlFor: (source: Parameters<typeof builder.image>[0]) => builder.image(source) }
})
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; className?: string }) => {
    controls.image(props)
    return createElement('img', { src: props.src, alt: props.alt, className: props.className })
  },
}))
vi.mock('@/components/saved-content', () => ({
  SaveContentButton: (props: unknown) => { controls.save(props); return null },
}))
vi.mock('@/components/lead-modal/open-buyer-button', () => ({
  OpenBuyerButton: ({ children }: { children: ReactNode }) => createElement('button', null, children),
}))

const property = {
  _id: 'london-property',
  title: 'London apartment',
  slug: 'london-apartment',
  community: 'London',
  city: 'London',
  unitType: 'Apartment',
  summary: 'A London apartment.',
  listingType: ['sale'],
}

// An editorial crop and hotspot must never remove part of a concept board.
const featuredImage = {
  asset: { _type: 'reference', _ref: 'image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1600x900-jpg' },
  alt: 'London apartment interiors',
  crop: { top: 0.1, bottom: 0.1, left: 0.2, right: 0.2 },
  hotspot: { x: 0.65, y: 0.5, width: 0.2, height: 0.2 },
}

beforeEach(() => {
  controls.fetch.mockResolvedValue({ data: [{ ...property, featuredImage }] })
})

describe('featured property media', () => {
  it.each([
    ['concept', 'Proposed interiors — AI-assisted concept; not completed works'],
    ['concept-comparison', 'Existing view and proposed interiors — AI-assisted concept; not completed works'],
  ])('preserves the complete %s board and visibly identifies proposed work', async (mediaKind, caption) => {
    controls.fetch.mockResolvedValue({ data: [{ ...property, featuredImage: { ...featuredImage, mediaKind } }] })

    const html = renderToStaticMarkup(await PropertyShowcase())
    const image = controls.image.mock.calls[0][0]
    const source = new URL(image.src)

    expect(source.searchParams.get('w')).toBe('800')
    expect(source.searchParams.get('fit')).toBe('max')
    expect(source.searchParams.has('h')).toBe(false)
    expect(source.searchParams.has('rect')).toBe(false)
    expect(image.className).toContain('object-contain')
    expect(image.className).not.toContain('scale-')
    expect(html).toMatch(/<figure>.*<figcaption[^>]*>.*<\/figcaption><\/figure>/)
    expect(html).toContain(caption)
    expect(html).toContain('href="/properties/london-apartment"')
    expect(html).toContain('Find me something like this')
    expect(controls.save).toHaveBeenCalledWith(expect.objectContaining({ sanityDocumentId: property._id }))
  })

  it('shows the supplied concept caption when present', async () => {
    const caption = 'Existing room beside proposed interiors — AI-assisted concept; not completed works'
    controls.fetch.mockResolvedValue({ data: [{
      ...property,
      featuredImage: { ...featuredImage, mediaKind: 'concept-comparison', caption },
    }] })

    const html = renderToStaticMarkup(await PropertyShowcase())

    expect(html).toMatch(new RegExp(`<figcaption[^>]*>${caption}</figcaption>`))
  })

  it('retains the ordinary photograph crop and hover treatment without a concept caption', async () => {
    const html = renderToStaticMarkup(await PropertyShowcase())
    const image = controls.image.mock.calls[0][0]
    const source = new URL(image.src)

    expect(source.searchParams.get('w')).toBe('800')
    expect(source.searchParams.get('h')).toBe('600')
    expect(source.searchParams.has('rect')).toBe(true)
    expect(source.searchParams.has('fit')).toBe(false)
    expect(image.className).toContain('object-cover')
    expect(image.className).toContain('group-hover:scale-105')
    expect(image.alt).toBe(featuredImage.alt)
    expect(html).not.toContain('<figcaption')
    expect(html).not.toContain('AI-assisted concept')
  })
})
