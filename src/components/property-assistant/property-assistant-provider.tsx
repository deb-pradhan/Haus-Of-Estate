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
import { MessageSquareText, Sparkles } from "lucide-react";
import {
  assistantRouteScope,
  emitAssistantAnalytics,
  type AssistantRouteScope,
} from "./analytics";
import {
  consumeAssistantReopenMarker,
  readAssistantDraft,
  writeAssistantDraft,
} from "./session-storage";

const LazyPropertyAssistantPanel = dynamic(
  () =>
    import("./property-assistant-panel").then(
      (module) => module.PropertyAssistantPanel,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

const ASSISTANT_LAUNCHER_ID = "haus-property-assistant-launcher";

interface AssistantContextValue {
  enabled: boolean;
  isOpen: boolean;
  routeScope: AssistantRouteScope | null;
  openAssistant: (
    initialQuestion?: string,
    returnFocusTarget?: HTMLElement | null,
  ) => void;
  closeAssistant: () => void;
}

const PropertyAssistantContext = createContext<AssistantContextValue>({
  enabled: false,
  isOpen: false,
  routeScope: null,
  openAssistant: () => {},
  closeAssistant: () => {},
});

export function usePropertyAssistant() {
  return useContext(PropertyAssistantContext);
}

export function PropertyAssistantProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const pathname = usePathname();
  const routeScope = assistantRouteScope(pathname);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const [returnFocusId, setReturnFocusId] = useState(ASSISTANT_LAUNCHER_ID);
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ value: string; revision: number } | null>(
    null,
  );

  const openAssistant = useCallback(
    (initialQuestion?: string, returnFocusTarget?: HTMLElement | null) => {
      if (!enabled || !routeScope) return;
      const focusTarget =
        returnFocusTarget ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : launcherRef.current);
      setReturnFocusId(focusTarget?.id || ASSISTANT_LAUNCHER_ID);
      const value = initialQuestion?.trim().slice(0, 1_000);
      if (value) {
        writeAssistantDraft(value);
        setPrefill((current) => ({
          value,
          revision: (current?.revision || 0) + 1,
        }));
      }
      setIsOpen(true);
      emitAssistantAnalytics({
        name: "property_assistant_opened",
        routeScope,
      });
    },
    [enabled, routeScope],
  );

  const closeAssistant = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!enabled || !routeScope) return;
    if (consumeAssistantReopenMarker()) {
      const draft = readAssistantDraft();
      window.setTimeout(() => {
        if (window.location.pathname !== pathname) return;
        setReturnFocusId(ASSISTANT_LAUNCHER_ID);
        if (draft) setPrefill({ value: draft, revision: Date.now() });
        setIsOpen(true);
      }, 0);
    }
  }, [enabled, pathname, routeScope]);

  useEffect(() => {
    if (!isOpen || !routeScope) return;
    document.body.dataset.propertyAssistantOpen = "true";
    window.dispatchEvent(
      new CustomEvent("haus:property-assistant-state", { detail: { open: true } }),
    );
    return () => {
      delete document.body.dataset.propertyAssistantOpen;
      window.dispatchEvent(
        new CustomEvent("haus:property-assistant-state", { detail: { open: false } }),
      );
    };
  }, [isOpen, routeScope]);

  useEffect(() => {
    function closeForLeadModal() {
      setIsOpen(false);
    }
    window.addEventListener("haus:lead-modal-open", closeForLeadModal);
    return () => {
      window.removeEventListener("haus:lead-modal-open", closeForLeadModal);
    };
  }, []);

  const visibleOpen = enabled && Boolean(routeScope) && isOpen;
  const value = useMemo<AssistantContextValue>(
    () => ({
      enabled,
      isOpen: visibleOpen,
      routeScope,
      openAssistant,
      closeAssistant,
    }),
    [closeAssistant, enabled, openAssistant, routeScope, visibleOpen],
  );

  return (
    <PropertyAssistantContext.Provider value={value}>
      {children}
      {enabled && routeScope && (
        <button
          ref={launcherRef}
          id={ASSISTANT_LAUNCHER_ID}
          type="button"
          onClick={() => openAssistant()}
          className={`fixed bottom-6 right-6 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-estate-700 px-5 text-sm font-semibold text-white shadow-xl shadow-estate-700/20 transition-all hover:-translate-y-0.5 hover:bg-estate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 ${visibleOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}
          aria-label="Open Haus Property Assistant"
          aria-hidden={visibleOpen}
          tabIndex={visibleOpen ? -1 : 0}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/12">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-gold-400" aria-hidden="true" />
          </span>
          Ask Haus
        </button>
      )}
      {visibleOpen && routeScope && (
        <LazyPropertyAssistantPanel
          open={visibleOpen}
          onOpenChange={(open) => (open ? setIsOpen(true) : closeAssistant())}
          prefill={prefill}
          routeScope={routeScope}
          launcherRef={launcherRef}
          returnFocusId={returnFocusId}
        />
      )}
    </PropertyAssistantContext.Provider>
  );
}
