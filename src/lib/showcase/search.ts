import { matchesPropertyLocation } from '@/lib/property-locations'
import { showcasePath } from './access'
import type { ShowcaseProperty } from './fixture'

/**
 * Client-safe search helpers. They only use types from the fixture adapter so
 * the catalogue form can build URLs without bundling the fixture itself.
 */

export interface ShowcaseSearch {
  country?: string
  city?: string
  area?: string
  type?: string
  beds?: number
  q?: string
  /** Presentation order only; never counted as a filter. */
  sort?: ShowcaseSort
}

/** `curated` keeps the editorial order: communities first, bedrooms ascending. */
export type ShowcaseSort = 'curated' | 'size-asc' | 'size-desc'
export const SHOWCASE_SORTS: { value: ShowcaseSort; label: string }[] = [
  { value: 'curated', label: 'Recommended' },
  { value: 'size-asc', label: 'Smallest first' },
  { value: 'size-desc', label: 'Largest first' },
]

export type ShowcaseSearchParamsInput = Record<string, string | string[] | undefined>
export type ShowcaseFilterKey = Exclude<keyof ShowcaseSearch, 'sort'>

const KEYS: ShowcaseFilterKey[] = ['country', 'city', 'area', 'type', 'beds', 'q']

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.replace(/\s+/g, ' ').trim() ?? ''
}

/** Repeated query parameters use the first value; empty values are dropped. */
export function normalizeShowcaseSearch(raw: ShowcaseSearchParamsInput = {}): ShowcaseSearch {
  const search: ShowcaseSearch = {}
  for (const key of ['country', 'city', 'area', 'type'] as const) {
    const value = first(raw[key]).slice(0, 80)
    if (value) search[key] = value
  }
  const beds = Number.parseInt(first(raw.beds), 10)
  if (Number.isInteger(beds) && beds >= 0 && beds <= 20) search.beds = beds
  const q = first(raw.q).slice(0, 120)
  if (q) search.q = q
  const sort = first(raw.sort)
  if (sort === 'size-asc' || sort === 'size-desc') search.sort = sort
  return search
}

export function hasShowcaseFilters(search: ShowcaseSearch): boolean {
  return KEYS.some((key) => search[key] !== undefined)
}

export function showcaseSearchHref(search: ShowcaseSearch): string {
  const params = new URLSearchParams()
  for (const key of KEYS) {
    const value = search[key]
    if (value === undefined || value === '') continue
    params.set(key, String(value))
  }
  if (search.sort && search.sort !== 'curated') params.set('sort', search.sort)
  const query = params.toString()
  return showcasePath(`/properties${query ? `?${query}` : ''}`)
}

export function showcaseSearchWithout(search: ShowcaseSearch, key: ShowcaseFilterKey): ShowcaseSearch {
  const next = { ...search }
  delete next[key]
  // Narrower location choices depend on the wider one.
  if (key === 'country') { delete next.city; delete next.area }
  if (key === 'city') delete next.area
  return next
}

type Searchable = Pick<ShowcaseProperty,
  'title' | 'slug' | 'summary' | 'community' | 'city' | 'country' | 'developer' | 'unitType' | 'masterDevelopment' | 'bedrooms'
> & { designs: Pick<ShowcaseProperty['designs'][number], 'label' | 'family'>[] }

function searchableText(property: Searchable): string {
  return [
    property.title, property.slug, property.summary, property.community, property.city, property.country,
    property.developer, property.unitType, property.masterDevelopment,
    ...property.designs.flatMap((design) => [design.label, design.family]),
  ].filter(Boolean).join(' ').toLocaleLowerCase('en-GB')
}

/**
 * The few fields a filter needs, small enough to hand to the search form so it
 * can count matches while a buyer is still choosing.
 */
export interface ShowcaseSearchIndexItem {
  country: string
  city: string
  community: string
  masterDevelopment?: string
  unitType: string
  bedrooms?: number
  /** Lower-cased keyword haystack. */
  text: string
  /** Set on a community overview and on each of its collections. */
  communityId?: string
  overview?: boolean
}

export function showcaseSearchIndexItem(
  property: Searchable,
  community?: { id: string; overview: boolean },
): ShowcaseSearchIndexItem {
  return {
    country: property.country,
    city: property.city,
    community: property.community,
    masterDevelopment: property.masterDevelopment,
    unitType: property.unitType,
    bedrooms: property.bedrooms,
    text: searchableText(property),
    ...(community ? { communityId: community.id, overview: community.overview } : {}),
  }
}

function matchesIndexItem(item: ShowcaseSearchIndexItem, search: ShowcaseSearch): boolean {
  if (!matchesPropertyLocation(item, search)) return false
  if (search.type && item.unitType.toLocaleLowerCase('en-GB') !== search.type.toLocaleLowerCase('en-GB')) return false
  if (search.beds !== undefined) {
    if (typeof item.bedrooms !== 'number') return false
    if (search.beds === 0 ? item.bedrooms !== 0 : item.bedrooms < search.beds) return false
  }
  const words = (search.q ?? '').toLocaleLowerCase('en-GB').split(/\s+/).filter(Boolean)
  return words.every((word) => item.text.includes(word))
}

/** Collections and ready homes match on location, type, minimum bedrooms and keyword. */
export function matchesShowcaseSearch(property: Searchable, search: ShowcaseSearch): boolean {
  return matchesIndexItem(showcaseSearchIndexItem(property), search)
}

/**
 * How many homes (collections and existing homes) a search would show. It
 * follows the catalogue rule: a community whose overview matches a place or
 * keyword search shows all its collections when none match on their own.
 */
export function countShowcaseHomes(index: readonly ShowcaseSearchIndexItem[], search: ShowcaseSearch): number {
  const homes = index.filter((item) => !item.overview)
  const matched = homes.filter((item) => matchesIndexItem(item, search))
  let count = matched.length
  if (search.type === undefined && search.beds === undefined) {
    for (const overview of index.filter((item) => item.overview && matchesIndexItem(item, search))) {
      if (matched.some((item) => item.communityId === overview.communityId)) continue
      count += homes.filter((item) => item.communityId === overview.communityId).length
    }
  }
  return count
}

/** The count if one filter were set to `value`, with narrower place filters cleared. */
export function countShowcaseHomesWith(
  index: readonly ShowcaseSearchIndexItem[],
  search: ShowcaseSearch,
  key: 'country' | 'city' | 'area' | 'type' | 'beds',
  value: string | number,
): number {
  const next: ShowcaseSearch = { ...showcaseSearchWithout(search, key) }
  if (key === 'beds') next.beds = Number(value)
  else next[key] = String(value)
  return countShowcaseHomes(index, next)
}

export function homesLabel(count: number): string {
  return `${count} ${count === 1 ? 'home' : 'homes'}`
}

export interface ShowcaseActiveFilter {
  key: ShowcaseFilterKey
  label: string
  href: string
}

export function activeShowcaseFilters(search: ShowcaseSearch): ShowcaseActiveFilter[] {
  const filters: ShowcaseActiveFilter[] = []
  const add = (key: ShowcaseFilterKey, label: string) =>
    filters.push({ key, label, href: showcaseSearchHref(showcaseSearchWithout(search, key)) })
  if (search.country) add('country', search.country)
  if (search.city) add('city', search.city)
  if (search.area) add('area', search.area)
  if (search.type) add('type', search.type)
  if (search.beds !== undefined) add('beds', search.beds === 0 ? 'Studio' : `${search.beds}+ bedrooms`)
  if (search.q) add('q', `“${search.q}”`)
  return filters
}
