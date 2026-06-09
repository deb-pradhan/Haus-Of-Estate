"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";

export function EmptyStateCTA({
  intent,
}: {
  intent?: string;
}) {
  const { openBuyer } = useLeadModals();
  const verb = intent === "rent" ? "rental" : "match";

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center md:p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-estate-700/8 text-estate-700">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-5 font-serif text-2xl font-medium text-estate-700 md:text-3xl">
        No exact {verb} on our live list — yet.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        Our published listings are a small slice of what we have access to. Tell
        an advisor what you&apos;re after and we&apos;ll come back within two
        working hours with off-market options that fit your brief.
      </p>
      <button
        type="button"
        onClick={openBuyer}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-estate-700 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-estate-600"
      >
        Let an advisor find your {verb}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
