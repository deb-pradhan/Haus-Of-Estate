"use client";

import { useEffect, useState } from "react";

interface LeadReadiness {
  intakeReady: boolean;
  brochureEmailEnabled: boolean;
}

const unavailable: LeadReadiness = { intakeReady: false, brochureEmailEnabled: false };
let pending: Promise<LeadReadiness> | undefined;
let cached: LeadReadiness | undefined;
let expiresAt = 0;

/** Share a short-lived check across the collection's many design buttons. */
function getReadiness(): Promise<LeadReadiness> {
  if (pending) return pending;
  if (cached && Date.now() < expiresAt) return Promise.resolve(cached);

  pending = fetch("/api/leads", {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  }).then(async (response) => {
    if (!response.ok) return unavailable;
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return unavailable;
    const data = body as Partial<LeadReadiness>;
    return {
      intakeReady: data.intakeReady === true,
      brochureEmailEnabled: data.intakeReady === true && data.brochureEmailEnabled === true,
    };
  }).catch(() => unavailable).then((result) => {
    cached = result;
    expiresAt = Date.now() + 10_000;
    pending = undefined;
    return result;
  });
  return pending;
}

export function useLeadReadiness(check: boolean) {
  const [readiness, setReadiness] = useState<LeadReadiness | null>(null);
  useEffect(() => {
    if (!check) return;
    let active = true;
    const refresh = () => {
      void getReadiness().then((result) => {
        if (active) setReadiness(result);
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [check]);
  return check ? readiness : null;
}
