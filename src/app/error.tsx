"use client";

import { ErrorPanel } from "@/components/error/error-panel";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPanel error={error} reset={reset} fullScreen />;
}
