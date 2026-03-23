import type { Property } from "@/types";
import { PropertyCard } from "./property-card";

interface PropertyGridProps {
  properties: Property[];
  variant?: "grid" | "list";
}

export function PropertyGrid({ properties, variant = "grid" }: PropertyGridProps) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">No properties found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} variant={variant} />
      ))}
    </div>
  );
}
