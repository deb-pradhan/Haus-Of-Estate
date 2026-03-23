"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyGrid } from "@/components/property/property-grid";
import { properties } from "@/data/mock";

const savedProperties = properties.slice(0, 2);

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium">Saved Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {savedProperties.length} {savedProperties.length === 1 ? "property" : "properties"} saved
        </p>
      </div>

      {savedProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">No saved properties</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart icon on any property to save it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/search">Browse Properties</Link>
          </Button>
        </div>
      ) : (
        <PropertyGrid properties={savedProperties} />
      )}
    </div>
  );
}
