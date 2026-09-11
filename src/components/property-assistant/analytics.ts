export type AssistantRouteScope = "home" | "properties" | "property_detail";

type AssistantAnalyticsEvent =
  | { name: "property_assistant_opened"; routeScope: AssistantRouteScope }
  | {
      name: "property_assistant_results_shown";
      routeScope: AssistantRouteScope;
      resultCount: number;
    }
  | { name: "property_assistant_adviser_handoff"; routeScope: AssistantRouteScope };

export function assistantRouteScope(pathname: string): AssistantRouteScope | null {
  if (pathname === "/") return "home";
  if (
    pathname === "/properties" ||
    pathname === "/properties/residential" ||
    pathname === "/properties/commercial"
  ) {
    return "properties";
  }
  if (pathname.startsWith("/properties/")) return "property_detail";
  return null;
}

export function buildAssistantAnalyticsPayload(event: AssistantAnalyticsEvent) {
  return {
    event: event.name,
    route_scope: event.routeScope,
    ...(event.name === "property_assistant_results_shown"
      ? { result_count: Math.max(0, Math.min(3, Math.trunc(event.resultCount))) }
      : {}),
  };
}

export function emitAssistantAnalytics(event: AssistantAnalyticsEvent) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(buildAssistantAnalyticsPayload(event));
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
