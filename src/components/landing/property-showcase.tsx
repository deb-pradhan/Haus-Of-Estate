import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenBuyerButton } from "@/components/lead-modal/open-buyer-button";
import { Reveal } from "@/components/ui/reveal";
import { PropertyGrid } from "@/components/property/property-grid";
import { sanityFetch } from "@/sanity";
import { FEATURED_PROPERTIES_QUERY } from "@/sanity/queries";
import type { PropertyCardData } from "@/lib/property-format";

export async function PropertyShowcase() {
  const { data } = await sanityFetch<PropertyCardData[]>({
    query: FEATURED_PROPERTIES_QUERY,
    throwOnError: true,
  });
  const properties = data ?? [];

  if (properties.length === 0) return null;

  return (
    <section className="px-4 py-16 md:px-6 md:py-24" aria-labelledby="featured-properties-heading">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-10 max-w-2xl md:mb-12">
          <p className="eyebrow mb-3">Featured properties</p>
          <h2
            id="featured-properties-heading"
            className="font-serif text-[length:var(--text-title-2)] font-medium leading-tight tracking-[-0.015em] text-estate-900"
          >
            Homes worth a closer look.
          </h2>
          <p className="lede mt-3">
            A short selection from the homes we currently have published.
            Enquire and an adviser will reply to you directly.
          </p>
        </Reveal>

        <PropertyGrid properties={properties} headingLevel="h3" />

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/properties">
              See all properties <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <OpenBuyerButton size="lg">
            Tell us what you&apos;re looking for <ArrowRight aria-hidden="true" />
          </OpenBuyerButton>
        </div>
      </div>
    </section>
  );
}
