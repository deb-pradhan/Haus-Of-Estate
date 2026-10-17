"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const WHATSAPP_URL =
  "https://wa.me/971585607033?utm_source=site&utm_medium=error&utm_campaign=whatsapp";

type ErrorPanelProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Section label shown as the eyebrow. */
  eyebrow?: string;
  /** Fill the viewport (used outside the main layout). */
  fullScreen?: boolean;
};

/**
 * Calm, on-brand recovery screen shared by the route-level error boundaries.
 * Never renders `error.message` (it can contain internals); shows the Next.js
 * digest as a reference the team can search for in server logs.
 */
export function ErrorPanel({
  error,
  reset,
  eyebrow = "Something went wrong",
  fullScreen = false,
}: ErrorPanelProps) {
  useEffect(() => {
    // Sanitised: name + digest only, no message or stack.
    console.error("[ui-error]", { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <section
      role="alert"
      className={`flex flex-col items-center justify-center bg-canvas px-4 text-center ${
        fullScreen ? "min-h-screen py-24" : "min-h-[60vh] py-20"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-700">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-tight text-ink-900 md:text-5xl">
        We couldn&rsquo;t load this page.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-slate-700 md:text-lg">
        That one is on us. Please try again in a moment, or speak to an advisor
        and we will pick it up with you directly.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            Speak to an advisor
          </a>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/">Back to home</Link>
        </Button>
      </div>

      {error.digest ? (
        <p className="mt-10 text-sm text-slate-700">
          Reference: <span className="tabular-nums">{error.digest}</span>
        </p>
      ) : null}
    </section>
  );
}
