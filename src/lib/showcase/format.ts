import type { ShowcaseDesign } from './fixture'

/** Client-safe presentation helpers shared by server views and the design explorer. */

const areaFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export function formatArea(value: number): string {
  return `${areaFormatter.format(value)} sq ft`
}

export function formatAreaRange(min: number, max: number): string {
  return min === max ? formatArea(min) : `${areaFormatter.format(min)}–${areaFormatter.format(max)} sq ft`
}

/** "4-, 5- and 6-bedroom" from a set of collections, so counts are never read as a bedroom number. */
export function bedroomList(collections: readonly { bedrooms?: number }[]): string {
  const counts = [...new Set(collections.map((item) => item.bedrooms).filter((count): count is number => typeof count === 'number'))].sort((a, b) => a - b)
  if (!counts.length) return ''
  if (counts.length === 1) return `${counts[0]}-bedroom`
  return `${counts.slice(0, -1).map((count) => `${count}-`).join(', ')} and ${counts[counts.length - 1]}-bedroom`
}

export function designPositionLabel(design: Pick<ShowcaseDesign, 'position'>): string | undefined {
  if (design.position === 'standalone') return 'Standalone villa'
  if (design.position === 'corner') return 'Corner home'
  if (design.position === 'middle') return 'Middle home'
  return undefined
}

export function designMetaLabel(design: Pick<ShowcaseDesign, 'position' | 'rowHomes'>): string | undefined {
  return [design.rowHomes ? `${design.rowHomes}-home row` : undefined, designPositionLabel(design)].filter(Boolean).join(' · ') || undefined
}
