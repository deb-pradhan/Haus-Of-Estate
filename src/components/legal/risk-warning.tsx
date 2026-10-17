import { cn } from "@/lib/utils";

/**
 * Standard risk warnings for property information and investment-style copy.
 * Source wording: docs/mega-upgrade/audits/legal.md (P1-3). Wording changes
 * should be reviewed by a solicitor before they ship.
 */
export const RISK_WARNING_GENERAL =
  "This is general property information, not financial, tax, legal or investment advice. Property values and rents can fall as well as rise, and you may get back less than you invest.";

export const RISK_WARNING_OVERSEAS =
  "Overseas property carries extra risks: currency movements, local taxes and ownership rules, limited resale liquidity, and different consumer protections. Take independent regulated advice.";

export const RISK_WARNING_OFF_PLAN =
  "Off-plan purchases carry delivery and completion risk.";

interface RiskWarningProps {
  /** Add the off-plan sentence. */
  offPlan?: boolean;
  /** Omit the overseas sentence (for UK-only copy). */
  domestic?: boolean;
  /** Tone: "light" on paper, "dark" on estate-green bands. */
  tone?: "light" | "dark";
  className?: string;
}

export function RiskWarning({
  offPlan = false,
  domestic = false,
  tone = "light",
  className,
}: RiskWarningProps) {
  return (
    <aside
      aria-label="Risk warning"
      className={cn(
        "rounded-xl border px-4 py-3 text-xs leading-relaxed",
        tone === "light"
          ? "border-estate-700/15 bg-white/60 text-ink-900/80"
          : "border-white/20 bg-white/5 text-white/80",
        className,
      )}
    >
      <p>
        <strong className="font-semibold">Risk warning. </strong>
        {RISK_WARNING_GENERAL}
        {domestic ? "" : ` ${RISK_WARNING_OVERSEAS}`}
        {offPlan ? ` ${RISK_WARNING_OFF_PLAN}` : ""}
      </p>
    </aside>
  );
}
