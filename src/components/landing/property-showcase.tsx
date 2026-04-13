"use client";

import Image from "next/image";
import { Bed, Bath, MapPin, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  image: string;
  location: string;
  country: string;
  beds: number;
  baths: number;
  price: string;
  currency: string;
  status: "sold" | "under-offer" | "new";
  headline: string;
}

const PROPERTIES: Property[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    location: "Dubai Marina",
    country: "UAE",
    beds: 2,
    baths: 2,
    price: "2.1",
    currency: "AED",
    status: "sold",
    headline: "Stunning Marina view, walk to the beach",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80",
    location: "Manchester City Centre",
    country: "UK",
    beds: 3,
    baths: 2,
    price: "680",
    currency: "GBP",
    status: "under-offer",
    headline: "Modern 3-bed with panoramic city views",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    location: "Canggu, Bali",
    country: "Bali",
    beds: 4,
    baths: 3,
    price: "8.5",
    currency: "IDR",
    status: "new",
    headline: "Tropical villa, 5 min to the beach",
  },
];

const STATUS_CONFIG = {
  sold: {
    label: "Sold",
    badgeClass: "bg-emerald-500 text-white",
    textClass: "text-emerald-600",
    labelText: "Secured by our buyer",
  },
  "under-offer": {
    label: "Under Offer",
    badgeClass: "bg-amber-500 text-white",
    textClass: "text-amber-600",
    labelText: "Deal in progress",
  },
  new: {
    label: "New Listing",
    badgeClass: "bg-blue-500 text-white",
    textClass: "text-blue-600",
    labelText: "Listed today",
  },
};

function PropertyCard({ property }: { property: Property }) {
  const config = STATUS_CONFIG[property.status];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-estate-700/5">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.image}
          alt={`${property.beds}-bed property in ${property.location}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <span className={`rounded-full ${config.badgeClass} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
            {config.label}
          </span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
          <button className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-estate-700 opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100">
            <Eye className="h-4 w-4" /> Quick View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {property.location}, {property.country}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{property.headline}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {property.beds} Beds
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {property.baths} Baths
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className={`font-serif text-xl font-semibold ${config.textClass}`}>
              {property.currency} {property.price}M
            </p>
            <p className="text-xs text-muted-foreground">{config.labelText}</p>
          </div>
          <Button
            size="sm"
            className="bg-estate-700 text-white hover:bg-estate-600"
          >
            Enquire <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PropertyShowcase() {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Featured Properties
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Real properties. Real results.
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            A selection of what we've helped our clients achieve across three continents.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="border-estate-700 text-estate-700 hover:bg-estate-700/5"
          >
            View All Properties <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
