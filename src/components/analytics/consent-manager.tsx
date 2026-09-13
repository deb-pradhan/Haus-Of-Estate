"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  analyticsPage, getAnalyticsConsent, installAnalyticsNavigationGuard, publicPath,
  saveAnalyticsConsent, SETTINGS_EVENT, subscribeConsent, syncAnalytics, trackPublicClick,
} from "@/lib/analytics";

export function ConsentManager({ gtmId, draft, production }: { gtmId?: string; draft: boolean; production: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const consent = useSyncExternalStore(subscribeConsent, getAnalyticsConsent, () => "unknown" as const);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const showSettings = () => setSettingsOpen(true);
    const resume = () => syncAnalytics({ gtmId, draft, production });
    const visibility = () => { if (document.visibilityState === "visible") resume(); };
    // Render after hydration so server and browser agree on local consent.
    const timer = window.setTimeout(() => setMounted(true), 0);
    window.addEventListener(SETTINGS_EVENT, showSettings);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("click", trackPublicClick, true);
    const removeGuard = installAnalyticsNavigationGuard();
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SETTINGS_EVENT, showSettings);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("click", trackPublicClick, true);
      removeGuard();
    };
  }, [gtmId, draft, production]);

  useEffect(() => {
    syncAnalytics({ gtmId, draft, production });
  }, [consent, pathname, search, gtmId, draft, production]);

  // Suppress the prompt along with analytics on private/draft/preview routes.
  const publicScreen = mounted && !draft && publicPath(pathname);
  const eligible = mounted && analyticsPage(window.location.href, draft, production);
  if (!publicScreen || (!settingsOpen && (!eligible || consent !== "unknown" || !gtmId))) return null;

  function choose(value: "granted" | "denied") {
    saveAnalyticsConsent(value);
    syncAnalytics({ gtmId, draft, production });
    setSettingsOpen(false);
  }

  return (
    <section role="region" aria-label="Cookie settings" className="fixed inset-x-3 bottom-20 z-[100] mx-auto max-w-2xl rounded-xl border border-border bg-white p-5 text-slate-900 shadow-2xl md:bottom-4">
      <h2 className="text-lg font-semibold">Your cookie choices</h2>
      <p className="mt-2 text-sm leading-relaxed">
        Essential storage keeps the site working. With your permission, we use Google Analytics to understand public page visits and clicks. Advertising tracking stays off. You can change your choice at any time using Cookie Settings in the footer.
      </p>
      <a href="/legal/cookie-policy" className="mt-2 inline-block text-sm underline">Read our cookie policy</a>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("denied")} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium">Reject analytics</button>
        <button type="button" onClick={() => choose("granted")} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium">Accept analytics</button>
        {settingsOpen && consent !== "unknown" && <button type="button" onClick={() => setSettingsOpen(false)} className="px-4 py-2 text-sm underline">Keep current choice</button>}
      </div>
    </section>
  );
}

export function CookieSettingsButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(SETTINGS_EVENT))} className="text-left underline underline-offset-4 hover:text-white">Cookie Settings</button>;
}
