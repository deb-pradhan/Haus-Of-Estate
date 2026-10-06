export type PropertyMediaKind = 'photo' | 'concept' | 'concept-comparison'

export interface PropertyImageMetadata {
  caption?: string
  mediaKind?: PropertyMediaKind
}

export interface PropertyMediaImage extends PropertyImageMetadata {
  src: string
  alt: string
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
