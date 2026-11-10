/**
 * One place for area figures, safe to use in server and client components.
 *
 * Source figures are stored in square feet. The square-metre figure is a
 * conversion for readers who think in metric, so it is always whole and always
 * shown beside the source figure, never instead of it.
 */

const SQ_M_PER_SQ_FT = 0.09290304

const wholeNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

function number(value: number, maximumFractionDigits: number): string {
  return maximumFractionDigits === 0
    ? wholeNumber.format(value)
    : new Intl.NumberFormat('en-GB', { maximumFractionDigits }).format(value)
}

export function squareFeetToSquareMetres(squareFeet: number): number {
  return squareFeet * SQ_M_PER_SQ_FT
}

/** "4,500 sq ft". Pass `maximumFractionDigits` to keep a source figure's decimals. */
export function formatSquareFeet(value: number, maximumFractionDigits = 0): string {
  return `${number(value, maximumFractionDigits)} sq ft`
}

/** "418 sq m", converted from a square-foot figure. */
export function formatSquareMetresFromSquareFeet(squareFeet: number): string {
  return `${wholeNumber.format(squareFeetToSquareMetres(squareFeet))} sq m`
}

/** "4,500 sq ft (418 sq m)": the source figure with its metric conversion. */
export function formatAreaWithMetric(squareFeet: number, maximumFractionDigits = 0): string {
  return `${formatSquareFeet(squareFeet, maximumFractionDigits)} (${formatSquareMetresFromSquareFeet(squareFeet)})`
}

/** "3,100–4,500 sq ft"; a single figure when both ends match. */
export function formatSquareFeetRange(min: number, max: number): string {
  return min === max ? formatSquareFeet(min) : `${wholeNumber.format(min)}–${wholeNumber.format(max)} sq ft`
}

/** "3,100–4,500 sq ft (288–418 sq m)". */
export function formatAreaRangeWithMetric(min: number, max: number): string {
  if (min === max) return formatAreaWithMetric(min)
  const metric = `${wholeNumber.format(squareFeetToSquareMetres(min))}–${wholeNumber.format(squareFeetToSquareMetres(max))} sq m`
  return `${formatSquareFeetRange(min, max)} (${metric})`
}
