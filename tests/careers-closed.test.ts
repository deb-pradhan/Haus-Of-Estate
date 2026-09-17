import { describe, expect, it, vi } from 'vitest'

const { getRole, sendTeam, sendApplicant } = vi.hoisted(() => ({
  getRole: vi.fn(), sendTeam: vi.fn(), sendApplicant: vi.fn(),
}))
vi.mock('@/sanity/careers', () => ({ getCareerRole: getRole }))
vi.mock('@/lib/email/resend', () => ({
  sendApplicationToTeam: sendTeam,
  sendApplicationConfirmationToApplicant: sendApplicant,
}))

import { POST } from '@/app/api/applications/route'
import { CAREERS_PUBLIC_ENABLED } from '@/lib/careers-availability'

describe('public careers closure', () => {
  it('rejects a cached application without reading its body or touching CMS/email', async () => {
    expect(CAREERS_PUBLIC_ENABLED).toBe(false)
    const request = new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=missing' },
      body: 'invalid form',
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Applications are currently closed.' })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(request.bodyUsed).toBe(false)
    expect(getRole).not.toHaveBeenCalled()
    expect(sendTeam).not.toHaveBeenCalled()
    expect(sendApplicant).not.toHaveBeenCalled()
  })
})
