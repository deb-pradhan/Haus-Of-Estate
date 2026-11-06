import { afterEach, describe, expect, it, vi } from 'vitest'
import { isBrochureDemoEnabled } from './local-demo'

afterEach(() => vi.unstubAllEnvs())

describe('local brochure demonstration gate', () => {
  it('never enables in production even when the local flag is set', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('HAUS_BROCHURE_DEMO_ENABLED', 'true')
    expect(isBrochureDemoEnabled()).toBe(false)
  })
  it('requires an explicit flag in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HAUS_BROCHURE_DEMO_ENABLED', 'false')
    expect(isBrochureDemoEnabled()).toBe(false)
    vi.stubEnv('HAUS_BROCHURE_DEMO_ENABLED', 'true')
    expect(isBrochureDemoEnabled()).toBe(true)
  })
})
