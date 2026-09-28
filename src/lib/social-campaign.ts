export const HAUS_CANONICAL_ORIGIN = 'https://hausofestate.com'

export const SOCIAL_PLATFORMS = [
  { title: 'Instagram', value: 'instagram' },
  { title: 'Facebook', value: 'facebook' },
  { title: 'LinkedIn', value: 'linkedin' },
  { title: 'X', value: 'x' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Pinterest', value: 'pinterest' },
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['value']

const SOCIAL_PLATFORM_VALUES = new Set<string>(
  SOCIAL_PLATFORMS.map(({ value }) => value),
)

const PUBLIC_HAUS_PATH = /^\/(?:about\/?|blog(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/?|careers(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/?|contact\/?|faq\/?|properties(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/?|register-interest\/?|services(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/?|team\/?)?$/
const SOCIAL_CONTENT_PATH = /^\/(?:blog|properties)\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/
const CAMPAIGN_KEY = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/

export function isSocialPublishingEnabled(
  value = process.env.NEXT_PUBLIC_SANITY_SOCIAL_CAMPAIGNS_ENABLED,
): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === 'string' && SOCIAL_PLATFORM_VALUES.has(value)
}

/**
 * Campaign links may only target known public Haus routes. Queries, fragments,
 * protocol-relative URLs, encoded path traversal and backslashes are rejected.
 */
export function isSafeCanonicalHausPath(value: unknown): value is string {
  if (typeof value !== 'string' || value !== value.trim()) return false
  if (!value.startsWith('/') || value.startsWith('//')) return false
  if (/[?#\\\s]/.test(value)) return false

  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return false
  }

  if (decoded !== value || decoded.includes('..')) return false

  const url = new URL(value, HAUS_CANONICAL_ORIGIN)
  return (
    url.origin === HAUS_CANONICAL_ORIGIN &&
    url.pathname === value &&
    PUBLIC_HAUS_PATH.test(value)
  )
}

export function isValidSocialCampaignKey(value: unknown): value is string {
  return typeof value === 'string' && CAMPAIGN_KEY.test(value)
}

export function isSocialCampaignContentPath(value: unknown): value is string {
  return isSafeCanonicalHausPath(value) && SOCIAL_CONTENT_PATH.test(value)
}

export function buildTrackedSocialUrl({
  canonicalPath,
  platform,
  campaign,
}: {
  canonicalPath: string
  platform: SocialPlatform
  campaign: string
}): string {
  if (!isSafeCanonicalHausPath(canonicalPath)) {
    throw new Error('A safe canonical Haus path is required.')
  }
  if (!isSocialPlatform(platform)) {
    throw new Error('A supported social platform is required.')
  }
  if (!isValidSocialCampaignKey(campaign)) {
    throw new Error('Campaign must use lowercase letters, numbers, hyphens or underscores.')
  }

  const url = new URL(canonicalPath, HAUS_CANONICAL_ORIGIN)
  url.searchParams.set('utm_source', platform)
  url.searchParams.set('utm_medium', 'organic_social')
  url.searchParams.set('utm_campaign', campaign)
  return url.toString()
}

type CampaignVariant = {
  platform?: unknown
  copy?: unknown
}

type PublishingRecord = {
  platform?: unknown
  url?: unknown
}

type CampaignApprovalInput = {
  canonicalContent?: unknown
  canonicalPath?: unknown
  utmCampaign?: unknown
  variants?: unknown
  assetRights?: {
    confirmed?: unknown
    confirmedBy?: unknown
    confirmedAt?: unknown
  }
  approval?: {
    contentApproved?: unknown
    trackingApproved?: unknown
    approvedBy?: unknown
    approvedAt?: unknown
  }
  publishedUrls?: unknown
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasReference(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  return hasText((value as { _ref?: unknown })._ref)
}

function isHttpsUrl(value: unknown): boolean {
  if (!hasText(value)) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function getSocialCampaignApprovalIssues(
  campaign: unknown,
  options: { requirePublishedUrls?: boolean } = {},
): string[] {
  const issues: string[] = []
  const document =
    campaign && typeof campaign === 'object'
      ? (campaign as CampaignApprovalInput)
      : undefined

  if (!document || !hasReference(document.canonicalContent)) {
    issues.push('Choose the canonical property or article.')
  }
  if (!isSocialCampaignContentPath(document?.canonicalPath)) {
    issues.push('Add the canonical /properties/... or /blog/... Haus path.')
  }
  if (!isValidSocialCampaignKey(document?.utmCampaign)) {
    issues.push('Add a valid lowercase UTM campaign key.')
  }

  const variants = Array.isArray(document?.variants)
    ? (document.variants as CampaignVariant[])
    : []
  if (variants.length === 0) {
    issues.push('Add at least one platform variant.')
  }

  const seenPlatforms = new Set<string>()
  for (const variant of variants) {
    if (!isSocialPlatform(variant?.platform)) {
      issues.push('Every platform variant must use a supported platform.')
      continue
    }
    if (seenPlatforms.has(variant.platform)) {
      issues.push(`Only one ${variant.platform} variant is allowed.`)
    }
    seenPlatforms.add(variant.platform)
    if (!hasText(variant.copy)) {
      issues.push(`Add approved copy for ${variant.platform}.`)
    }
  }

  if (document?.assetRights?.confirmed !== true) {
    issues.push('Confirm that Haus has the rights to use the campaign assets.')
  }
  if (!hasText(document?.assetRights?.confirmedBy)) {
    issues.push('Record who confirmed the asset rights.')
  }
  if (!hasText(document?.assetRights?.confirmedAt)) {
    issues.push('Record when the asset rights were confirmed.')
  }
  if (document?.approval?.contentApproved !== true) {
    issues.push('Content approval is required.')
  }
  if (document?.approval?.trackingApproved !== true) {
    issues.push('Tracking approval is required.')
  }
  if (!hasText(document?.approval?.approvedBy)) {
    issues.push('Record who approved the campaign.')
  }
  if (!hasText(document?.approval?.approvedAt)) {
    issues.push('Record when the campaign was approved.')
  }

  if (options.requirePublishedUrls) {
    const records = Array.isArray(document?.publishedUrls)
      ? (document.publishedUrls as PublishingRecord[])
      : []
    const validPublishedPlatforms = new Set(
      records
        .filter(
          (record) =>
            isSocialPlatform(record?.platform) && isHttpsUrl(record?.url),
        )
        .map((record) => record.platform as SocialPlatform),
    )

    for (const platform of seenPlatforms) {
      if (!validPublishedPlatforms.has(platform as SocialPlatform)) {
        issues.push(`Add the published HTTPS URL for ${platform}.`)
      }
    }
  }

  return [...new Set(issues)]
}

export function isSocialCampaignReadyForApproval(
  campaign: unknown,
): boolean {
  return getSocialCampaignApprovalIssues(campaign).length === 0
}
