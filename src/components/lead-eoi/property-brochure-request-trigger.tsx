"use client";

import type { ReactNode } from "react";
import { useLeadEoi } from "./lead-eoi-controller";
import type { LeadBrochureRequest, LeadProjectContext } from "./types";

interface PropertyBrochureRequestTriggerProps {
  project: LeadProjectContext;
  design?: LeadBrochureRequest["design"];
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PropertyBrochureRequestTrigger({
  project,
  design,
  disabled = false,
  className,
  children = "Request full brochure",
}: PropertyBrochureRequestTriggerProps) {
  const { enabled, openLead } = useLeadEoi();
  const unavailable = disabled || !enabled;

  return (
    <button
      type="button"
      className={className}
      disabled={unavailable}
      title={
        disabled
          ? "Brochure requests are unavailable in this preview."
          : !enabled
            ? "Online brochure requests are currently unavailable."
            : undefined
      }
      onClick={() => {
        if (unavailable) return;
        openLead({
          project,
          interest: project.listingType?.length === 1 && project.listingType[0] === "rent"
            ? "rent"
            : "buy",
          brochureRequest: { design },
          surface: "manual_cta",
        });
      }}
    >
      {children}
    </button>
  );
}
