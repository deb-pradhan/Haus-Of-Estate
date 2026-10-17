import { PropertyGridSkeleton } from '@/components/property/property-grid'

export default function PropertiesLoading() {
  return (
    <div className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-24 max-w-xl animate-pulse rounded-2xl bg-estate-700/10" />
        <div className="mb-8 h-44 animate-pulse rounded-[28px] bg-surface shadow-e1 md:h-32" />
        <PropertyGridSkeleton count={3} />
      </div>
    </div>
  )
}
