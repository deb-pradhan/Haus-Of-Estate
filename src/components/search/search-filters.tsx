"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import type { SearchFilters } from "@/types";

const areas = [
  "All Areas",
  "Dubai Marina",
  "Downtown Dubai",
  "Palm Jumeirah",
  "JBR",
  "Business Bay",
  "Arabian Ranches",
  "Emirates Hills",
  "DIFC",
  "Jumeirah Village Circle",
];

const propertyTypes = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "land", label: "Land" },
];

const listingTypes = [
  { value: "all", label: "Buy & Rent" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
  { value: "off-plan", label: "Off-Plan" },
];

const priceRanges = [
  { value: "any", label: "Any Price" },
  { value: "0-1000000", label: "Under 1M AED" },
  { value: "1000000-3000000", label: "1M - 3M AED" },
  { value: "3000000-5000000", label: "3M - 5M AED" },
  { value: "5000000-10000000", label: "5M - 10M AED" },
  { value: "10000000-999999999", label: "10M+ AED" },
];

const bedroomOptions = [
  { value: "any", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  resultCount?: number;
}

export function SearchFiltersBar({
  filters,
  onFiltersChange,
  resultCount,
}: SearchFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== "query" && key !== "sortBy"
  ).length;

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ query: filters.query, sortBy: filters.sortBy });
  };

  const FilterContent = () => (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="mb-1.5 text-xs">Area</Label>
        <Select
          value={filters.area ?? "All Areas"}
          onValueChange={(v) => updateFilter("area", v === "All Areas" ? undefined : v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 text-xs">Property Type</Label>
        <Select
          value={filters.propertyType ?? "all"}
          onValueChange={(v) => updateFilter("propertyType", v === "all" ? undefined : v as SearchFilters["propertyType"])}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {propertyTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 text-xs">Listing Type</Label>
        <Select
          value={filters.listingType ?? "all"}
          onValueChange={(v) => updateFilter("listingType", v === "all" ? undefined : v as SearchFilters["listingType"])}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {listingTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 text-xs">Price Range</Label>
        <Select
          value="any"
          onValueChange={(v) => {
            if (v === "any") {
              updateFilter("minPrice", undefined);
              updateFilter("maxPrice", undefined);
            } else {
              const [min, max] = v.split("-").map(Number);
              onFiltersChange({ ...filters, minPrice: min, maxPrice: max });
            }
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {priceRanges.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 text-xs">Bedrooms</Label>
        <div className="flex gap-1.5">
          {bedroomOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={
                (filters.minBedrooms?.toString() ?? "any") === opt.value
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="flex-1 text-xs"
              onClick={() =>
                updateFilter(
                  "minBedrooms",
                  opt.value === "any" ? undefined : Number(opt.value)
                )
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
          <X className="mr-1 h-3 w-3" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by area, building, or keyword..."
            value={filters.query ?? ""}
            onChange={(e) => updateFilter("query", e.target.value || undefined)}
            className="pl-9"
          />
        </div>

        {/* Desktop inline filters */}
        <div className="hidden gap-2 lg:flex">
          <Select
            value={filters.area ?? "All Areas"}
            onValueChange={(v) => updateFilter("area", v === "All Areas" ? undefined : v)}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.propertyType ?? "all"}
            onValueChange={(v) => updateFilter("propertyType", v === "all" ? undefined : v as SearchFilters["propertyType"])}
          >
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {propertyTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.listingType ?? "all"}
            onValueChange={(v) => updateFilter("listingType", v === "all" ? undefined : v as SearchFilters["listingType"])}
          >
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {listingTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile filter sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-estate-700 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent />
              <Button
                className="mt-6 w-full"
                onClick={() => setMobileOpen(false)}
              >
                Show {resultCount ?? 0} results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.area && (
            <Badge variant="secondary" className="gap-1 pl-2 text-xs">
              {filters.area}
              <button onClick={() => updateFilter("area", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.propertyType && (
            <Badge variant="secondary" className="gap-1 pl-2 text-xs">
              {filters.propertyType}
              <button onClick={() => updateFilter("propertyType", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.listingType && (
            <Badge variant="secondary" className="gap-1 pl-2 text-xs">
              {filters.listingType}
              <button onClick={() => updateFilter("listingType", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minBedrooms !== undefined && (
            <Badge variant="secondary" className="gap-1 pl-2 text-xs">
              {filters.minBedrooms === 0 ? "Studio" : `${filters.minBedrooms}+ Bed`}
              <button onClick={() => updateFilter("minBedrooms", undefined)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
