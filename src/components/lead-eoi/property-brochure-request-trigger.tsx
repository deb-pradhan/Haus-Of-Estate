"use client";

import type { ReactNode } from "react";
import { useLeadEoi } from "./lead-eoi-controller";
import type { LeadBrochureRequest, LeadProjectContext } from "./types";
import { useLeadReadiness } from "./use-lead-readiness";

interface PropertyBrochureRequestTriggerProps {
  project: LeadProjectContext;
  design?: LeadBrochureRequest["design"];
  /** False when the published design carries no collection brochure key; the button then offers an enquiry. */
  brochureMapped?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PropertyBrochureRequestTrigger({
  project,
  design,
  brochureMapped = true,
  disabled = false,
  className,
  children = "Request full brochure",
}: PropertyBrochureRequestTriggerProps) {
  const { enabled, openLead } = useLeadEoi();
  const readiness = useLeadReadiness(enabled && !disabled);
  const unavailable = disabled || !enabled || !readiness?.intakeReady;
  const brochureEnabled = readiness?.brochureEmailEnabled === true && brochureMapped;

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
            : !readiness?.intakeReady
              ? "Online enquiries are currently unavailable."
              : readiness?.brochureEmailEnabled !== true
                ? "Brochure email is currently unavailable. You can enquire about this property."
                : !brochureMapped
                  ? "A brochure for this design is not yet available by email. You can enquire about this property."
                  : undefined
      }
      onClick={() => {
        if (unavailable) return;
        openLead({
          project,
          interest: project.listingType?.length === 1 && project.listingType[0] === "rent"
            ? "rent"
            : "buy",
          // Retain the requested design for staff follow-up even while email is
          // unavailable. The form checks readiness before requesting delivery, and
          // an unmapped design is sent as an enquiry rather than a failing request.
          brochureRequest: { design, ...(brochureMapped ? {} : { emailUnavailable: true }) },
          surface: "manual_cta",
        });
      }}
    >
      {readiness?.intakeReady && !brochureEnabled ? "Enquire about this property" : children}
    </button>
  );
}
