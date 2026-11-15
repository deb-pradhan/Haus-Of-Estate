import { getRegulatoryLines } from "@/lib/company-identity";
import { cn } from "@/lib/utils";

/**
 * Regulatory registrations, driven entirely by the optional fields in
 * lib/company-identity.ts. With none filled in it renders nothing, so the site
 * never states a registration it cannot evidence.
 */
export function RegulationBlock({ tone = "light", className }: {
  /** "dark" for the estate-green footer, "light" for paper pages. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const lines = getRegulatoryLines();
  if (lines.length === 0) return null;

  const dark = tone === "dark";
  return (
    <section aria-labelledby="regulation-heading" className={cn("space-y-2", className)}>
      <h3 id="regulation-heading" className={cn("text-xs font-semibold", dark ? "text-white/80" : "text-estate-700")}>
        Regulation
      </h3>
      <ul className={cn("space-y-1 text-xs leading-relaxed", dark ? "text-white/60" : "text-muted-foreground")}>
        {lines.map((line) => (
          <li key={line.label}>
            <span className={dark ? "text-white/80" : "text-foreground"}>{line.label}:</span> {line.value}
          </li>
        ))}
      </ul>
    </section>
  );
}
