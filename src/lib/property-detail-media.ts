import { urlFor } from '@/sanity'
import { isConceptMedia, type PropertyImageMetadata, type PropertyMediaImage } from './property-media'

type SanityPropertyImage = PropertyImageMetadata & { alt?: string } & Record<string, unknown>

/**
 * Resolve a property's Sanity images to the URLs the detail view renders.
 * Concept boards keep their full frame so BEFORE/AFTER labels are never cropped.
 */
export function resolvePropertyMedia(property: {
  title: string
  featuredImage?: SanityPropertyImage
  gallery?: SanityPropertyImage[]
}): { hero?: PropertyMediaImage; gallery: PropertyMediaImage[] } {
  const { featuredImage, gallery = [], title } = property
  return {
    hero: featuredImage ? {
      src: isConceptMedia(featuredImage)
        ? urlFor(featuredImage).ignoreImageParams().width(1600).fit('max').url()
        : urlFor(featuredImage).width(1600).height(900).url(),
      alt: featuredImage.alt || title,
      caption: featuredImage.caption,
      mediaKind: featuredImage.mediaKind,
    } : undefined,
    gallery: gallery.map((image, index) => ({
      src: isConceptMedia(image)
        ? urlFor(image).ignoreImageParams().width(1200).fit('max').url()
        : urlFor(image).width(800).height(600).url(),
      alt: image.alt || `${title} — image ${index + 1}`,
      caption: image.caption,
      mediaKind: image.mediaKind,
    })),
  }
}
