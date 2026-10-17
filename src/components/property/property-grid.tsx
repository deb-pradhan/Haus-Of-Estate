import { PropertyCard, PropertyCardSkeleton } from './property-card'
import type { PropertyCardData } from '@/lib/property-format'
import { Reveal } from '@/components/ui/reveal'
import { cn } from '@/lib/utils'

const GRID = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'

/** Responsive 1 / 2 / 3 column grid of property cards. */
export function PropertyGrid({
  properties,
  rentContext = false,
  headingLevel,
  revealFrom = 0,
  className,
}: {
  properties: PropertyCardData[]
  rentContext?: boolean
  headingLevel?: 'h2' | 'h3'
  /** Cards before this index render immediately (above the fold); later ones fade in. */
  revealFrom?: number
  className?: string
}) {
  return (
    <ul className={cn(GRID, className)}>
      {properties.map((p, i) => {
        const card = (
          <PropertyCard
            property={p}
            rentContext={rentContext}
            headingLevel={headingLevel}
          />
        )
        return i < revealFrom ? (
          <li key={p._id}>{card}</li>
        ) : (
          <Reveal as="li" key={p._id} delay={Math.min(i - revealFrom, 5) * 60}>
            {card}
          </Reveal>
        )
      })}
    </ul>
  )
}

export function PropertyGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={GRID} role="status" aria-label="Loading properties">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  )
}
