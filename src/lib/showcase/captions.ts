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
