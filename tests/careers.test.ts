import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { APPROVED_CAREER_ROLES, resolveCareerRole, resolveCareerRoles, isApprovedCareersPath } from '@/lib/career-roles'
import { APPLICATION_MAX_BYTES, CV_MAX_BYTES, normalizeApplicationUrl, validateCvFile } from '@/lib/careers'

const { cmsFetch, send } = vi.hoisted(() => ({ cmsFetch: vi.fn(), send: vi.fn() }))
vi.mock('@/sanity', () => ({ client: { fetch: cmsFetch } }))
vi.mock('resend', () => ({ Resend: class { emails = { send } } }))

import { getCareerRole, getCareerRoles } from '@/sanity/careers'
import { POST } from '@/app/api/applications/route'

function application() {
  const form = new FormData()
  for (const [key, value] of Object.entries({
    roleSlug: 'content-manager', roleTitle: 'A forged title', fullName: 'Test Applicant',
    email: 'applicant@example.test', phone: '+447700900000', yearsOfExperience: '1–3 years',
    consent: 'true', cvUrl: 'https://example.test/cv.pdf',
  })) form.set(key, value)
  return form
}

// Valid single-page PDF, with harmless comment padding for the reported size.
function pdf(size = 1000) {
  let text = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>']) {
    offsets.push(text.length)
    text += `${offsets.length - 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = text.length
  text += `xref\n0 4\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n`
  const ending = '\n%%EOF\n'
  return new File([text, '%', 'x'.repeat(Math.max(0, size - text.length - ending.length - 1)), ending], 'synthetic-portfolio.pdf', { type: 'application/pdf' })
}

async function submit(form = application(), headers?: HeadersInit) {
  return POST(new Request('http://localhost/api/applications', { method: 'POST', body: form, headers }))
}

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_synthetic_test_only')
  vi.stubEnv('CAREERS_INTAKE_ENABLED', 'true')
  vi.stubEnv('CAREERS_EMAIL', '')
  cmsFetch.mockReset().mockResolvedValue(null)
  send.mockReset().mockResolvedValue({ data: { id: 'synthetic-email' }, error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

describe('approved September reopening roles', () => {
  it('lists exactly the approved roles and supplied terms, without invented briefs', () => {
    const roles = resolveCareerRoles([])
    expect(roles.map(role => role.title)).toEqual([
      'Lettings Specialist - UK Nationwide - Self Employed',
      'Sales Specialist - UK Nationwide - Self Employed',
      'Real Estate Agent - UK Nationwide - Self Employed',
      'Content Writer', 'Video Content Creator', 'Graphic Designer', 'Content Manager',
      'Content Strategist', 'Social Media Account Manager (Intern)',
    ])
    expect(roles.every(role => !role.summary)).toBe(true)
    expect(roles.slice(0, 3).every(role => role.location === 'UK Nationwide' && role.employmentType === 'Self Employed')).toBe(true)
    expect(roles.slice(3, 8).every(role => !role.location && !role.employmentType)).toBe(true)
    expect(roles[8].employmentType).toBe('Internship')
    expect(roles[8].location).toBeUndefined()
    expect([...new Set(roles.map(role => role.department))]).toEqual(['Lettings Agent', 'Sales Agent', 'Career Experience Openings'])
  })

  it('allows the index and reviewed role paths while rejecting every retired or unknown path', () => {
    for (const { slug } of APPROVED_CAREER_ROLES) {
      expect(isApprovedCareersPath(`/careers/${slug}`)).toBe(true)
      expect(isApprovedCareersPath(`/careers/${slug}/`)).toBe(true)
    }
    expect(isApprovedCareersPath('/careers')).toBe(true)
    expect(isApprovedCareersPath('/careers/')).toBe(true)
    for (const path of ['/careers/content-managers', '/careers/real-estate-agents', '/careers/unknown', '/careers/content-manager/extra', '/Careers', '/careers-news', '/bad%escape']) {
      expect(isApprovedCareersPath(path)).toBe(false)
    }
  })

  it('rejects all previous five vacancies and speculative intake, even when delivery is enabled', async () => {
    for (const slug of ['content-managers', 'real-estate-agents', 'pr-interns', 'videographers', 'lead-generators', 'general-speculative']) {
      expect(resolveCareerRole(slug)).toBeNull()
      const form = application(); form.set('roleSlug', slug)
      expect((await submit(form)).status).toBe(400)
    }
    expect(cmsFetch).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })
  it('hides every preserved legacy seed record and prevents API acceptance', async () => {
    const records = readFileSync('scripts/roles.ndjson', 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(records).toHaveLength(8)
    for (const record of records) {
      expect(record.status).toBe('closed')
      expect(resolveCareerRole(record.slug.current, record)).toBeNull()
      const form = application(); form.set('roleSlug', record.slug.current)
      const response = await submit(form)
      expect(response.status).toBe(400)
      expect((await response.json()).errors.roleSlug).toContain('current opportunity')
    }
    expect(send).not.toHaveBeenCalled()
  })
  it('honours CMS closure and draft status over the fallback', async () => {
    for (const status of ['closed', 'draft']) {
      cmsFetch.mockResolvedValue({ ...APPROVED_CAREER_ROLES.find(({ slug }) => slug === 'content-manager'), _id: 'role', status })
      expect(await getCareerRole('content-manager')).toBeNull()
      expect((await submit()).status).toBe(400)
    }
  })
  it('uses published CMS data and propagates outages instead of reopening roles', async () => {
    cmsFetch.mockResolvedValue([])
    expect(await getCareerRoles()).toHaveLength(9)
    expect(cmsFetch.mock.calls[0][2]).toEqual({ perspective: 'published' })
    cmsFetch.mockRejectedValue(new Error('synthetic CMS outage'))
    await expect(getCareerRole('content-manager')).rejects.toThrow()
    await expect(getCareerRoles()).rejects.toThrow()
    expect((await submit()).status).toBe(503)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('CV and portfolio handling', () => {
  it('submits links with whitespace trimmed and canonical role title to HR', async () => {
    const form = application()
    form.set('portfolioUrl', '  https://example.test/portfolio.pdf?view=1&download=0  ')
    const response = await submit(form)
    expect(await response.json()).toEqual({ ok: true, confirmationSent: true })
    const message = send.mock.calls[0][0]
    expect(message.to).toBe('hr@hausofestate.com')
    expect(message.subject).toContain('Content Manager')
    expect(message.subject).not.toContain('forged')
    expect(message.html).toContain('https://example.test/cv.pdf')
    expect(message.html).toContain('https://example.test/portfolio.pdf?view=1&amp;download=0')
    expect(message.attachments).toBeUndefined()
  })
  it('includes a valid small PDF attachment and does not require a CV link', async () => {
    const form = application(); form.delete('cvUrl'); const file = pdf(); form.set('cv', file)
    expect((await submit(form)).status).toBe(200)
    expect(send.mock.calls[0][0].attachments[0].content).toBe(Buffer.from(await file.arrayBuffer()).toString('base64'))
  })
  it('requires a CV file or link even when a portfolio link is provided', async () => {
    const form = application(); form.delete('cvUrl'); form.set('portfolioUrl', 'https://example.test/portfolio')
    expect((await (await submit(form)).json()).errors.cv).toContain('CV sharing link')
    expect(send).not.toHaveBeenCalled()
  })
  it('rejects unsafe, malformed and incomplete URLs consistently', async () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'example.test/file.pdf', 'https://', 'https://user:password@example.test/file']) {
      expect(normalizeApplicationUrl(url)).toBeNull()
      const form = application(); form.set('portfolioUrl', url)
      expect((await (await submit(form)).json()).errors.portfolioUrl).toBeTruthy()
    }
    expect(send).not.toHaveBeenCalled()
  })
  it('rejects a 13.8MB PDF in browser validation and bounded multipart API parsing', async () => {
    const file = pdf(13_800_000)
    expect(file.size).toBe(13_800_000)
    expect(validateCvFile(file)).toContain('4MB or smaller')
    const form = application(); form.set('cv', file)
    expect((await submit(form)).status).toBe(413)
    expect((await submit(form, { 'content-length': '13800000' })).status).toBe(413)
    expect(cmsFetch).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })
  it('bounds total multipart size, not only the file size', async () => {
    const form = application(); form.set('fullName', 'x'.repeat(APPLICATION_MAX_BYTES))
    expect((await submit(form)).status).toBe(413)
    expect(send).not.toHaveBeenCalled()
  })
  it('validates file size boundaries and type even when MIME is absent', async () => {
    expect(validateCvFile({ name: 'CV.PDF', type: '', size: CV_MAX_BYTES })).toBeUndefined()
    expect(validateCvFile({ name: 'CV.PDF', type: '', size: CV_MAX_BYTES + 1 })).toContain('4MB')
    for (const file of [new File(['script'], 'bad.exe'), new File(['script'], 'bad.pdf', { type: 'text/html' })]) {
      const form = application(); form.set('cv', file)
      expect((await (await submit(form)).json()).errors.cv).toContain('PDF, DOC or DOCX')
    }
    expect(send).not.toHaveBeenCalled()
  })
  it('does not silently discard attempted portfolio attachments', async () => {
    const form = application(); form.set('portfolio', pdf())
    const response = await submit(form)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.portfolioUrl).toContain('sharing link')
    expect(send).not.toHaveBeenCalled()
  })
})

describe('email acceptance', () => {
  it('uses the configured recruitment inbox consistently for delivery and failure guidance', async () => {
    vi.stubEnv('CAREERS_EMAIL', ' recruitment@example.test ')
    const { getCareersInbox } = await import('@/lib/careers-settings')
    expect(getCareersInbox()).toBe('recruitment@example.test')
    expect((await submit()).status).toBe(200)
    expect(send.mock.calls[0][0].to).toBe('recruitment@example.test')
    expect(send.mock.calls[1][0].html).not.toContain('two working days')
    send.mockResolvedValue({ data: null, error: { message: 'synthetic rejection' } })
    expect((await (await submit()).json()).error).toContain('recruitment@example.test')
  })

  it('does not report success or confirm when the provider rejects the HR email', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'synthetic rejection' } })
    expect((await submit()).status).toBe(502)
    expect(send).toHaveBeenCalledTimes(1)
  })
  it('rejects a provider response without a message ID', async () => {
    send.mockResolvedValue({ data: null, error: null })
    expect((await submit()).status).toBe(502)
  })
  it('does not suggest a duplicate application when only confirmation fails', async () => {
    send.mockResolvedValueOnce({ data: { id: 'team-accepted' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'confirmation failed' } })
    expect(await (await submit()).json()).toEqual({ ok: true, confirmationSent: false })
  })
  it('fails explicitly without a configured email service', async () => {
    vi.resetModules(); vi.stubEnv('RESEND_API_KEY', '')
    const { POST: unconfiguredPost } = await import('@/app/api/applications/route')
    expect((await unconfiguredPost(new Request('http://localhost/api/applications', { method: 'POST', body: application() }))).status).toBe(502)
    expect(send).not.toHaveBeenCalled()
  })
})
