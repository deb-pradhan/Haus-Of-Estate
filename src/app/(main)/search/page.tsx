"use client";

import { useState, useMemo } from "react";
import { SearchFiltersBar } from "@/components/search/search-filters";
import { PropertyGrid } from "@/components/property/property-grid";
import { properties } from "@/data/mock";
import type { SearchFilters } from "@/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({});

  const filtered = useMemo(() => {
    let result = [...properties];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.area.toLowerCase().includes(q) ||
          p.location.building?.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (filters.area) {
      result = result.filter((p) => p.location.area === filters.area);
    }
    if (filters.propertyType) {
      result = result.filter((p) => p.propertyType === filters.propertyType);
    }
    if (filters.listingType) {
      result = result.filter((p) => p.listingType === filters.listingType);
    }
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }
    if (filters.minBedrooms !== undefined) {
      result = result.filter((p) => p.bedrooms >= filters.minBedrooms!);
    }

    if (filters.sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "featured") {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium md:text-3xl">
          Search Properties
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} verified {filtered.length === 1 ? "property" : "properties"} in Dubai
        </p>
      </div>

      <SearchFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filtered.length}
      />

      <div className="mt-6">
        <PropertyGrid properties={filtered} />
      </div>
    </div>
  );
}
