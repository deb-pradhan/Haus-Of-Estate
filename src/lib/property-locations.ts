export interface PropertyLocationRecord {
  country?: string | null
  city?: string | null
  community?: string | null
}

export interface PropertyLocationGroup {
  country: string
  cities: string[]
  areasByCity: Record<string, string[]>
}

const locationCollator = new Intl.Collator('en-GB', {
  sensitivity: 'base',
})

function cleanLocation(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

export function propertyLocationKey(value: string | null | undefined): string {
  return cleanLocation(value).toLocaleLowerCase('en-GB')
}

/** Area uses the existing community field, never an inferred address or alias. */
export function matchesPropertyLocation(
  record: PropertyLocationRecord & { masterDevelopment?: string | null },
  filters: { country?: string; city?: string; area?: string; location?: string },
): boolean {
  for (const [filter, value] of [
    [filters.country, record.country],
    [filters.city, record.city],
    [filters.area, record.community],
  ]) {
    if (propertyLocationKey(filter) && propertyLocationKey(filter) !== propertyLocationKey(value)) return false
  }
  const broadLocation = propertyLocationKey(filters.location)
  return !broadLocation || [record.community, record.city, record.country, record.masterDevelopment]
    .map(propertyLocationKey).join(' ').includes(broadLocation)
}

/** Build a stable country -> city -> area hierarchy from eligible inventory. */
export function buildPropertyLocationGroups(
  records: readonly PropertyLocationRecord[],
): PropertyLocationGroup[] {
  const countries = new Map<
    string,
    { country: string; cities: Map<string, { city: string; areas: Map<string, string> }> }
  >()

  for (const record of records) {
    const country = cleanLocation(record.country)
    const city = cleanLocation(record.city)
    if (!country || !city) continue

    const countryKey = propertyLocationKey(country)
    const countryEntry = countries.get(countryKey) ?? {
      country,
      cities: new Map<string, { city: string; areas: Map<string, string> }>(),
    }

    const cityKey = propertyLocationKey(city)
    const cityEntry = countryEntry.cities.get(cityKey) ?? { city, areas: new Map<string, string>() }
    const area = cleanLocation(record.community)
    if (area && !cityEntry.areas.has(propertyLocationKey(area))) cityEntry.areas.set(propertyLocationKey(area), area)
    countryEntry.cities.set(cityKey, cityEntry)
    countries.set(countryKey, countryEntry)
  }

  return [...countries.values()]
    .sort((a, b) => locationCollator.compare(a.country, b.country))
    .map(({ country, cities }) => {
      const entries = [...cities.values()].sort((a, b) => locationCollator.compare(a.city, b.city))
      return {
        country,
        cities: entries.map(({ city }) => city),
        areasByCity: Object.fromEntries(entries.map(({ city, areas }) => [
          city, [...areas.values()].sort(locationCollator.compare),
        ])),
      }
    })
}
