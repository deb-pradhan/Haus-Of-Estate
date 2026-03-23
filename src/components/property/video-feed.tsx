"use client";

import type { Property } from "@/types";
import { PropertyCard } from "./property-card";

interface VideoFeedProps {
  properties: Property[];
}

export function VideoFeed({ properties }: VideoFeedProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
      {properties.map((property) => (
        <div key={property.id} className="w-[280px] shrink-0 md:w-auto">
          <PropertyCard property={property} variant="video" />
        </div>
      ))}
    </div>
  );
}
