import { describe, expect, it } from 'vitest'
import {
  LAUNCH_INTERESTS,
  LAUNCH_KEY_PATTERN,
  findLaunchInterest,
  findLaunchInterestByArticle,
  launchProjectTitle,
  launchRegisterPath,
} from './registry'

describe('launch registry', () => {
  it('holds Palm Springs as a pre-launch interest with no prices, dates or inventory', () => {
    expect(LAUNCH_INTERESTS.map((launch) => launch.key)).toEqual(['palm-springs-by-nakheel'])
    const [palmSprings] = LAUNCH_INTERESTS
    expect(palmSprings.status).toBe('pre-launch')
    expect(palmSprings.articleSlug).toBe('palm-springs-by-nakheel-dubai')
    expect(JSON.stringify(palmSprings)).not.toMatch(/AED|\d{1,3},\d{3}|handover|available now/i)
    expect(palmSprings.qualification).toMatch(/no payment/i)
    expect(palmSprings.qualification).toMatch(/not a developer Expression of Interest/)
  })

  it('resolves keys case-insensitively and rejects malformed or unknown keys', () => {
    expect(findLaunchInterest('palm-springs-by-nakheel')?.title).toBe('Palm Springs by Nakheel')
    expect(findLaunchInterest(' Palm-Springs-By-Nakheel ')?.key).toBe('palm-springs-by-nakheel')
    expect(findLaunchInterest('palm springs')).toBeUndefined()
    expect(findLaunchInterest('azizi-florence')).toBeUndefined()
    expect(findLaunchInterest(undefined)).toBeUndefined()
    expect(LAUNCH_KEY_PATTERN.test('a'.repeat(97))).toBe(true)
    expect(findLaunchInterest('a'.repeat(97))).toBeUndefined()
  })

  it('maps the article slug to its launch and builds the attribution strings', () => {
    const launch = findLaunchInterestByArticle('palm-springs-by-nakheel-dubai')!
    expect(launch.key).toBe('palm-springs-by-nakheel')
    expect(findLaunchInterestByArticle('from-palm-jumeirah-to-difc-how-rapid-execution-powers-dubai-property-growth')).toBeUndefined()
    expect(launchProjectTitle(launch)).toBe('Palm Springs by Nakheel (pre-launch interest)')
    expect(launchRegisterPath(launch)).toBe('/register-interest?launch=palm-springs-by-nakheel')
  })
})
