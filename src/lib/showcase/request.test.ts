import { describe, expect, it } from 'vitest'
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION, leadIntakeV2Schema } from '@/lib/lead-intake/contract'
import { buildSimulatedBrochureRequest, SIMULATED_DOWNLOAD_HREF, validateSimulatedBrochureFields } from './request'

const base = {
  project: { slug: 'azizi-florence-4-bedroom-townhouses', title: 'Azizi Florence — 4-Bedroom Townhouses' },
  design: { id: 'spada-4-home-corner', label: 'Spada - 4-home row - corner', brochureKey: 'townhouse-3-4br' },
  contact: { firstName: 'Sample', email: 'Sample.Buyer@Example.com', phone: '', message: '' },
  privacyAcknowledged: true,
  propertyMatchOptIn: false,
  newsletterOptIn: false,
  pagePath: '/showcase/properties/azizi-florence-4-bedroom-townhouses/request',
}

describe('simulated brochure request', () => {
  it('requires a name, a valid email and the privacy acknowledgement', () => {
    expect(validateSimulatedBrochureFields({ ...base, contact: { firstName: ' ', email: 'not-an-email' }, privacyAcknowledged: false })).toEqual({
      firstName: 'Enter your first name.',
      email: 'Enter a valid email address.',
      privacyAcknowledged: 'Confirm that you have read and understood the privacy notice.',
    })
    expect(validateSimulatedBrochureFields({ ...base, contact: { ...base.contact, phone: 'abc' } })).toEqual({
      phone: 'Enter a valid phone number or leave this blank.',
    })
    const refused = buildSimulatedBrochureRequest({ ...base, privacyAcknowledged: false })
    expect(refused.ok).toBe(false)
  })

  it('produces a contract-valid payload with marketing left off by default', () => {
    const result = buildSimulatedBrochureRequest({ ...base, submissionId: '0b0f6f84-9f7a-4b5c-8d4e-1e2f3a4b5c6d' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(leadIntakeV2Schema.safeParse(result.payload).success).toBe(true)
    expect(result.payload).toMatchObject({
      interest: 'buy',
      project: { slug: base.project.slug },
      brochure: { designId: base.design.id },
      contact: { firstName: 'Sample', email: 'sample.buyer@example.com' },
      privacyAcknowledged: true,
      propertyMatchOptIn: false,
      newsletterOptIn: false,
      formVersion: LEAD_FORM_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      context: { surface: 'manual_cta', pagePath: base.pagePath },
    })
    expect(result.optIns).toEqual({ propertyMatch: false, newsletter: false })
  })

  it('renders the real brochure template with the chosen design and an inert link', () => {
    const result = buildSimulatedBrochureRequest(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.email.to).toBe('sample.buyer@example.com')
    expect(result.email.subject).toBe('Your requested brochure — Azizi Florence — 4-Bedroom Townhouses')
    expect(result.email.text).toContain('Design of interest: Spada - 4-home row - corner')
    expect(result.email.text).toContain('does not subscribe you to marketing emails')
    expect(result.email.html).toContain(`href="${SIMULATED_DOWNLOAD_HREF}"`)
    expect(result.email.html).toContain('Content-Security-Policy')
    expect(result.email.html).not.toMatch(/https?:\/\//)
  })

  it('keeps optional opt-ins when chosen', () => {
    const result = buildSimulatedBrochureRequest({ ...base, propertyMatchOptIn: true, newsletterOptIn: true })
    expect(result.ok && result.optIns).toEqual({ propertyMatch: true, newsletter: true })
  })
})
