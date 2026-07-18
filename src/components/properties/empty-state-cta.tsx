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

  // Tailored heading + body per branch.
  let heading: string;
  let body: string;
  if (isCommercial) {
    heading = "We don't have commercial listings published yet.";
    body =
      "Our commercial pipeline is sourced to brief. Tell an advisor what you're after — office, retail, a plot or a whole building — and we'll come back within two working hours with options that fit.";
  } else if (isRent) {
    heading = "No rentals on our live list — yet.";
    body =
      "Our published rentals are a small slice of what we have access to. Tell an advisor your brief and we'll come back within two working hours with options that fit.";
  } else {
    heading = "No exact match on our live list — yet.";
    body =
      "Our published listings are a small slice of what we have access to. Tell an advisor what you're after and we'll come back within two working hours with off-market options that fit your brief.";
  }

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
