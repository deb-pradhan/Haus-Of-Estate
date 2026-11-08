import { describe, expect, it } from 'vitest'
import { findLaunchInterest } from '@/lib/launches/registry'
import { buildSimulatedLaunchRegistration, validateSimulatedLaunchFields } from './launch-request'

const launch = findLaunchInterest('palm-springs-by-nakheel')!
const base = {
  launch,
  interest: 'buy' as const,
  preferences: { propertyType: 'Villa', bedrooms: '4', timeframe: '3-6 months' },
  contact: { firstName: 'Sample', email: 'Sample@Example.com', phone: '+44 7700 900123', message: 'Interested in a corner plot.' },
  privacyAcknowledged: true,
  propertyMatchOptIn: false,
  newsletterOptIn: false,
  pagePath: '/blog/palm-springs-by-nakheel-dubai',
  submissionId: '2d9a7d9e-8d7b-4e4c-9a6b-2f1d5c3e8b11',
  now: new Date('2026-11-08T10:00:00Z'),
}

describe('simulated launch registration', () => {
  it('validates the live contract with the launch key and renders the exact sales notification', () => {
    const result = buildSimulatedLaunchRegistration(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.payload.launchInterest).toEqual({ key: 'palm-springs-by-nakheel' })
    expect(result.payload.project).toBeUndefined()
    expect(result.payload.context).toEqual({ surface: 'launch_article', pagePath: '/blog/palm-springs-by-nakheel-dubai' })
    expect(result.saved).toEqual({
      project: 'Palm Springs by Nakheel (pre-launch interest)',
      source: 'launch_article',
      campaign: 'palm-springs-by-nakheel',
      landingPage: '/blog/palm-springs-by-nakheel-dubai',
    })
    expect(result.notification.to).toBe('sales@hausofestate.com')
    expect(result.notification.replyTo).toBe('sample@example.com')
    expect(result.notification.text).toContain('Project: Palm Springs by Nakheel (pre-launch interest)')
    expect(result.notification.text).toContain('Source: launch_article')
    expect(result.notification.text).toContain('Campaign: palm-springs-by-nakheel')
    expect(result.notification.text).toContain('Landing page: /blog/palm-springs-by-nakheel-dubai')
    expect(result.notification.text).toContain('Property type: Villa')
    expect(result.notification.text).toContain('Bedrooms: 4')
    expect(result.notification.text).toContain('Location: Jebel Ali, Dubai')
    expect(result.notification.text).toContain('Newsletter opt-in: No')
    expect(result.notification.text).toContain('Enquiry message: Interested in a corner plot.')
    expect(result.notification.text).not.toMatch(/reserved|deposit|priority/i)
  })

  it('keeps marketing consent separate and never implies a subscription', () => {
    const result = buildSimulatedLaunchRegistration({ ...base, newsletterOptIn: true })
    expect(result.ok && result.optIns).toEqual({ propertyMatch: false, newsletter: true })
    expect(result.ok && result.notification.text).toContain('Newsletter opt-in: Yes')
  })

  it('mirrors the native field checks before the contract runs', () => {
    expect(validateSimulatedLaunchFields({ ...base, contact: { firstName: '', email: 'nope', phone: 'abc' }, privacyAcknowledged: false })).toEqual({
      firstName: 'Enter your first name.',
      email: 'Enter a valid email address.',
      phone: 'Enter a valid phone number or leave this blank.',
      privacyAcknowledged: 'Confirm that you have read and understood the privacy notice.',
    })
    const failed = buildSimulatedLaunchRegistration({ ...base, privacyAcknowledged: false })
    expect(failed.ok).toBe(false)
  })
})
