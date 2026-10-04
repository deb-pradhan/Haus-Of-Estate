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
  brochureKey?: string
  images: PropertyDesignImage[]
  floorPlans: PropertyDesignImage[]
}

/** Brochure references only; these do not establish a buyer-selectable finish. */
export interface PropertyInteriorScheme {
  _key: string
  label: string
  images: PropertyDesignImage[]
}
