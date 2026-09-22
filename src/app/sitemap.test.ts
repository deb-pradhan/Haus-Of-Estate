import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), careersEnabled: true }))
vi.mock('@/sanity/client', () => ({ client: { fetch: mocks.fetch } }))
vi.mock('@/lib/careers-availability', () => ({ get CAREERS_PUBLIC_ENABLED() { return mocks.careersEnabled } }))

const content = (slug: string, _updatedAt?: string | null) => ({ _id: slug, title: slug, slug, status: 'published', _updatedAt })

beforeEach(() => {
  vi.resetModules()
  mocks.fetch.mockReset()
  mocks.fetch.mockResolvedValue([])
  mocks.careersEnabled = true
  vi.stubEnv('LEAD_INTAKE_ENABLED', 'false')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('public XML sitemap', () => {
  it('uses saved content dates without inventing static-page or job revision dates', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'))
    mocks.fetch
      .mockResolvedValueOnce([content('buying-guide', '2026-09-01T10:00:00.000Z')])
      .mockResolvedValueOnce([content('example-property', '2026-09-05T15:30:00.000Z')])
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()
    expect(entries.find((entry) => entry.url.endsWith('/blog/buying-guide'))?.lastModified).toEqual(new Date('2026-09-01T10:00:00.000Z'))
    expect(entries.find((entry) => entry.url.endsWith('/properties/example-property'))?.lastModified).toEqual(new Date('2026-09-05T15:30:00.000Z'))
    expect(entries.filter((entry) => entry.lastModified)).toHaveLength(2)
    expect(entries.some(({ url }) => url.endsWith('/mortgage-calculator'))).toBe(true)
    expect(entries.some(({ url }) => url.endsWith('/sitemap'))).toBe(true)
    expect(entries.every(({ url }) => url.startsWith('https://hausofestate.com/'))).toBe(true)
  })

  it('keeps published URLs with missing or invalid modification dates', async () => {
    mocks.fetch
      .mockResolvedValueOnce([content('without-date'), content('invalid-date', 'not-a-date')])
      .mockResolvedValueOnce([content('empty-date', ''), content('null-date', null)])
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()
    for (const path of ['/blog/without-date', '/blog/invalid-date', '/properties/empty-date', '/properties/null-date']) {
      expect(entries.find(({ url }) => url.endsWith(path))).toBeDefined()
    }
    expect(entries.every((entry) => !('lastModified' in entry))).toBe(true)
  })

  it('excludes drafts, future releases, invalid slugs and duplicates in both sitemap sources', async () => {
    mocks.fetch.mockResolvedValueOnce([
      content('public-article'), content('public-article'),
      { ...content('held-article'), status: 'draft' },
      { ...content('native-draft'), _id: 'drafts.native-draft' },
      { ...content('normalized-draft'), _originalId: 'drafts.normalized-draft' },
      { ...content('future-release'), _id: 'versions.release.future-release' },
      content('../account'), content('bad?token=secret'),
    ])
    const { getPublicSitemap } = await import('@/lib/public-sitemap')
    const result = await getPublicSitemap()
    expect(result.posts.map(({ slug }) => slug)).toEqual(['public-article'])
    for (const call of mocks.fetch.mock.calls) {
      expect(call[2]).toMatchObject({ perspective: 'published', stega: false })
    }
    expect(result.pages.some(({ path }) => /^\/(auth|account|studio|api|dev)(\/|$)/.test(path))).toBe(false)
  })

  it('respects the shared approved-role resolver and explicit vacancy closures', async () => {
    const { APPROVED_CAREER_ROLES } = await import('@/lib/career-roles')
    const [closed, held] = APPROVED_CAREER_ROLES
    mocks.fetch.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([
      { ...closed, _id: 'closed-role', status: 'closed' },
      { ...held, _id: 'held-role', status: 'draft' },
      { _id: 'unapproved', slug: 'unapproved-vacancy', title: 'Unapproved vacancy', status: 'open' },
    ])
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()
    expect(entries.some(({ url }) => url.endsWith('/careers'))).toBe(true)
    expect(entries.some(({ url }) => url.endsWith(`/careers/${closed.slug}`))).toBe(false)
    expect(entries.some(({ url }) => url.endsWith(`/careers/${held.slug}`))).toBe(false)
    expect(entries.some(({ url }) => url.endsWith('/careers/unapproved-vacancy'))).toBe(false)
    expect(entries.filter(({ url }) => /\/careers\/.+/.test(url))).toHaveLength(APPROVED_CAREER_ROLES.length - 2)
  })

  it('omits recruitment entirely while the public careers switch is off', async () => {
    mocks.careersEnabled = false
    const { default: sitemap } = await import('./sitemap')
    expect((await sitemap()).some(({ url }) => url.includes('/careers'))).toBe(false)
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
  })

  it('renders public titles as usable HTML links without held content', async () => {
    mocks.fetch.mockResolvedValueOnce([
      { ...content('public-guide'), title: 'A published buying guide' },
      { ...content('held-guide'), title: 'Held editorial draft', status: 'draft' },
    ]).mockResolvedValueOnce([{ ...content('public-home'), title: 'A published home' }])
    const { default: page } = await import('./(main)/sitemap/page')
    const html = renderToStaticMarkup(await page())
    expect(html).toContain('href="/blog/public-guide"')
    expect(html).toContain('A published buying guide')
    expect(html).toContain('href="/properties/public-home"')
    expect(html).toContain('A published home')
    expect(html).not.toContain('Held editorial draft')
    expect(html).not.toContain('/blog/held-guide')
  })

  it.each(['true', 'false'])('preserves lead-page availability when intake is %s and CMS is unavailable', async (enabled) => {
    vi.stubEnv('LEAD_INTAKE_ENABLED', enabled)
    mocks.fetch.mockRejectedValue(new Error('CMS unavailable'))
    const { default: sitemap } = await import('./sitemap')
    const entries = await sitemap()
    expect(entries.some(({ url }) => url.endsWith('/list-property'))).toBe(true)
    for (const path of ['/register-interest', '/enquire']) {
      expect(entries.some(({ url }) => url.endsWith(path))).toBe(enabled === 'true')
    }
    expect(entries.some(({ url }) => /\/careers\/.+/.test(url))).toBe(false)
    expect(entries.every((entry) => !('lastModified' in entry))).toBe(true)
  })
})
