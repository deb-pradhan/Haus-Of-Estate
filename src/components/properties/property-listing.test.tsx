import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyListing } from './property-listing'

const controls = vi.hoisted(() => ({
  draftMode: vi.fn(),
  fetch: vi.fn(),
  save: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: controls.draftMode }))
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
})
