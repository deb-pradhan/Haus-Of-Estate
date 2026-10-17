"use client";

import { ErrorPanel } from "@/components/error/error-panel";

// Renders inside the (main) layout, so the header and footer stay available.
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel error={error} reset={reset} />;
}
