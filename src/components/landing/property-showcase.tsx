import Image from "next/image";
import Link from "next/link";
import { Bed, MapPin, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenBuyerButton } from "@/components/lead-modal/open-buyer-button";
import { sanityFetch, urlFor } from "@/sanity";
import { FEATURED_PROPERTIES_QUERY } from "@/sanity/queries";

interface FeaturedProperty {
  _id: string;
  title: string;
  slug: string;
  community: string;
  city: string;
  category?: string;
  availability?: string[];
  listingType?: string[];
  unitType: string;
  bedrooms?: number;
  priceDisplay?: string;
  rentPriceDisplay?: string;
  completionStatus?: string;
  summary: string;
  featuredImage?: { alt?: string } & Record<string, unknown>;
}

const COMPLETION_LABEL: Record<string, string> = {
  completed: "Completed",
  "off-plan": "Off-plan",
  "completed-offplan": "Completed & off-plan",
};

function saleRentLabel(listingType?: string[]): string | null {
  if (!listingType || listingType.length === 0) return null;
  const sale = listingType.includes("sale");
  const rent = listingType.includes("rent");
  if (sale && rent) return "Sale · Rent";
  if (rent) return "For rent";
  if (sale) return "For sale";
  return null;
}

function buildAlt(property: FeaturedProperty): string {
  if (property.featuredImage?.alt) return property.featuredImage.alt;
  const beds =
    typeof property.bedrooms === "number"
      ? property.bedrooms === 0
        ? "Studio"
        : `${property.bedrooms}-bedroom`
      : "";
  const place = [property.community, property.city].filter(Boolean).join(", ");
  return [beds, property.unitType, place ? `in ${place}` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function PropertyCard({
  property,
}: {
  property: FeaturedProperty;
}) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-estate-700/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-estate-700">
        {property.featuredImage ? (
          <Image
            src={urlFor(property.featuredImage).width(800).height(600).url()}
            alt={buildAlt(property)}
            fill
            sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) 33vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-estate-600 to-estate-800">
            <Building2 className="h-10 w-10 text-white/30" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {property.completionStatus && (
            <span className="rounded-full bg-surface/95 px-3 py-1 text-[11px] font-semibold text-estate-700 shadow-sm">
              {COMPLETION_LABEL[property.completionStatus] ??
                property.completionStatus}
            </span>
          )}
          {saleRentLabel(property.listingType) && (
            <span className="rounded-full bg-estate-700/90 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              {saleRentLabel(property.listingType)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-serif text-[11px] font-semibold uppercase tracking-widest text-gold-500">
          {property.unitType}
        </p>
        <h3 className="mt-1 font-serif text-lg font-medium text-estate-700">
          {property.title}
        </h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
          {property.summary}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-serif text-base font-semibold text-estate-700">
            {property.priceDisplay || "Price on application"}
          </span>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            {typeof property.bedrooms === "number" && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {property.bedrooms === 0 ? "Studio" : property.bedrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {property.city}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function PropertyShowcase() {
  const { data } = await sanityFetch<FeaturedProperty[]>({
    query: FEATURED_PROPERTIES_QUERY,
  });
  const properties = data ?? [];

  if (properties.length === 0) return null;

  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-gold-500">
            Featured Properties
          </p>
          <h2 className="font-serif text-3xl font-medium text-estate-700 md:text-4xl">
            Homes worth a closer look.
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            A selection from our partner communities. Enquire and we&apos;ll
            connect you with a vetted agent.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/properties">
            <Button
              variant="outline"
              className="border-estate-700 text-estate-700 hover:bg-estate-700/5"
            >
              View all properties <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <OpenBuyerButton className="bg-estate-700 text-white hover:bg-estate-600">
            Find me something like this <ArrowRight className="ml-1.5 h-4 w-4" />
          </OpenBuyerButton>
        </div>
      </div>
    </section>
  );
}
