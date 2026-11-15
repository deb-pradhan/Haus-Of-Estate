import { propertyMediaBadge, propertyMediaBadgePosition, type PropertyImageMetadata } from '@/lib/property-media'
import { cn } from '@/lib/utils'

/**
 * Labels a render or concept inside its frame. Renders nothing for a
 * photograph, a floor plan or an image no editor has classified. Place it
 * inside the image's `relative` container.
 */
export function PropertyMediaBadge({ image, className }: { image?: PropertyImageMetadata; className?: string }) {
  const label = propertyMediaBadge(image)
  if (!label) return null
  return (
    <span data-media-badge className={cn(
      'pointer-events-none absolute left-3 z-10 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold leading-4 text-estate-700 shadow-sm',
      propertyMediaBadgePosition(image) === 'top' ? 'top-3' : 'bottom-3',
      className,
    )}>
      {label}
    </span>
  )
}
