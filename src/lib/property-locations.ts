export interface PropertyLocationRecord {
  country?: string | null
  city?: string | null
}

export interface PropertyLocationGroup {
  country: string
  cities: string[]
}

const locationCollator = new Intl.Collator('en-GB', {
  sensitivity: 'base',
})

function cleanLocation(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function locationKey(value: string): string {
  return value.toLocaleLowerCase('en-GB')
}

/** Build a stable country -> city hierarchy from current Sanity inventory. */
export function buildPropertyLocationGroups(
  records: readonly PropertyLocationRecord[],
): PropertyLocationGroup[] {
  const countries = new Map<
    string,
    { country: string; cities: Map<string, string> }
  >()

  for (const record of records) {
    const country = cleanLocation(record.country)
    const city = cleanLocation(record.city)
    if (!country || !city) continue

    const countryKey = locationKey(country)
    const countryEntry = countries.get(countryKey) ?? {
      country,
      cities: new Map<string, string>(),
    }

    const cityKey = locationKey(city)
    if (!countryEntry.cities.has(cityKey)) {
      countryEntry.cities.set(cityKey, city)
    }
    countries.set(countryKey, countryEntry)
  }

  return [...countries.values()]
    .sort((a, b) => locationCollator.compare(a.country, b.country))
    .map(({ country, cities }) => ({
      country,
      cities: [...cities.values()].sort(locationCollator.compare),
    }))
}
