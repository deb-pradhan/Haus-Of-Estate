import { describe, expect, it } from 'vitest'

import { getSanityRevalidationTargets } from './revalidation'

describe('getSanityRevalidationTargets', () => {
  it('revalidates property lists plus current and previous detail URLs', () => {
    const targets = getSanityRevalidationTargets({
      _id: 'drafts.property-1',
      _type: 'property',
      slug: 'new-slug',
      previousSlug: 'old-slug',
    })

    expect(targets?.paths).toEqual(
      expect.arrayContaining([
        { path: '/' },
        { path: '/properties' },
        { path: '/properties/new-slug' },
        { path: '/properties/old-slug' },
        { path: '/sitemap.xml' },
      ]),
    )
    expect(targets?.tags).toContain('sanity:property:property-1')
  })

  it('never interprets a malformed slug as a path', () => {
    const targets = getSanityRevalidationTargets({
      _type: 'post',
      slug: '../../api/revalidate',
      previousSlug: 'https://example.com',
    })

    expect(targets?.paths).toEqual([
      { path: '/' },
      { path: '/blog' },
      { path: '/sitemap.xml' },
    ])
  })

  it('rejects unknown document types', () => {
    expect(
      getSanityRevalidationTargets({ _type: 'socialCampaign', slug: 'launch' }),
    ).toBeNull()
  })

  it('fans taxonomy changes out to the bounded article page pattern', () => {
    expect(
      getSanityRevalidationTargets({ _type: 'category', _id: 'category-1' })
        ?.paths,
    ).toEqual([
      { path: '/blog' },
      { path: '/blog/[slug]', type: 'page' },
    ])
  })
})
