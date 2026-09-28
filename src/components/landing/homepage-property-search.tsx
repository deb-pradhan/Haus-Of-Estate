"use client";

import { ArrowRight, Tag } from "lucide-react";
import { useLeadModals } from "@/components/lead-modal/modal-context";
import { PropertySearchForm } from "@/components/properties/property-search-form";

export function HomepagePropertySearch() {
  const { openSeller } = useLeadModals();
  return (
    <div className="mt-8">
      <PropertySearchForm />
      <p className="mt-4 text-sm text-white/75">
        Selling your home?{" "}
        <button type="button" onClick={openSeller} className="inline-flex items-center gap-1 font-semibold text-gold-400 underline-offset-4 hover:underline">
          <Tag className="h-3.5 w-3.5" /> Talk to our team <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </p>
    </div>
  );
}
