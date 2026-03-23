import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Share2,
  Heart,
  BadgeCheck,
  CalendarPlus,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AgentCard } from "@/components/agent/agent-card";
import { PropertyGrid } from "@/components/property/property-grid";
import { getProperty, getAgent, getAgentProperties, formatPrice } from "@/data/mock";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = getProperty(id);

  if (!property) {
    notFound();
  }

  const agent = getAgent(property.agent.id);
  const similarProperties = getAgentProperties(property.agent.id)
    .filter((p) => p.id !== property.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Back nav */}
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/search">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to search
          </Link>
        </Button>
      </div>

      {/* Image gallery */}
      <div className="mb-6 grid gap-2 overflow-hidden rounded-xl md:grid-cols-4 md:grid-rows-2">
        <div className="relative aspect-[4/3] md:col-span-2 md:row-span-2">
          <Image
            src={property.media.images[0]}
            alt={property.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {property.media.images.slice(1, 3).map((img, i) => (
          <div key={i} className="relative hidden aspect-[4/3] md:block">
            <Image
              src={img}
              alt={`${property.title} - ${i + 2}`}
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start gap-2">
            {property.verified && (
              <Badge className="bg-trust-teal text-white border-0">
                <BadgeCheck className="mr-1 h-3 w-3" />
                Verified Listing
              </Badge>
            )}
            {property.featured && (
              <Badge className="bg-gold-500 text-white border-0">Featured</Badge>
            )}
            <Badge variant="secondary">
              {property.listingType === "off-plan"
                ? "Off-Plan"
                : property.listingType === "rent"
                  ? "For Rent"
                  : "For Sale"}
            </Badge>
          </div>

          <h1 className="font-serif text-2xl font-medium leading-tight md:text-3xl">
            {property.title}
          </h1>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {property.location.building && `${property.location.building}, `}
            {property.location.area}, {property.location.city}
          </div>

          <div className="mt-4 font-serif text-3xl font-semibold text-estate-700">
            {formatPrice(property.price)}
          </div>

          <Separator className="my-6" />

          {/* Key facts */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-subtle p-4 text-center">
              <BedDouble className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {property.bedrooms === 0 ? "Studio" : property.bedrooms}
              </p>
              <p className="text-xs text-muted-foreground">
                {property.bedrooms === 0 ? "" : "Bedrooms"}
              </p>
            </div>
            <div className="rounded-lg bg-subtle p-4 text-center">
              <Bath className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-lg font-semibold">{property.bathrooms}</p>
              <p className="text-xs text-muted-foreground">Bathrooms</p>
            </div>
            <div className="rounded-lg bg-subtle p-4 text-center">
              <Maximize className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {property.area.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{property.areaUnit}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="mb-3 font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {property.description}
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h2 className="mb-3 font-semibold">Features & Amenities</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {property.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-trust-teal" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Verification info */}
          <Card className="mb-6 border-trust-teal/20 bg-trust-teal/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-trust-teal" />
                <div>
                  <h3 className="text-sm font-semibold">Verification Status</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This listing has been verified. Last updated{" "}
                    {new Date(property.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Agent card */}
          {agent && <AgentCard agent={agent} />}

          {/* Action buttons */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <Button className="w-full" size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Agent
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Book Viewing
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm">
                  <Heart className="mr-1.5 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  <Share2 className="mr-1.5 h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{property.propertyType}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listing</span>
                  <span className="font-medium capitalize">{property.listingType}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price/sqft</span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(Math.round(property.price / property.area))}/sqft
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listed</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(property.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar properties */}
      {similarProperties.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-xl font-medium">
            More from {property.agent.name}
          </h2>
          <PropertyGrid properties={similarProperties} />
        </section>
      )}
    </div>
  );
}
