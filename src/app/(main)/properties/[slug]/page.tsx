import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { urlFor } from '@/sanity'
import { sanityFetch } from '@/sanity/live'
import { PROPERTY_BY_SLUG_QUERY, PROPERTY_SLUGS_QUERY } from '@/sanity/queries'
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGES } from '@/lib/seo'
import { PropertyDetailView, type PropertyDetail } from '@/components/properties/PropertyDetailView'
import { isConceptMedia } from '@/lib/property-media'

export const revalidate = 60

export async function generateStaticParams() {
  const { data } = await sanityFetch<{ slug: string }[]>({
    query: PROPERTY_SLUGS_QUERY,
  })
  return (data ?? []).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: property } = await sanityFetch<PropertyDetail>({
    query: PROPERTY_BY_SLUG_QUERY,
    params: { slug },
  })
  if (!property) return { title: 'Property' }

  const ogImage = property.featuredImage
    ? urlFor(property.featuredImage)
        .width(1200)
        .height(630)
        .fit('crop')
        .url()
    : undefined
  const images = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: property.title }]
    : DEFAULT_OG_IMAGES

  return {
    title: property.title,
    description: property.summary,
    alternates: { canonical: `/properties/${property.slug}` },
    openGraph: {
      title: `${property.title} — Haus of Estate`,
      description: property.summary,
      url: `/properties/${property.slug}`,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${property.title} — Haus of Estate`,
      description: property.summary,
      images: [ogImage ?? DEFAULT_OG_IMAGE],
    },
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: property } = await sanityFetch<PropertyDetail>({
    query: PROPERTY_BY_SLUG_QUERY,
    params: { slug },
  })

  if (!property) notFound()

  const { isEnabled: draftPreview } = await draftMode()
  // Project only usable image URLs; omit unresolved plot figures before they
  // cross the client boundary, including in Sanity Draft Mode.
  const detail: PropertyDetail = {
    ...property,
    designVariants: property.designVariants?.map((design) => ({
      ...design,
      plotAreaSqFt: design.plotAreaStatus === 'conflict' || typeof design.plotAreaSqFt !== 'number'
        ? undefined
        : design.plotAreaSqFt,
      areaNote: design.plotAreaStatus === 'conflict' ? undefined : design.areaNote,
      images: (design.images ?? []).filter((image) => Boolean(image.src)).map((image) => ({
        ...image,
        alt: image.alt || `${property.title} — ${design.label}`,
      })),
      floorPlans: (design.floorPlans ?? []).filter((image) => Boolean(image.src)).map((image) => ({
        ...image,
        alt: image.alt || `${design.label} — floor plan`,
      })),
    })),
    interiorSchemes: property.interiorSchemes?.map((scheme) => ({
      ...scheme,
      images: (scheme.images ?? []).filter((image) => Boolean(image.src)).map((image) => ({
        ...image,
        alt: image.alt || `${property.title} — ${scheme.label}`,
      })),
    })),
  }

  return (
    <PropertyDetailView
      property={detail}
      draftPreview={draftPreview}
      media={{
        hero: property.featuredImage ? {
          src: isConceptMedia(property.featuredImage)
            ? urlFor(property.featuredImage).ignoreImageParams().width(1600).fit('max').url()
            : urlFor(property.featuredImage).width(1600).height(900).url(),
          alt: property.featuredImage.alt || property.title,
          caption: property.featuredImage.caption,
          mediaKind: property.featuredImage.mediaKind,
        } : undefined,
        gallery: (property.gallery ?? []).map((image, index) => ({
          src: isConceptMedia(image)
            ? urlFor(image).ignoreImageParams().width(1200).fit('max').url()
            : urlFor(image).width(800).height(600).url(),
          alt: image.alt || `${property.title} — image ${index + 1}`,
          caption: image.caption,
          mediaKind: image.mediaKind,
        })),
      }}
    />
  )
}
