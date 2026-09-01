"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { primeLeadAttribution } from "./attribution";
import type {
  LeadFormRequest,
  LeadOpenOptions,
  LeadProjectContext,
} from "./types";

const AUTO_POPUP_DELAY_MS = 3_000;
const AUTO_POPUP_SESSION_KEY = "haus_lead_popup_seen_v4";

const LazyLeadEoiModal = dynamic(
  () => import("./lead-eoi-modal").then((module) => module.LeadEoiModal),
  { ssr: false },
);

interface LeadEoiContextValue {
  enabled: boolean;
  openLead: (options?: LeadOpenOptions) => void;
  closeLead: () => void;
  setPageProject: (project: LeadProjectContext | null) => void;
}

const LeadEoiContext = createContext<LeadEoiContextValue>({
  enabled: false,
  openLead: () => {},
  closeLead: () => {},
  setPageProject: () => {},
});

function isAutoPopupRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "/about" || pathname === "/services") {
    return true;
  }

  return (
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname === "/properties" ||
    pathname.startsWith("/properties/")
  );
}

function hasSeenAutoPopup(): boolean {
  try {
    return window.sessionStorage.getItem(AUTO_POPUP_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function suppressAutoPopup() {
  try {
    window.sessionStorage.setItem(AUTO_POPUP_SESSION_KEY, "true");
  } catch {
    // Session storage is an enhancement; do not block the enquiry form.
  }
}

export function useLeadEoi() {
  return useContext(LeadEoiContext);
}

export function LeadEoiProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [request, setRequest] = useState<LeadFormRequest | null>(null);
  const [pageProject, setPageProject] = useState<LeadProjectContext | null>(
    null,
  );
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const closeLead = useCallback(() => {
    setRequest(null);
    const returnTarget = returnFocusRef.current;
    returnFocusRef.current = null;
    if (returnTarget) {
      window.requestAnimationFrame(() => {
        if (document.contains(returnTarget)) returnTarget.focus();
      });
    }
  }, []);

  const openLead = useCallback(
    (options: LeadOpenOptions = {}) => {
      suppressAutoPopup();
      const activeElement = document.activeElement;
      returnFocusRef.current =
        activeElement instanceof HTMLElement && activeElement !== document.body
          ? activeElement
          : null;
      setRequest({
        ...options,
        instanceId: crypto.randomUUID(),
        project: options.project ?? pageProject ?? undefined,
        surface: options.surface ?? "manual_cta",
      });
    },
    [pageProject],
  );

  useEffect(() => {
    primeLeadAttribution();
  }, [pathname]);

  useEffect(() => {
    if (!isAutoPopupRoute(pathname) || hasSeenAutoPopup()) return;

    const timeout = window.setTimeout(() => {
      if (!hasSeenAutoPopup()) {
        openLead({ surface: "modal" });
      }
    }, AUTO_POPUP_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [openLead, pathname]);

  const value = useMemo<LeadEoiContextValue>(
    () => ({
      enabled: true,
      openLead,
      closeLead,
      setPageProject,
    }),
    [closeLead, openLead],
  );

  return (
    <LeadEoiContext.Provider value={value}>
      {children}
      {request ? (
        <LazyLeadEoiModal
          key={request.instanceId}
          request={request}
          onClose={closeLead}
        />
      ) : null}
    </LeadEoiContext.Provider>
  );
}
