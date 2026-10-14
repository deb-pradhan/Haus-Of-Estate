import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

describe('careers email-only intake readiness and protection', () => {
  it('requires explicit intake approval and configured sender service without a database', async () => {
    vi.stubEnv('CAREERS_INTAKE_ENABLED', 'true')
    vi.stubEnv('CAREERS_EMAIL', 'careers@hausofestate.com')
    vi.stubEnv('RESEND_FROM_EMAIL', 'noreply@hausofestate.com')
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv('LEAD_RATE_LIMIT_SECRET', '')
    const { isCareersIntakeEnabled } = await import('@/lib/careers-settings')
    for (const key of ['', '  ', 're_xxx']) {
      vi.stubEnv('RESEND_API_KEY', key)
      expect(isCareersIntakeEnabled()).toBe(false)
    }
    vi.stubEnv('RESEND_API_KEY', 're_synthetic_test_only')
    expect(isCareersIntakeEnabled()).toBe(true)
    vi.stubEnv('RESEND_FROM_EMAIL', 'sender@unverified.example')
    expect(isCareersIntakeEnabled()).toBe(false)
    vi.stubEnv('RESEND_FROM_EMAIL', 'noreply@hausofestate.com')
    vi.stubEnv('CAREERS_EMAIL', 'not-an-email')
    expect(isCareersIntakeEnabled()).toBe(false)
    vi.stubEnv('CAREERS_EMAIL', 'careers@hausofestate.com')
    vi.stubEnv('CAREERS_INTAKE_ENABLED', 'false')
    expect(isCareersIntakeEnabled()).toBe(false)
  })

  it('counts independent IP and normalized email quotas and releases expired entries', async () => {
    const { careersThrottle } = await import('@/lib/careers-security')
    for (let i = 0; i < 10; i++) expect(careersThrottle('ip', '192.0.2.1', 0)).toBe(0)
    expect(careersThrottle('ip', '192.0.2.1', 1)).toBe(600)
    expect(careersThrottle('ip', '192.0.2.2', 1)).toBe(0)
    for (let i = 0; i < 3; i++) expect(careersThrottle('email', 'Applicant@example.test', 0)).toBe(0)
    expect(careersThrottle('email', ' applicant@EXAMPLE.test ', 1)).toBe(3600)
    expect(careersThrottle('ip', '192.0.2.1', 600_000)).toBe(0)
    expect(careersThrottle('email', 'applicant@example.test', 3_600_000)).toBe(0)
  })

  it('bounds buckets without evicting a blocked identity', async () => {
    const { careersThrottle } = await import('@/lib/careers-security')
    for (let i = 0; i < 5_000; i++) expect(careersThrottle('ip', `synthetic-${i}`, 0)).toBe(0)
    expect(careersThrottle('ip', 'overflow', 1)).toBe(60)
    expect(careersThrottle('ip', 'overflow', 600_000)).toBe(0)
  })

  it('trusts only the configured proxy header and rejects foreign or missing origins', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://hausofestate.com')
    vi.stubEnv('AUTH_TRUST_PROXY_HEADERS', 'true')
    vi.stubEnv('AUTH_CLIENT_IP_HEADER', 'x-real-ip')
    const { throttleCareersIp, isAllowedCareersOrigin } = await import('@/lib/careers-security')
    const request = new Request('https://hausofestate.com/api/applications', {
      headers: { origin: 'https://hausofestate.com', 'x-real-ip': '192.0.2.10', 'x-forwarded-for': 'untrusted' },
    })
    expect(isAllowedCareersOrigin(request)).toBe(true)
    expect(throttleCareersIp(request)).toBe(0)
    for (const origin of ['', 'https://foreign.example']) {
      expect(isAllowedCareersOrigin(new Request(request.url, { headers: { origin } }))).toBe(false)
    }
    expect(() => throttleCareersIp(new Request(request.url, { headers: { 'x-forwarded-for': '192.0.2.11' } }))).toThrow()
  })
})
