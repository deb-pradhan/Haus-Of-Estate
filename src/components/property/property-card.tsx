"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, BedDouble, Bath, Maximize, Play, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Property } from "@/types";
import { formatPrice } from "@/data/mock";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  variant?: "grid" | "list" | "video";
  onSave?: (id: string) => void;
  saved?: boolean;
}

export function PropertyCard({
  property,
  variant = "grid",
  onSave,
  saved = false,
}: PropertyCardProps) {
  if (variant === "video") {
    return <VideoCard property={property} onSave={onSave} saved={saved} />;
  }

  return (
    <Card className="group overflow-hidden border-border bg-surface transition-shadow hover:shadow-md">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={property.media.thumbnail}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {property.media.video && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
              <Play className="h-3 w-3 fill-white" />
              Video
            </div>
          )}

          <div className="absolute right-3 top-3 flex gap-1.5">
            {property.verified && (
              <Badge className="bg-trust-teal text-white border-0 text-[10px]">
                <BadgeCheck className="mr-0.5 h-3 w-3" /> Verified
              </Badge>
            )}
            {property.featured && (
              <Badge className="bg-gold-500 text-white border-0 text-[10px]">
                Featured
              </Badge>
            )}
          </div>

          <div className="absolute bottom-3 left-3">
            <span className="font-serif text-xl font-semibold text-white">
              {formatPrice(property.price)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={`/properties/${property.id}`} className="flex-1">
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-estate-700">
              {property.title}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              onSave?.(property.id);
            }}
          >
            <Heart
              className={cn("h-4 w-4", saved && "fill-estate-700 text-estate-700")}
            />
          </Button>
        </div>

        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {property.location.area}, {property.location.city}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Bed`}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.bathrooms} Bath
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5" />
            {property.area.toLocaleString()} {property.areaUnit}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.agent.avatar}
            alt={property.agent.name}
            width={24}
            height={24}
            className="rounded-full"
          />
          <div className="flex-1 text-xs">
            <span className="font-medium text-foreground">{property.agent.name}</span>
            <span className="ml-1 text-muted-foreground">· {property.agent.responseTime}</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {property.listingType === "off-plan" ? "Off-Plan" : property.listingType === "rent" ? "Rent" : "Sale"}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function VideoCard({
  property,
  onSave,
  saved,
}: {
  property: Property;
  onSave?: (id: string) => void;
  saved?: boolean;
}) {
  return (
    <Card className="group relative aspect-[9/16] w-full max-w-sm snap-center overflow-hidden border-0 bg-black">
      <Link href={`/properties/${property.id}`} className="block h-full">
        <Image
          src={property.media.thumbnail}
          alt={property.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {property.media.video && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              onSave?.(property.id);
            }}
          >
            <Heart className={cn("h-5 w-5", saved && "fill-white")} />
          </Button>
        </div>

        <div className="absolute left-3 top-3 flex gap-1.5">
          {property.verified && (
            <Badge className="bg-trust-teal/90 text-white border-0 text-[10px] backdrop-blur-sm">
              <BadgeCheck className="mr-0.5 h-3 w-3" /> Verified
            </Badge>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="mb-1 line-clamp-2 font-serif text-lg font-semibold text-white">
            {property.title}
          </h3>
          <div className="mb-2 flex items-center gap-1 text-xs text-white/70">
            <MapPin className="h-3 w-3" />
            {property.location.area}
          </div>
          <div className="mb-3 flex items-center gap-3 text-xs text-white/80">
            <span>{property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Bed`}</span>
            <span>·</span>
            <span>{property.area.toLocaleString()} {property.areaUnit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl font-semibold text-white">
              {formatPrice(property.price)}
            </span>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={property.agent.avatar}
                alt={property.agent.name}
                width={28}
                height={28}
                className="rounded-full border border-white/30"
              />
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
