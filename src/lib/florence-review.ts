import 'server-only'
import { readFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import type { PropertyDetail } from '@/components/properties/PropertyDetailView'
import { belongsToDevelopment, type PropertyDevelopment } from './property-developments'
import { preparePublicDesigns, preparePublicInteriorSchemes } from './property-designs'
import type { PropertyDesign, PropertyDesignImage, PropertyInteriorScheme } from './property-designs'
import { urlFor } from '@/sanity'

// Local review only: reuse the exact existing drafts, never seed duplicate records.
const draftIds = new Set([
  'drafts.9405e5db-9b61-4fd7-bb26-ef4f89eb71c8',
  'drafts.0f23c71e-459d-4e00-81c3-2dfab801c247',
  'drafts.413a49b8-c0f4-4e11-8e37-2c42095281cb',
  'drafts.5c86a687-3e2f-40d9-aa03-7ff580313158',
  'drafts.08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47',
  'drafts.09828cf9-b9d5-409f-8e4a-658fcdaa75a6',
])
type SourceImage = { asset?: { _ref?: string }; alt?: string; label?: string }
type SourceDesign = Omit<PropertyDesign, 'images' | 'floorPlans'> & { images?: SourceImage[]; floorPlans?: SourceImage[] }
type SourceScheme = Omit<PropertyInteriorScheme, 'images'> & { images?: SourceImage[] }
type SourceProperty = Omit<PropertyDetail, 'slug' | 'designVariants' | 'interiorSchemes'> & {
  slug: { current: string }; priceAmount?: number; priceCurrency?: string
  designVariants?: SourceDesign[]; interiorSchemes?: SourceScheme[]
}

function images(source: SourceImage[] | undefined): PropertyDesignImage[] {
  return (source ?? []).filter((image) => image.asset?._ref && image.alt).map((image) => ({
    src: urlFor(image).ignoreImageParams().url(), alt: image.alt!, label: image.label,
  }))
}

export async function readFlorenceReview() {
  // The guard precedes file access; no token, remote draft query or production overlay.
  if (process.env.NODE_ENV !== 'development') return null
  const file = process.env.HAUS_FLORENCE_PREVIEW_FILE
  if (!file || !isAbsolute(file)) return null
  const snapshot = JSON.parse(await readFile(file, 'utf8')) as {
    projectId?: string; dataset?: string; documents?: SourceProperty[]
  }
  if (snapshot.projectId !== 'jdxbkry4' || snapshot.dataset !== 'production') return null
  const properties = (snapshot.documents ?? []).filter((doc) => draftIds.has(doc._id)).map((doc) => {
    // Explicit public fields only; source/approval notes never cross the server boundary.
    const property: PropertyDetail & { priceAmount?: number; priceCurrency?: string } = {
      _id: doc._id, title: doc.title, slug: doc.slug.current, community: doc.community,
      city: doc.city, country: doc.country, developer: doc.developer,
      masterDevelopment: doc.masterDevelopment, unitType: doc.unitType, bedrooms: doc.bedrooms,
      priceDisplay: doc.priceDisplay, priceAmount: doc.priceAmount, priceCurrency: doc.priceCurrency,
      summary: doc.summary, description: doc.description, keyFeatures: doc.keyFeatures,
      amenities: doc.amenities, featuredImage: doc.featuredImage, gallery: doc.gallery,
      designVariants: preparePublicDesigns(doc.designVariants?.map((design) => ({
        ...design, images: images(design.images), floorPlans: images(design.floorPlans),
      }))),
      interiorSchemes: preparePublicInteriorSchemes(doc.interiorSchemes?.map((scheme) => ({
        ...scheme, images: images(scheme.images),
      }))),
    }
    return property
  })
  const overview = properties.find((property) => property.unitType === 'Development')
  if (!overview || properties.length !== 6) return null
  const development: PropertyDevelopment = {
    ...overview,
    collections: properties.filter((property) => belongsToDevelopment(property, overview)).map((property) => ({
      ...property, designImage: property.designVariants?.[0]?.images[0], designCount: property.designVariants?.length,
    })),
  }
  return { properties, development }
}
