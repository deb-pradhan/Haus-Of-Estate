import { propertyMediaCaption } from '@/lib/property-media'
import type { ShowcaseImage } from './fixture'

/** Reuse the site's concept/comparison captions; renders carry their own alt text. */
export function showcaseImageCaption(image?: ShowcaseImage): string | undefined {
  if (!image) return undefined
  return propertyMediaCaption({
    caption: image.caption,
    mediaKind: image.mediaKind === 'render' ? undefined : image.mediaKind,
  })
}

/**
 * The short label shown inside the frame of any image that is not a photograph,
 * so a reader never has to find a caption to learn what they are looking at.
 * Photographs and floor plans carry none.
 */
export function showcaseImageBadge(image?: Pick<ShowcaseImage, 'mediaKind'>): string | undefined {
  if (image?.mediaKind === 'render') return 'Illustration'
  if (image?.mediaKind === 'concept') return 'Illustration · AI concept'
  if (image?.mediaKind === 'concept-comparison') return 'Existing view and AI concept'
  return undefined
}

/**
 * Concept boards carry their own BEFORE and AFTER tags along the bottom of each
 * panel, so their label sits at the top where it covers nothing.
 */
export function showcaseImageBadgePosition(image?: Pick<ShowcaseImage, 'mediaKind'>): 'top' | 'bottom' {
  return image?.mediaKind === 'concept' || image?.mediaKind === 'concept-comparison' ? 'top' : 'bottom'
}

/** Shown under a floor plan that arrives without its own measurement note. */
export const DEFAULT_PLAN_NOTE = 'Shown as supplied. Measurements are approximate and for guidance only.'

const snapshotDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "5 November 2026" from an ISO date. */
export function formatSnapshotDate(isoDate: string): string {
  return snapshotDate.format(new Date(`${isoDate}T00:00:00Z`))
}
