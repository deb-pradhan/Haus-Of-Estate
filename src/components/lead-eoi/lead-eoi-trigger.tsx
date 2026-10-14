"use client";

import type { ReactNode } from "react";
import { useLeadEoi } from "./lead-eoi-controller";
import type { LeadOpenOptions } from "./types";

interface LeadEoiTriggerProps {
  children: ReactNode;
  className?: string;
  options?: LeadOpenOptions;
  fallbackHref?: string;
}
export function LeadEoiTrigger({
  children,
  className,
  options,
  fallbackHref = "/contact",
}: LeadEoiTriggerProps) {
  const { enabled, openLead } = useLeadEoi();

  if (!enabled) {
    return (
      <a href={fallbackHref} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLead(options)}
      className={className}
    >
      {children}
    </button>
  );
}
