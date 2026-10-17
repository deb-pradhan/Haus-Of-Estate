import Link from "next/link";
import { getRegulatoryLines } from "@/lib/company-identity";
import { cn } from "@/lib/utils";

interface RegulationBlockProps {
  /** "dark" for the estate-green footer, "light" for paper pages. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * "Regulation and complaints" block. Driven entirely by the optional founder
 * fields in lib/company-identity.ts: with none configured it renders nothing,
 * so the site never claims a registration it cannot evidence.
 */
export function RegulationBlock({ tone = "light", className }: RegulationBlockProps) {
  const lines = getRegulatoryLines();
  if (lines.length === 0) return null;

  const dark = tone === "dark";
  return (
    <section aria-labelledby="regulation-heading" className={cn("space-y-2", className)}>
      <h3
        id="regulation-heading"
        className={cn(
          "text-xs font-semibold",
          dark ? "text-white" : "text-estate-700",
        )}
      >
        Regulation and complaints
      </h3>
      <ul className={cn("space-y-1 text-xs leading-relaxed", dark ? "text-white/70" : "text-muted-foreground")}>
        {lines.map((line) => (
          <li key={line.label}>
            <span className={dark ? "text-white/85" : "text-foreground"}>{line.label}:</span>{" "}
            {line.value}
          </li>
        ))}
        <li>
          <Link
            href="/legal/complaints"
            className={cn(
              "underline underline-offset-4 transition-colors",
              dark ? "hover:text-white" : "hover:text-estate-700",
            )}
          >
            How to make a complaint
          </Link>
        </li>
      </ul>
    </section>
  );
}
