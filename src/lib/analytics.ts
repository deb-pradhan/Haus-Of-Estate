// Only these public destinations and coarse interaction values may reach GTM.
export const CONSENT_KEY = "haus.analytics-consent.v1";
export const CONSENT_EVENT = "haus:analytics-consent";
export const SETTINGS_EVENT = "haus:cookie-settings";
export type AnalyticsConsent = "granted" | "denied" | "unknown";
export type AnalyticsEvent =
  | "haus_page_view" | "haus_property_click" | "haus_article_click" | "haus_contact_click" | "haus_property_search"
  | "form_view" | "form_start" | "lead_submit_success" | "newsletter_opt_in"
  | "property_assistant_opened" | "property_assistant_results_shown" | "property_assistant_adviser_handoff";

const LEAD_EVENTS = new Set(["form_view", "form_start", "lead_submit_success", "newsletter_opt_in"]);
const ASSISTANT_EVENTS = new Set(["property_assistant_opened", "property_assistant_results_shown", "property_assistant_adviser_handoff"]);

const PUBLIC_PAGES = new Set([
  "/", "/about", "/team", "/services", "/renovations", "/faq", "/contact",
  "/list-property", "/register-interest", "/careers", "/blog", "/properties", "/properties/residential",
  "/properties/commercial", "/legal/privacy-policy", "/legal/cookie-policy", "/legal/terms-of-service",
]);

export function publicPath(pathname: string): string | null {
  const path = pathname.replace(/\/$/, "") || "/";
  return PUBLIC_PAGES.has(path) || /^\/(properties|blog|careers)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)
    ? path : null;
}

export function analyticsHosts(configured?: string): string[] {
  if (!configured?.trim()) return ["hausofestate.com", "www.hausofestate.com"];
  // Exact hostnames only: no wildcard, URL, path or port. An invalid explicit
  // list fails closed rather than silently enabling the default hosts.
  return configured.split(",").map((host) => host.trim().toLowerCase())
    .filter((host) => /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(host));
}

export function analyticsPage(href: string, draft = false, production = true, allowedHosts?: string) {
  const url = new URL(href);
  if (!production || draft || !analyticsHosts(allowedHosts).includes(url.hostname)) return null;
  if ([...url.searchParams.keys()].some((key) => /preview|draft|token|secret/i.test(key))) return null;
  const path = publicPath(url.pathname);
  if (!path) return null;
  return {
    page_path: path,
    page_location: `https://hausofestate.com${path}`,
    page_referrer: "",
    // Never read document.title: auth/errors or arbitrary search text may appear there.
    page_title: path === "/" ? "Home" : path.split("/")[1],
  };
}

export function consentFromStorage(raw: string | null, now = Date.now()): AnalyticsConsent {
  try {
    const value = JSON.parse(raw || "null");
    return value?.version === 1 && value.expiresAt > now && ["granted", "denied"].includes(value.analytics)
      ? value.analytics : "unknown";
  } catch { return "unknown"; }
}

let memoryConsent: AnalyticsConsent = "unknown";
export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unknown";
  try { return consentFromStorage(window.localStorage.getItem(CONSENT_KEY)); }
  catch { return memoryConsent; }
}

export function saveAnalyticsConsent(value: "granted" | "denied") {
  memoryConsent = value;
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, analytics: value, expiresAt: Date.now() + 180 * 86400_000 }));
  } catch { /* Keep the choice for this document when storage is unavailable. */ }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function subscribeConsent(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === CONSENT_KEY || event.key === null) listener(); };
  window.addEventListener(CONSENT_EVENT, listener);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener);
    window.removeEventListener("storage", storage);
  };
}

type DataLayerEntry = Record<string, unknown> | IArguments;
declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    google_tag_manager?: Record<string, unknown>;
  }
}

let running = false;
let draftMode = false;
let production = false;
let allowedHosts: string | undefined;
let lastPath: string | null = null;

function gtag(...args: unknown[]) {
  void args;
  // Google requires an arguments object, not a plain array, for these commands.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

const deniedAds = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

export function trackAnalytics(event: AnalyticsEvent, values: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !running || getAnalyticsConsent() !== "granted") return;
  const page = analyticsPage(window.location.href, draftMode, production, allowedHosts);
  if (!page) return;
  const payload: Record<string, unknown> = { event, ...page };
  if (event === "haus_page_view") {
    if (lastPath === page.page_path) return;
    lastPath = page.page_path;
  } else if (event === "haus_property_click" || event === "haus_article_click") {
    const path = typeof values.content_path === "string" ? publicPath(values.content_path) : null;
    const prefix = event === "haus_property_click" ? "/properties/" : "/blog/";
    if (!path?.startsWith(prefix)) return;
    payload.content_path = path;
  } else if (event === "haus_contact_click") {
    if (!["phone", "email", "whatsapp", "contact", "enquiry"].includes(String(values.contact_method))) return;
    payload.contact_method = values.contact_method;
  } else if (event === "haus_property_search") {
    // No search strings, location labels, budgets, user IDs, or form answers.
    payload.form_location = "homepage_hero";
    if (["sale", "rent"].includes(String(values.intent))) payload.intent = values.intent;
    if (["residential", "commercial"].includes(String(values.category))) payload.category = values.category;
    if (["ready", "off-plan"].includes(String(values.availability))) payload.availability = values.availability;
  } else if (LEAD_EVENTS.has(event)) {
    if (typeof values.surface !== "string" || !["modal", "manual_cta", "newsletter", "register_interest"].includes(values.surface)) return;
    if (typeof values.form_version !== "string" || !/^\d{4}-\d{2}-\d{2}\.v[1-9]\d{0,2}$/.test(values.form_version)) return;
    payload.form_name = "lead_eoi";
    payload.form_version = values.form_version;
    payload.surface = values.surface;
    // Null explicitly clears previous event values from GTM's persistent layer.
    payload.interest = typeof values.interest === "string" && ["buy", "rent", "invest", "sell_let", "newsletter_only"].includes(values.interest) ? values.interest : null;
    payload.step = typeof values.step === "number" && Number.isInteger(values.step) && values.step >= 1 && values.step <= 3 ? values.step : null;
    payload.has_project = typeof values.has_project === "boolean" ? values.has_project : null;
  } else if (ASSISTANT_EVENTS.has(event)) {
    const routeScope = page.page_path === "/" ? "home"
      : ["/properties", "/properties/residential", "/properties/commercial"].includes(page.page_path) ? "properties"
      : page.page_path.startsWith("/properties/") ? "property_detail" : null;
    if (!routeScope || values.route_scope !== routeScope) return;
    payload.route_scope = routeScope;
    if (event === "property_assistant_results_shown") {
      if (typeof values.result_count !== "number" || !Number.isFinite(values.result_count)) return;
      payload.result_count = Math.max(0, Math.min(3, Math.trunc(values.result_count)));
    }
  } else return;
  window.dataLayer?.push(payload);
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
    for (const domain of ["", window.location.hostname, ".hausofestate.com"]) {
      document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax`;
    }
  }
}

export function stopAnalytics(reload = true) {
  const wasRunning = running;
  running = false;
  lastPath = null;
  if (!wasRunning) return;
  // Stop known Google tags before unloading their timers/listeners. Removing a
  // script node alone cannot unload an already-executed analytics library.
  for (const id of Object.keys(window.google_tag_manager || {})) {
    if (/^G-/.test(id)) (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = true;
  }
  gtag("consent", "update", { analytics_storage: "denied", ...deniedAds });
  if (window.dataLayer) window.dataLayer.push = () => 0;
  document.getElementById("haus-gtm")?.remove();
  clearAnalyticsCookies();
  if (reload) window.location.reload();
}

export type AnalyticsOptions = { gtmId?: string; draft: boolean; production: boolean; allowedHosts?: string };

export function syncAnalytics(options: AnalyticsOptions) {
  draftMode = options.draft;
  production = options.production;
  allowedHosts = options.allowedHosts;
  const page = analyticsPage(window.location.href, draftMode, production, allowedHosts);
  if (getAnalyticsConsent() !== "granted" || !page || !/^GTM-[A-Z0-9]+$/.test(options.gtmId || "")) {
    stopAnalytics();
    return;
  }
  if (!running) {
    running = true;
    lastPath = null;
    // Start with a fresh queue. Nothing before consent is recorded or replayed.
    window.dataLayer = [];
    gtag("consent", "default", { analytics_storage: "denied", ...deniedAds });
    gtag("set", { ...page, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true, url_passthrough: false });
    gtag("consent", "update", { analytics_storage: "granted", ...deniedAds });
    // GTM's Initialization trigger must see sanitized variables immediately.
    window.dataLayer.push({ ...page });
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.id = "haus-gtm";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${options.gtmId}`;
    script.referrerPolicy = "no-referrer";
    document.head.appendChild(script);
  }
  gtag("set", page);
  trackAnalytics("haus_page_view");
}

export function installAnalyticsNavigationGuard() {
  const originals = { pushState: history.pushState, replaceState: history.replaceState };
  for (const method of ["pushState", "replaceState"] as const) {
    history[method] = function (data, unused, url) {
      if (running && url) {
        const destination = new URL(String(url), window.location.href);
        if (!analyticsPage(destination.href, draftMode, production, allowedHosts)) {
          stopAnalytics(false);
          // A new document guarantees no public-page tag survives into auth,
          // Studio, a draft URL, or any other excluded route.
          if (method === "replaceState") window.location.replace(destination.href);
          else window.location.assign(destination.href);
          return;
        }
      }
      originals[method].call(history, data, unused, url);
    };
  }
  return () => { history.pushState = originals.pushState; history.replaceState = originals.replaceState; };
}

export function trackPublicClick(event: MouseEvent) {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest("a[href], [data-analytics-contact]");
  if (!target) return;
  const contact = target.getAttribute("data-analytics-contact");
  if (contact) { trackAnalytics("haus_contact_click", { contact_method: contact }); return; }
  const href = target.getAttribute("href");
  if (!href) return;
  const url = new URL(href, window.location.href);
  const method = url.protocol === "tel:" ? "phone" : url.protocol === "mailto:" ? "email" : ["wa.me", "api.whatsapp.com"].includes(url.hostname) ? "whatsapp" : null;
  if (method) { trackAnalytics("haus_contact_click", { contact_method: method }); return; }
  if (url.origin !== window.location.origin || !analyticsPage(url.href, draftMode, production, allowedHosts)) return;
  if (/^\/properties\/(?!residential$|commercial$)/.test(url.pathname)) trackAnalytics("haus_property_click", { content_path: url.pathname });
  else if (url.pathname.startsWith("/blog/")) trackAnalytics("haus_article_click", { content_path: url.pathname });
  else if (url.pathname === "/contact") trackAnalytics("haus_contact_click", { contact_method: "contact" });
}
