import type { ShowcaseDesign } from './fixture'

/** Client-safe presentation helpers shared by server views and the design explorer. */

const areaFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export function formatArea(value: number): string {
  return `${areaFormatter.format(value)} sq ft`
}

export function formatAreaRange(min: number, max: number): string {
  return min === max ? formatArea(min) : `${areaFormatter.format(min)}–${areaFormatter.format(max)} sq ft`
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
