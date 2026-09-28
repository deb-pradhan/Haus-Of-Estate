import { describe, expect, it } from 'vitest'

import {
  buildTrackedSocialUrl,
  getSocialCampaignApprovalIssues,
  isSafeCanonicalHausPath,
  isSocialPublishingEnabled,
} from './social-campaign'

const readyCampaign = {
  canonicalContent: { _ref: 'property-1' },
  canonicalPath: '/properties/beaks-hill-road',
  utmCampaign: 'beaks-hill-launch',
  variants: [{ platform: 'linkedin', copy: 'A reviewed campaign post.' }],
  assetRights: {
    confirmed: true,
    confirmedBy: 'Sonia',
    confirmedAt: '2026-09-01T10:00:00Z',
  },
  approval: {
    contentApproved: true,
    trackingApproved: true,
    approvedBy: 'Sonia and Tanu',
    approvedAt: '2026-09-01T11:00:00Z',
  },
}

describe('social campaign controls', () => {
  it('keeps social publishing disabled unless explicitly enabled', () => {
    expect(isSocialPublishingEnabled(undefined)).toBe(false)
    expect(isSocialPublishingEnabled('false')).toBe(false)
    expect(isSocialPublishingEnabled(' TRUE ')).toBe(true)
  })

  it('accepts canonical public paths and rejects tracking or external paths', () => {
    expect(isSafeCanonicalHausPath('/properties/beaks-hill-road')).toBe(true)
    expect(isSafeCanonicalHausPath('/blog/market-update')).toBe(true)
    expect(isSafeCanonicalHausPath('/properties/home?utm_source=x')).toBe(false)
    expect(isSafeCanonicalHausPath('/blog/market-update/private-suffix')).toBe(
      false,
    )
    expect(isSafeCanonicalHausPath('//example.com/properties/home')).toBe(false)
    expect(isSafeCanonicalHausPath('/api/leads')).toBe(false)
  })

  it('builds a canonical tracked link for an approved platform', () => {
    const url = new URL(
      buildTrackedSocialUrl({
        canonicalPath: '/properties/beaks-hill-road',
        platform: 'linkedin',
        campaign: 'beaks-hill-launch',
      }),
    )

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://hausofestate.com/properties/beaks-hill-road',
    )
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'linkedin',
      utm_medium: 'organic_social',
      utm_campaign: 'beaks-hill-launch',
    })
  })

  it('requires human content, tracking and asset-rights approval', () => {
    expect(getSocialCampaignApprovalIssues(readyCampaign)).toEqual([])

    const issues = getSocialCampaignApprovalIssues({
      ...readyCampaign,
      approval: { contentApproved: false, trackingApproved: false },
    })

    expect(issues).toContain('Content approval is required.')
    expect(issues).toContain('Tracking approval is required.')
  })

  it('requires a live URL for every published platform variant', () => {
    expect(
      getSocialCampaignApprovalIssues(readyCampaign, {
        requirePublishedUrls: true,
      }),
    ).toContain('Add the published HTTPS URL for linkedin.')

    expect(
      getSocialCampaignApprovalIssues(
        {
          ...readyCampaign,
          publishedUrls: [
            {
              platform: 'linkedin',
              url: 'https://www.linkedin.com/feed/update/example',
            },
          ],
        },
        { requirePublishedUrls: true },
      ),
    ).toEqual([])
  })
})
