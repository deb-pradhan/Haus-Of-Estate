import { DEFAULT_FLOOR_PLAN_NOTE, propertyMediaBadge, propertyMediaBadgePosition, propertyMediaCaption } from '@/lib/property-media'
import type { ShowcaseImage } from './fixture'

/** Reuse the site's concept/comparison captions; renders carry their own alt text. */
export function showcaseImageCaption(image?: ShowcaseImage): string | undefined {
  if (!image) return undefined
  return propertyMediaCaption({
    caption: image.caption,
    mediaKind: image.mediaKind === 'render' ? undefined : image.mediaKind,
  })
}

/** The in-frame label for a render or concept; photographs and plans carry none. */
export function showcaseImageBadge(image?: Pick<ShowcaseImage, 'mediaKind'>): string | undefined {
  return propertyMediaBadge(image)
}

export function showcaseImageBadgePosition(image?: Pick<ShowcaseImage, 'mediaKind'>): 'top' | 'bottom' {
  return propertyMediaBadgePosition(image)
}

/** Shown under a floor plan that arrives without its own measurement note. */
export const DEFAULT_PLAN_NOTE = DEFAULT_FLOOR_PLAN_NOTE

const snapshotDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "5 November 2026" from an ISO date. */
export function formatSnapshotDate(isoDate: string): string {
  return snapshotDate.format(new Date(`${isoDate}T00:00:00Z`))
}
