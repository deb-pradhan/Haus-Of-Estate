/** Media is resolved by the server from either Sanity or the local preview bundle. */
export interface PropertyDesignImage {
  src: string
  alt: string
  label?: string
}

export interface PropertyDesign {
  _key: string
  label: string
  family?: string
  rowHomes?: number
  position?: 'corner' | 'middle' | 'standalone'
  plotAreaSqFt?: number
  sellableAreaSqFt: number
  plotAreaStatus?: 'brochure' | 'conflict'
  areaNote?: string
  summary?: string
  images: PropertyDesignImage[]
  floorPlans: PropertyDesignImage[]
}

/** Brochure references only; these do not establish a buyer-selectable finish. */
export interface PropertyInteriorScheme {
  _key: string
  label: string
  images: PropertyDesignImage[]
}

const positiveArea = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

function publicImages(images: PropertyDesignImage[] | undefined): PropertyDesignImage[] {
  return (images ?? []).filter((image) => typeof image.src === 'string' && image.alt?.trim())
    .map(({ src, alt, label }) => ({ src, alt, ...(label ? { label } : {}) }))
}

/** Whitelist client props: never serialize private brochure IDs or source notes.
 * The supplied plan spreads were checked separately from the conflicting plot summaries.
 */
export function preparePublicDesigns(designs: PropertyDesign[] | undefined): PropertyDesign[] {
  return (designs ?? []).filter((design) => positiveArea(design.sellableAreaSqFt))
    .map((design) => ({
      _key: design._key,
      label: design.label,
      family: design.family,
      rowHomes: design.rowHomes,
      position: design.position,
      sellableAreaSqFt: design.sellableAreaSqFt,
      ...(design.plotAreaStatus !== 'conflict' && positiveArea(design.plotAreaSqFt)
        ? { plotAreaSqFt: design.plotAreaSqFt } : {}),
      summary: design.summary,
      images: publicImages(design.images),
      floorPlans: publicImages(design.floorPlans),
    }))
}

export function preparePublicInteriorSchemes(schemes: PropertyInteriorScheme[] | undefined): PropertyInteriorScheme[] {
  return (schemes ?? []).map(({ _key, label, images }) => ({ _key, label, images: publicImages(images) }))
}
