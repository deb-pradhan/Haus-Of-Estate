"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BotProtectionAction,
  BotProtectionClientConfig,
} from "@/lib/bot-protection/types";
import { Button } from "@/components/ui/button";

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_LOAD_TIMEOUT_MS = 10_000;

type TurnstileOptions = {
  sitekey: string;
  action: BotProtectionAction;
  size: "flexible";
  theme: "auto";
  retry: "never";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  "unsupported-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type ChallengeStatus =
  | "loading"
  | "verified"
  | "expired"
  | "error"
  | "unsupported";

const statusCopy: Record<ChallengeStatus, string> = {
  loading: "Loading security check...",
  verified: "Security check complete.",
  expired: "The security check expired. Try it again.",
  error: "The security check could not be completed. Try it again.",
  unsupported:
    "This browser cannot run the security check. Try a current browser.",
};

export function TurnstileChallenge({
  config,
  action,
  onTokenChange,
}: {
  config: BotProtectionClientConfig;
  action: BotProtectionAction;
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [status, setStatus] = useState<ChallengeStatus>("loading");
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(
    () => () => {
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      widgetIdRef.current = null;
    },
    [],
  );

  const renderWidget = useCallback(() => {
    if (
      !config.enabled ||
      !config.siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: config.siteKey,
        action,
        size: "flexible",
        theme: "auto",
        retry: "never",
        callback(token) {
          setStatus("verified");
          onTokenChangeRef.current(token);
        },
        "error-callback"() {
          setStatus("error");
          onTokenChangeRef.current(null);
        },
        "expired-callback"() {
          setStatus("expired");
          onTokenChangeRef.current(null);
        },
        "timeout-callback"() {
          setStatus("expired");
          onTokenChangeRef.current(null);
        },
        "unsupported-callback"() {
          setScriptFailed(true);
          setStatus("unsupported");
          onTokenChangeRef.current(null);
        },
      });
    } catch {
      setStatus("error");
      onTokenChangeRef.current(null);
    }
  }, [action, config]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(renderWidget);
    return () => window.cancelAnimationFrame(frame);
  }, [renderWidget]);

  useEffect(() => {
    if (!config.enabled || !config.siteKey || status !== "loading") return;

    const timeout = window.setTimeout(() => {
      if (!widgetIdRef.current) {
        setScriptFailed(true);
        setStatus("error");
        onTokenChangeRef.current(null);
      }
    }, SCRIPT_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [config, status]);

  function retry() {
    onTokenChangeRef.current(null);
    setStatus("loading");
    if (scriptFailed || !window.turnstile || !widgetIdRef.current) {
      window.location.reload();
      return;
    }
    window.turnstile.reset(widgetIdRef.current);
  }

  if (!config.enabled) return null;

  if (!config.siteKey) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive"
      >
        Security verification is temporarily unavailable. Please try again
        shortly.
      </div>
    );
  }

  return (
    <div
      aria-labelledby={`turnstile-label-${action}`}
      className="space-y-2"
      data-testid={`turnstile-${action}`}
    >
      <p
        id={`turnstile-label-${action}`}
        className="text-sm font-medium text-foreground"
      >
        Security check
      </p>
      <Script
        id="cloudflare-turnstile"
        src={TURNSTILE_SCRIPT}
        strategy="afterInteractive"
        onLoad={renderWidget}
        onReady={renderWidget}
        onError={() => {
          setScriptFailed(true);
          setStatus("error");
          onTokenChangeRef.current(null);
        }}
      />
      <div ref={containerRef} className="min-h-[65px] w-full" />
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {statusCopy[status]}
        </p>
        {(status === "expired" ||
          status === "error" ||
          status === "unsupported") && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={retry}
          >
            {scriptFailed ? "Reload" : "Retry"}
          </Button>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Protected by Cloudflare Turnstile.{" "}
        <a
          href="https://www.cloudflare.com/turnstile-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Privacy
        </a>
      </p>
    </div>
  );
}
