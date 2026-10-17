"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "@/components/lead-modal/modal-context";

/**
 * Helpful empty state: says plainly there is no match, offers a way to widen
 * the search, and routes to the enquiry flow.
 */
export function EmptyStateCTA({
  category,
  intent,
  clearHref,
}: {
  category?: string;
  intent?: string;
  /** When filters are active, a link that clears them. */
  clearHref?: string;
}) {
  const { openBuyer } = useLeadModals();
  const isRent = intent === "rent";
  const isCommercial = category === "commercial";

  let heading: string;
  let body: string;
  if (isCommercial) {
    heading = "No commercial properties are published yet.";
    body =
      "Tell us what you need, whether that is an office, retail unit, plot or building, and an adviser will come back to you with suitable options.";
  } else if (isRent) {
    heading = "No rentals are published at the moment.";
    body =
      "Tell us where and when you need to move, and an adviser will come back to you with suitable options.";
  } else {
    heading = "Nothing published matches that search.";
    body =
      "Try widening your search, or tell us what you are looking for and an adviser will come back to you with suitable options.";
  }

  return (
    <div className="rounded-[28px] bg-surface p-8 text-center shadow-e1 md:p-14">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-estate-700/10 text-estate-700">
        <Search aria-hidden="true" className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-serif text-[length:var(--text-title-3)] font-medium text-estate-900">
        {heading}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Button type="button" size="lg" onClick={openBuyer}>
          Tell us what you&apos;re looking for
          <ArrowRight aria-hidden="true" />
        </Button>
        {clearHref && (
          <Button asChild size="lg" variant="outline">
            <Link href={clearHref}>Clear filters</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
