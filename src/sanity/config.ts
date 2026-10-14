export const sanityProjectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'jdxbkry4'

export const sanityDataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

// The editor and CLI default to an isolated dataset. Production editing must
// always be an explicit deployment decision.
export const sanityStudioDataset =
  process.env.SANITY_STUDIO_DATASET || 'staging'

export const sanityApiVersion = '2026-02-01'

export const sanityStudioBasePath = '/studio'

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const siteOrigin = new URL(configuredSiteUrl).origin

export const socialCampaignsEnabled =
  process.env.NEXT_PUBLIC_SANITY_SOCIAL_CAMPAIGNS_ENABLED === 'true'
