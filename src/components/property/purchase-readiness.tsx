import {
  BadgeCheck,
  ExternalLink,
  FileCheck2,
  Landmark,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { LeadEoiTrigger } from "@/components/lead-eoi/lead-eoi-trigger";
import type { LeadProjectContext } from "@/components/lead-eoi/types";
import type { PurchaseReadinessGuidance } from "@/lib/purchase-readiness";

const STEP_ICONS = [
  BadgeCheck,
  FileCheck2,
  ShieldCheck,
  Landmark,
  ReceiptText,
] as const;

interface PurchaseReadinessProps {
  fallbackHref: string;
  guidance: PurchaseReadinessGuidance;
  project: LeadProjectContext;
}

export function PurchaseReadiness({
  fallbackHref,
  guidance,
  project,
}: PurchaseReadinessProps) {
  return (
    <section
      aria-labelledby="purchase-readiness-title"
      className="mt-12 border-y border-estate-700/15 bg-estate-700/[0.035] py-9"
      data-testid="purchase-readiness"
    >
      <div className="grid gap-8 px-1 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] md:gap-10">
        <div>
          <p className="font-serif text-xs font-medium uppercase tracking-[0.22em] text-gold-500">
            Purchase readiness
          </p>
          <h2
            id="purchase-readiness-title"
            className="mt-2 font-serif text-2xl font-medium text-estate-700 md:text-3xl"
          >
            How protected payment works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Haus does not take, hold, or forward client funds. This guide shows
            the checks that should happen before any transfer for this property.
          </p>
          <p className="mt-4 inline-flex min-h-8 items-center gap-2 rounded-full border border-estate-700/20 bg-surface px-3 text-xs font-medium text-estate-700">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            No payment is taken here
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {guidance.marketLabel}. General information only, not legal, tax,
            financial, or investment advice.
          </p>
          {guidance.officialGuidance ? (
            <a
              href={guidance.officialGuidance.href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-estate-700 underline-offset-4 hover:underline"
            >
              {guidance.officialGuidance.label}
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>

        <div>
          <ol className="divide-y divide-estate-700/10 border-t border-estate-700/10">
            {guidance.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <li
                  key={step.title}
                  className="grid grid-cols-[2.75rem_1fr] gap-3 py-4"
                >
                  <span className="flex h-11 w-11 items-center justify-center text-estate-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-estate-700">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 flex flex-col items-start gap-3 border-t border-estate-700/10 pt-5 sm:flex-row sm:items-center">
            <LeadEoiTrigger
              fallbackHref={fallbackHref}
              options={{
                interest: "buy",
                project,
                surface: "manual_cta",
              }}
              className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-estate-700 px-5 text-sm font-medium text-white transition-colors hover:bg-estate-600"
            >
              Request purchase details
            </LeadEoiTrigger>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This sends an enquiry only. It does not reserve the property or
              initiate a transfer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
