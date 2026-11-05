/** A supplied development schedule; these rows do not represent available units. */
export interface PropertyHomeType {
  _key: string
  label: string
  bedrooms: number
  startingSizeSqFt: number
  startingPrice: number
  priceCurrency: string
}

const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

/** Keep incomplete schedules and private source fields out of public rendering. */
export function preparePublicHomeTypes(rows?: PropertyHomeType[]): PropertyHomeType[] {
  return (rows ?? []).filter((row) => row._key && row.label?.trim()
    && Number.isInteger(row.bedrooms) && row.bedrooms >= 0 && row.bedrooms <= 20
    && positive(row.startingSizeSqFt) && positive(row.startingPrice)
    && /^[A-Z]{3}$/.test(row.priceCurrency))
    .map(({ _key, label, bedrooms, startingSizeSqFt, startingPrice, priceCurrency }) => ({
      _key, label: label.trim(), bedrooms, startingSizeSqFt, startingPrice, priceCurrency,
    }))
}

export function matchesPropertyBedrooms(property: {
  bedrooms?: number
  homeTypes?: PropertyHomeType[]
}, selected: number): boolean {
  const counts = typeof property.bedrooms === 'number'
    ? [property.bedrooms]
    : preparePublicHomeTypes(property.homeTypes).map((row) => row.bedrooms)
  return counts.some((count) => selected === 0 ? count === 0 : count >= selected)
}
