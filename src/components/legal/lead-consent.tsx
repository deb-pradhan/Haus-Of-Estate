"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeadConsentProps {
  /** Unique prefix so several forms can coexist on a page. */
  idPrefix: string;
  marketing: boolean;
  onMarketingChange: (value: boolean) => void;
  /** What happens to the details, in one clause. */
  purpose?: string;
  className?: string;
}

/**
 * Standard consent block for every form that collects personal details.
 *
 * 1. A visible notice (NOT a checkbox): the service contact is necessary to
 *    answer the enquiry, so it is not conditional on consent.
 * 2. One optional, unticked marketing box. Submitting never requires it.
 */
export function LeadConsent({
  idPrefix,
  marketing,
  onMarketingChange,
  purpose = "reply to this enquiry and introduce you to a suitable agent or partner",
  className,
}: LeadConsentProps) {
  const id = `${idPrefix}-marketing`;
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs leading-relaxed text-muted-foreground">
        HAUS OF ESTATE LTD will use your details to {purpose}. See our{" "}
        <Link
          href="/legal/privacy-policy"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Privacy Policy
        </Link>
        .
      </p>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-2.5 py-2"
      >
        <input
          id={id}
          type="checkbox"
          checked={marketing}
          onChange={(e) => onMarketingChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-estate-700"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          Optional: send me property alerts and market updates by email. You can
          unsubscribe at any time.
        </span>
      </label>
    </div>
  );
}
