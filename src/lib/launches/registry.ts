/**
 * Developer launches that Haus of Estate collects interest for before any
 * property record exists.
 *
 * A launch is not a published Sanity property. Lead intake resolves these keys
 * from this allowlist on the server instead of querying the CMS, so an article
 * can carry a project-attributed "register interest" form without an
 * unpublished placeholder property. Everything here is attribution and
 * presentation only: no prices, dates or inventory are stored, because none of
 * the Palm Springs particulars have been confirmed by the developer.
 */

export interface LaunchInterest {
  /** Stable kebab-case key sent by forms and stored as the lead's project slug. */
  key: string
  title: string
  developer: string
  community: string
  city: string
  country: string
  /** Blog slug of the article that hosts the register-interest section. */
  articleSlug: string
  status: 'pre-launch'
  /** Reported, unconfirmed: offered as form options, never asserted as fact. */
  reportedUnitTypes: readonly string[]
  reportedBedrooms: readonly string[]
  /** Shown beside every launch form. */
  qualification: string
}

export const LAUNCH_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const LAUNCH_INTERESTS: readonly LaunchInterest[] = [
  {
    key: 'palm-springs-by-nakheel',
    title: 'Palm Springs by Nakheel',
    developer: 'Nakheel',
    community: 'Jebel Ali',
    city: 'Dubai',
    country: 'United Arab Emirates',
    articleSlug: 'palm-springs-by-nakheel-dubai',
    status: 'pre-launch',
    reportedUnitTypes: ['Townhouse', 'Villa'],
    reportedBedrooms: ['3', '4', '5'],
    qualification:
      'Pre-launch. Prices, launch dates, unit mix and payment terms are unconfirmed until Nakheel publishes official documentation. Registering interest involves no payment, does not reserve a home and is not a developer Expression of Interest.',
  },
]

export function findLaunchInterest(key: string | null | undefined): LaunchInterest | undefined {
  const trimmed = key?.trim().toLowerCase()
  if (!trimmed || trimmed.length > 96 || !LAUNCH_KEY_PATTERN.test(trimmed)) return undefined
  return LAUNCH_INTERESTS.find((launch) => launch.key === trimmed)
}

export function findLaunchInterestByArticle(articleSlug: string | null | undefined): LaunchInterest | undefined {
  if (!articleSlug) return undefined
  return LAUNCH_INTERESTS.find((launch) => launch.articleSlug === articleSlug)
}

/** The project title stored with a lead and shown in the sales notification. */
export function launchProjectTitle(launch: LaunchInterest): string {
  return `${launch.title} (pre-launch interest)`
}

export function launchRegisterPath(launch: LaunchInterest): string {
  return `/register-interest?launch=${encodeURIComponent(launch.key)}`
}

/** Anchor of the register-interest section on the launch article. */
export const LAUNCH_SECTION_ID = 'register-interest'
