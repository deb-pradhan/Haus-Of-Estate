/** `render` is an architectural render or artist's impression of a home not yet built. */
export type PropertyMediaKind = 'photo' | 'render' | 'concept' | 'concept-comparison' | 'floor-plan'

export interface PropertyImageMetadata {
  caption?: string
  mediaKind?: PropertyMediaKind
}

export interface PropertyMediaImage extends PropertyImageMetadata {
  src: string
  alt: string
  /** The whole, uncropped image for the full-size viewer; falls back to `src`. */
  full?: string
}

export function isConceptMedia(image?: PropertyImageMetadata) {
  return image?.mediaKind === 'concept' || image?.mediaKind === 'concept-comparison'
}

export function propertyMediaCaption(image?: PropertyImageMetadata) {
  if (image?.caption?.trim()) return image.caption
  if (image?.mediaKind === 'concept-comparison') {
    return 'Existing view and proposed interiors — AI-assisted concept; not completed works'
  }
  if (image?.mediaKind === 'concept') {
    return 'Proposed interiors — AI-assisted concept; not completed works'
  }
  return undefined
}

/**
 * The short label shown inside the frame of any image that is not a photograph,
 * so a reader never has to find a caption to learn what they are looking at.
 * Photographs, floor plans and untagged images carry none: an image is only
 * labelled when an editor has said what it is.
 */
export function propertyMediaBadge(image?: PropertyImageMetadata): string | undefined {
  if (image?.mediaKind === 'render') return 'Illustration'
  if (image?.mediaKind === 'concept') return 'Illustration · AI concept'
  if (image?.mediaKind === 'concept-comparison') return 'Existing view and AI concept'
  return undefined
}

/**
 * Concept boards carry their own BEFORE and AFTER tags along the bottom of each
 * panel, so their label sits at the top where it covers nothing.
 */
export function propertyMediaBadgePosition(image?: PropertyImageMetadata): 'top' | 'bottom' {
  return isConceptMedia(image) ? 'top' : 'bottom'
}

/** Shown under a floor plan that arrives without its own measurement note. */
export const DEFAULT_FLOOR_PLAN_NOTE = 'Shown as supplied. Measurements are approximate and for guidance only.'
