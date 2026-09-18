import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ sanityFetch: vi.fn() }))
vi.mock('@/sanity/live', () => ({ sanityFetch: mocks.sanityFetch }))

beforeEach(() => {
  vi.resetModules()
  mocks.sanityFetch.mockReset()
  vi.stubEnv('LEAD_INTAKE_ENABLED', 'false')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('sitemap content modification dates', () => {
  it('uses the saved content dates instead of the sitemap generation time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'))
    mocks.sanityFetch
      .mockResolvedValueOnce({ data: [{ slug: 'buying-guide', _updatedAt: '2026-09-01T10:00:00.000Z' }] })
      .mockResolvedValueOnce({ data: [{ slug: 'example-property', _updatedAt: '2026-09-05T15:30:00.000Z' }] })
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()

    expect(entries.find((entry) => entry.url.endsWith('/blog/buying-guide'))?.lastModified)
      .toEqual(new Date('2026-09-01T10:00:00.000Z'))
    expect(entries.find((entry) => entry.url.endsWith('/properties/example-property'))?.lastModified)
      .toEqual(new Date('2026-09-05T15:30:00.000Z'))
    expect(entries.filter((entry) => entry.lastModified)).toHaveLength(2)
  })

  it('keeps URLs with missing or invalid dates without inventing a lastModified value', async () => {
    mocks.sanityFetch
      .mockResolvedValueOnce({ data: [{ slug: 'without-date' }, { slug: 'invalid-date', _updatedAt: 'not-a-date' }] })
      .mockResolvedValueOnce({ data: [{ slug: 'empty-date', _updatedAt: '' }, { slug: 'null-date', _updatedAt: null }] })
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()

    for (const path of ['/blog/without-date', '/blog/invalid-date', '/properties/empty-date', '/properties/null-date']) {
      const entry = entries.find((candidate) => candidate.url.endsWith(path))
      expect(entry).toBeDefined()
      expect(entry).not.toHaveProperty('lastModified')
    }
    expect(entries.every((entry) => !('lastModified' in entry))).toBe(true)
  })

  it.each(['true', 'false'])('preserves lead-page availability when intake is %s and the CMS is unavailable', async (enabled) => {
    vi.stubEnv('LEAD_INTAKE_ENABLED', enabled)
    mocks.sanityFetch.mockRejectedValue(new Error('CMS unavailable'))
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()

    expect(entries.some((entry) => entry.url.endsWith('/list-property'))).toBe(true)
    for (const path of ['/register-interest', '/enquire']) {
      expect(entries.some((entry) => entry.url.endsWith(path))).toBe(enabled === 'true')
    }
    expect(entries.every((entry) => !('lastModified' in entry))).toBe(true)
  })
})
