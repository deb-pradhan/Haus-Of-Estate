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
}

export type ShowcaseSearchParamsInput = Record<string, string | string[] | undefined>
export type ShowcaseFilterKey = keyof ShowcaseSearch

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

function matchesKeyword(property: Searchable, q?: string): boolean {
  const words = (q ?? '').toLocaleLowerCase('en-GB').split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = searchableText(property)
  return words.every((word) => text.includes(word))
}

/** Collections and ready homes match on location, type, minimum bedrooms and keyword. */
export function matchesShowcaseSearch(property: Searchable, search: ShowcaseSearch): boolean {
  if (!matchesPropertyLocation(property, search)) return false
  if (search.type && property.unitType.toLocaleLowerCase('en-GB') !== search.type.toLocaleLowerCase('en-GB')) return false
  if (search.beds !== undefined) {
    if (typeof property.bedrooms !== 'number') return false
    if (search.beds === 0 ? property.bedrooms !== 0 : property.bedrooms < search.beds) return false
  }
  return matchesKeyword(property, search.q)
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
