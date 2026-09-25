"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

export function EmptyStateCTA({
  category,
  intent,
}: {
  category?: string;
  intent?: string;
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
