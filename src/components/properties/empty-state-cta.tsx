"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

export function EmptyStateCTA({
  category,
  intent,
  clearHref,
  widenings = [],
}: {
  category?: string;
  intent?: string;
  /** Where "Clear filters" goes; omitted when there is nothing to clear. */
  clearHref?: string;
  /** One wider search per active filter: the same search without that filter. */
  widenings?: { label: string; href: string }[];
}) {
  const { openBuyer } = useLeadModals();
  const isRent = intent === "rent";
  const isCommercial = category === "commercial";

  const verb = isRent ? "rental" : "match";

  const heading = isCommercial
    ? "No published commercial properties match these filters."
    : isRent
      ? "No published rentals match these filters."
      : "No published properties match these filters.";
  const body = "Try changing your filters or share your requirements with our team.";

  const ctaLabel = isCommercial
    ? "Tell us your commercial brief"
    : `Let an advisor find your ${verb}`;

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center md:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-estate-700/8 text-estate-700">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-medium text-estate-700 md:text-3xl">
        {heading}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        {body}
      </p>
      {(widenings.length > 0 || clearHref) && (
        <ul aria-label="Wider searches" className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
          {widenings.map((widening) => (
            <li key={widening.href + widening.label}>
              <Link href={widening.href} className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-estate-700 transition-colors hover:border-estate-700/40">
                Without {widening.label}
              </Link>
            </li>
          ))}
          {clearHref && (
            <li>
              <Link href={clearHref} className="inline-flex min-h-11 items-center rounded-full border border-estate-700/40 bg-background px-4 text-sm font-semibold text-estate-700 transition-colors hover:bg-estate-700/5">
                Clear filters
              </Link>
            </li>
          )}
        </ul>
      )}
      <button
        type="button"
        onClick={openBuyer}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-estate-600"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
