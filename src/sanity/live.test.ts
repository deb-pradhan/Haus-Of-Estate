import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSanityRevalidationTargets } from './revalidation'

const { liveFetch } = vi.hoisted(() => ({ liveFetch: vi.fn() }))
vi.mock('./client', () => ({ client: {} }))
vi.mock('next-sanity/live', () => ({
  defineLive: () => ({ sanityFetch: liveFetch, SanityLive: () => null }),
}))

import { sanityFetch } from './live'

describe('Sanity publication cache contract', () => {
  beforeEach(() => {
    liveFetch.mockReset()
  })

  it('tags cached query results with a tag invalidated by the publication webhook', async () => {
    const data = [{ title: 'Published community' }]
    liveFetch.mockResolvedValue({ data })
    const query = '*[_type == "property" && slug.current == $slug]'
    const params = { slug: 'azizi-florence' }

    expect(await sanityFetch({ query, params })).toEqual({ data })
    expect(liveFetch).toHaveBeenCalledWith({ query, params, stega: false, tags: ['sanity'] })

    const cachedTags = liveFetch.mock.calls[0][0].tags as string[]
    const invalidatedTags = getSanityRevalidationTargets({
      _type: 'property', _id: 'property-collection', slug: 'collection',
    })!.tags
    expect(cachedTags.some((tag) => invalidatedTags.includes(tag))).toBe(true)
  })
})
