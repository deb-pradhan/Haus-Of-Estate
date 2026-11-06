import { describe, expect, it } from 'vitest'
import { isFixtureShowcaseEnabled, showcasePath, showcasePropertyPath } from './access'

describe('fixture showcase gate', () => {
  it('is off unless the explicit flag is set, regardless of NODE_ENV', () => {
    expect(isFixtureShowcaseEnabled({})).toBe(false)
    expect(isFixtureShowcaseEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(isFixtureShowcaseEnabled({ NODE_ENV: 'production', HAUS_FIXTURE_SHOWCASE_ENABLED: 'TRUE' })).toBe(false)
    expect(isFixtureShowcaseEnabled({ NODE_ENV: 'production', HAUS_FIXTURE_SHOWCASE_ENABLED: 'true' })).toBe(true)
  })

  it('builds showcase paths that mirror the public property URLs', () => {
    expect(showcasePath()).toBe('/showcase')
    expect(showcasePath('/properties')).toBe('/showcase/properties')
    expect(showcasePropertyPath('azizi-florence')).toBe('/showcase/properties/azizi-florence')
    expect(showcasePropertyPath('x', '/request?design=a')).toBe('/showcase/properties/x/request?design=a')
  })
})
