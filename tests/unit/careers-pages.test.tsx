import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { APPROVED_CAREER_ROLES } from '@/lib/career-roles'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), draft: false }))
vi.mock('@/sanity/live', () => ({ sanityFetch: mocks.fetch }))
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: mocks.draft }) }))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
vi.mock('@/components/blog', () => ({ PortableTextRenderer: () => null }))
vi.mock('@/components/careers/application-form', () => ({
  ApplicationForm: ({ applyEmail }: { applyEmail: string }) => createElement('form', { 'data-application-form': true }, applyEmail),
}))

import CareersPage from '@/app/(main)/careers/page'
import RolePage, { generateMetadata, generateStaticParams } from '@/app/(main)/careers/[slug]/page'

beforeEach(() => {
  mocks.fetch.mockReset().mockResolvedValue({ data: [] })
  mocks.draft = false
  vi.stubEnv('CAREERS_INTAKE_ENABLED', 'false')
  vi.stubEnv('CAREERS_EMAIL', 'recruitment@example.test')
})
afterEach(() => vi.unstubAllEnvs())

describe('public careers pages', () => {
  it('renders nine approved opportunities grouped as supplied without retired copy or invented terms', async () => {
    const html = renderToStaticMarkup(await CareersPage())
    for (const { slug, title } of APPROVED_CAREER_ROLES) {
      expect(html).toContain(`href="/careers/${slug}"`)
      expect(html).toContain(title)
    }
    for (const heading of ['Lettings Agent', 'Sales Agent', 'Career Experience Openings']) expect(html).toContain(heading)
    expect(html).toContain('Online applications are not open yet')
    expect(html).toContain('mailto:recruitment@example.test')
    expect(html).not.toMatch(/Life at HoE|7721|Advisory|Full.time|Part.time|two working days|data-application-form/)
  })

  it('shows unavailability on CMS failure instead of reviving title fallbacks', async () => {
    mocks.fetch.mockResolvedValue({ data: null })
    const html = renderToStaticMarkup(await CareersPage())
    expect(html).toContain('cannot load current opportunities')
    expect(html).not.toContain('href="/careers/content-writer"')
  })

  it('shows honest intake status and the configured mailbox on a title-only vacancy', async () => {
    mocks.fetch.mockResolvedValue({ data: { role: null } })
    const html = renderToStaticMarkup(await RolePage({ params: Promise.resolve({ slug: 'content-writer' }) }))
    expect(html).toContain('Content Writer')
    expect(html).toContain('Full role details will be added here')
    expect(html).toContain('Online applications are not open yet')
    expect(html).toContain('mailto:recruitment@example.test')
    expect(html).not.toMatch(/data-application-form|Apply for this role|two working days|JobPosting/)
  })

  it('renders the form only when intake is enabled and never for editorial preview', async () => {
    vi.stubEnv('CAREERS_INTAKE_ENABLED', 'true')
    const role = { ...APPROVED_CAREER_ROLES[3], _id: 'role', status: 'open', applyEmail: 'legacy@example.test' }
    mocks.fetch.mockResolvedValue({ data: { role } })
    const props = { params: Promise.resolve({ slug: 'content-writer' }) }
    const html = renderToStaticMarkup(await RolePage(props))
    expect(html).toContain('data-application-form')
    expect(html).toContain('recruitment@example.test')
    expect(html).not.toContain('legacy@example.test')
    mocks.draft = true
    expect(renderToStaticMarkup(await RolePage(props))).not.toContain('data-application-form')
  })

  it('rejects retired and closed roles in pages and metadata and omits closures from generated paths', async () => {
    const retired = { params: Promise.resolve({ slug: 'content-managers' }) }
    await expect(RolePage(retired)).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(generateMetadata(retired)).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mocks.fetch).not.toHaveBeenCalled()
    const closed = { ...APPROVED_CAREER_ROLES[3], _id: 'role', status: 'closed' }
    mocks.fetch.mockResolvedValue({ data: { role: closed } })
    const props = { params: Promise.resolve({ slug: closed.slug }) }
    await expect(RolePage(props)).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(generateMetadata(props)).rejects.toThrow('NEXT_NOT_FOUND')
    mocks.fetch.mockResolvedValue({ data: [closed] })
    const paths = await generateStaticParams()
    expect(paths).toHaveLength(8)
    expect(paths).not.toContainEqual({ slug: closed.slug })
  })
})
