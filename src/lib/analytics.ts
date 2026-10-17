// Only these public destinations and coarse interaction values may reach GTM/GA4.
export const CONSENT_KEY = "haus.analytics-consent.v1";
export const CONSENT_EVENT = "haus:analytics-consent";
export const SETTINGS_EVENT = "haus:cookie-settings";
export type AnalyticsConsent = "granted" | "denied" | "unknown";
export type AnalyticsEvent = "haus_page_view" | "haus_property_click" | "haus_article_click" | "haus_contact_click" | "haus_property_search" | "haus_generate_lead";

const PUBLIC_PAGES = new Set([
  "/", "/about", "/team", "/services", "/renovations", "/faq", "/contact",
  "/list-property", "/blog", "/properties", "/properties/residential",
  "/properties/commercial", "/legal/privacy-policy", "/legal/cookie-policy", "/legal/terms-of-service",
]);

export function publicPath(pathname: string): string | null {
  const path = pathname.replace(/\/$/, "") || "/";
  return PUBLIC_PAGES.has(path) || /^\/(properties|blog)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)
    ? path : null;
}

// Static, public page labels. page_title is never read from document.title:
// auth/errors or arbitrary search text may appear there.
const PAGE_TITLES: Record<string, string> = {
  "/": "Home", "/about": "About", "/team": "Team", "/services": "Services", "/renovations": "Renovations",
  "/faq": "FAQs", "/contact": "Contact", "/list-property": "Sell or let your property", "/blog": "Insights",
  "/properties": "Properties", "/properties/residential": "Residential properties", "/properties/commercial": "Commercial properties",
  "/legal/privacy-policy": "Privacy policy", "/legal/cookie-policy": "Cookie policy", "/legal/terms-of-service": "Terms of service",
};
export function publicPageTitle(path: string): string {
  return PAGE_TITLES[path] ?? (path.startsWith("/properties/") ? "Property" : path.startsWith("/blog/") ? "Article" : "Page");
}

// Attribution allow-list. Everything else in the query string (email, phone,
// tokens, search text, preview/draft flags) is dropped from page_location.
const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"] as const;
const CLICK_ID_PARAMS = ["gclid", "gbraid", "wbraid", "dclid", "msclkid"] as const;

// Campaign values are short labels. Anything that looks like contact data
// (an address, a long digit run such as a phone number) is discarded.
function safeCampaignValue(value: string): string | null {
  const v = value.trim();
  if (!v || v.length > 100 || !/^[\w.~+\- ]+$/.test(v) || /\d{7,}/.test(v)) return null;
  return v;
}
function safeClickId(value: string): string | null {
  return /^[A-Za-z0-9_-]{8,200}$/.test(value) ? value : null;
}

/** Sanitised attribution params present on a URL: allow-listed UTMs and ad click IDs only. */
export function campaignParams(search: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of CAMPAIGN_PARAMS) {
    const raw = search.get(key);
    const value = raw === null ? null : safeCampaignValue(raw);
    if (value) out[key] = value;
  }
  for (const key of CLICK_ID_PARAMS) {
    const raw = search.get(key);
    const value = raw === null ? null : safeClickId(raw);
    if (value) out[key] = value;
  }
  return out;
}

/**
 * page_referrer for GA4: a cross-site referrer is reduced to its origin (never
 * the path or query); a referrer on one of our own hosts is reduced to its
 * public page path; anything else is blank.
 */
export function sanitizeReferrer(referrer: string | undefined | null, hosts: string[]): string {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (hosts.includes(url.hostname)) {
      const path = publicPath(url.pathname);
      return path ? `https://hausofestate.com${path}` : "";
    }
    return url.origin;
  } catch { return ""; }
}

export function analyticsHosts(configured?: string): string[] {
  if (!configured?.trim()) return ["hausofestate.com", "www.hausofestate.com"];
  // Exact hostnames only: no wildcard, URL, path or port. An invalid explicit
  // list fails closed rather than silently enabling the default hosts.
  return configured.split(",").map((host) => host.trim().toLowerCase())
    .filter((host) => /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(host));
}

export function analyticsPage(href: string, draft = false, production = true, allowedHosts?: string, referrer?: string) {
  const url = new URL(href);
  const hosts = analyticsHosts(allowedHosts);
  if (!production || draft || !hosts.includes(url.hostname)) return null;
  if ([...url.searchParams.keys()].some((key) => /preview|draft|token|secret/i.test(key))) return null;
  const path = publicPath(url.pathname);
  if (!path) return null;
  const campaign = new URLSearchParams(campaignParams(url.searchParams));
  const query = campaign.toString();
  return {
    page_path: path,
    // Clean host + path, plus only the allow-listed campaign/click-ID params so
    // GA4 can attribute the session. No other query string or hash survives.
    page_location: `https://hausofestate.com${path}${query ? `?${query}` : ""}`,
    page_referrer: sanitizeReferrer(referrer, hosts),
    page_title: publicPageTitle(path),
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
let activeTag: AnalyticsTag | null = null;
let configuredGa4: string | undefined;
// page_referrer: the first view of a document uses document.referrer (reduced
// to an origin); later single-page navigations use the previous page, as GA4
// does for SPAs. Events on the same page reuse that view's referrer.
let viewedHref: string | null = null;
let viewReferrer: string | undefined;
function referrerFor(href: string): string | undefined {
  if (viewedHref !== null && new URL(viewedHref).pathname === new URL(href).pathname) return viewReferrer;
  return viewedHref ?? (typeof document !== "undefined" ? document.referrer : undefined);
}

export type AnalyticsTag = { mode: "gtm" | "ga4"; id: string };
// A valid GTM container takes precedence; direct gtag.js is the fallback when
// only a GA4 measurement ID exists. Neither valid ID means nothing loads.
export function analyticsMode(gtmId?: string, ga4Id?: string): AnalyticsTag | null {
  if (/^GTM-[A-Z0-9]+$/.test(gtmId || "")) return { mode: "gtm", id: gtmId! };
  if (/^G-[A-Z0-9]+$/.test(ga4Id || "")) return { mode: "ga4", id: ga4Id! };
  return null;
}

const GA4_EVENTS: Record<AnalyticsEvent, string> = {
  haus_page_view: "page_view", haus_property_click: "property_click", haus_article_click: "article_click",
  haus_contact_click: "contact_click", haus_property_search: "property_search",
  // GA4 recommended event; mark it as a key event in GA4 admin.
  haus_generate_lead: "generate_lead",
};
export function ga4EventName(event: AnalyticsEvent): string { return GA4_EVENTS[event]; }

function gtag(...args: unknown[]) {
  void args;
  // Google requires an arguments object, not a plain array, for these commands.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

const deniedAds = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

export function trackAnalytics(event: AnalyticsEvent, values: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !running || getAnalyticsConsent() !== "granted") return;
  const page = analyticsPage(window.location.href, draftMode, production, allowedHosts, referrerFor(window.location.href));
  if (!page) return;
  const payload: Record<string, unknown> = { event, ...page };
  if (event === "haus_page_view") {
    if (lastPath === page.page_path) return;
    lastPath = page.page_path;
    viewReferrer = referrerFor(window.location.href);
    viewedHref = window.location.href;
  } else if (event === "haus_property_click" || event === "haus_article_click") {
    const path = typeof values.content_path === "string" ? publicPath(values.content_path) : null;
    const prefix = event === "haus_property_click" ? "/properties/" : "/blog/";
    if (!path?.startsWith(prefix)) return;
    payload.content_path = path;
  } else if (event === "haus_contact_click") {
    if (!["phone", "email", "whatsapp", "contact", "enquiry"].includes(String(values.contact_method))) return;
    payload.contact_method = values.contact_method;
  } else if (event === "haus_generate_lead") {
    // Only coarse, whitelisted labels. No names, emails, phones, free text or IDs.
    const formId = typeof values.form_id === "string" ? values.form_id.trim().toLowerCase() : "";
    if (/^[a-z][a-z0-9_]{1,39}$/.test(formId)) payload.form_id = formId;
    const market = String(values.market ?? "").trim().toLowerCase();
    if (LEAD_MARKETS.includes(market)) payload.market = market;
    const intent = String(values.intent ?? "").trim().toLowerCase();
    if (LEAD_INTENTS.includes(intent)) payload.intent = intent;
  } else if (event === "haus_property_search") {
    // No search strings, location labels, budgets, user IDs, or form answers.
    payload.form_location = "homepage_hero";
    if (["sale", "rent"].includes(String(values.intent))) payload.intent = values.intent;
    if (["residential", "commercial"].includes(String(values.category))) payload.category = values.category;
    if (["ready", "off-plan"].includes(String(values.availability))) payload.availability = values.availability;
  } else return;
  if (activeTag?.mode === "ga4") {
    // gtag.js ignores plain {event} objects; GA4-direct events need the command form.
    const { event: name, ...params } = payload;
    void name;
    gtag("event", ga4EventName(event), params);
  } else window.dataLayer?.push(payload);
}

const LEAD_MARKETS = ["dubai", "uk", "bali", "cyprus", "other", "unknown"];
const LEAD_INTENTS = ["buy", "rent", "sell", "let", "invest", "buyer", "seller", "list_property", "match", "contact", "account", "general"];

export type LeadEventInput = { formId: string; market?: string; intent?: string };

/**
 * GA4 `generate_lead` (recommended event). Call it ONLY after the server has
 * accepted the enquiry (HTTP 2xx), once per submission. Consent-gated like every
 * other event; fires nothing without analytics consent or off public pages.
 * Pass labels only: formId is a lowercase identifier such as "buyer_modal",
 * market one of dubai|uk|bali|cyprus|other, intent a coarse label such as
 * buy|rent|sell|let|invest. Anything else is dropped. Never pass PII.
 */
export function trackLead({ formId, market, intent }: LeadEventInput) {
  trackAnalytics("haus_generate_lead", { form_id: formId, market, intent });
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
  viewedHref = null;
  viewReferrer = undefined;
  activeTag = null;
  if (!wasRunning) return;
  // Stop known Google tags before unloading their timers/listeners. Removing a
  // script node alone cannot unload an already-executed analytics library.
  for (const id of Object.keys(window.google_tag_manager || {})) {
    if (/^G-/.test(id)) (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = true;
  }
  if (configuredGa4) (window as unknown as Record<string, unknown>)[`ga-disable-${configuredGa4}`] = true;
  gtag("consent", "update", { analytics_storage: "denied", ...deniedAds });
  if (window.dataLayer) window.dataLayer.push = () => 0;
  document.getElementById("haus-gtm")?.remove();
  document.getElementById("haus-gtag")?.remove();
  clearAnalyticsCookies();
  if (reload) window.location.reload();
}

export type AnalyticsOptions = { gtmId?: string; ga4Id?: string; draft: boolean; production: boolean; allowedHosts?: string };

export function syncAnalytics(options: AnalyticsOptions) {
  draftMode = options.draft;
  production = options.production;
  allowedHosts = options.allowedHosts;
  const tag = analyticsMode(options.gtmId, options.ga4Id);
  if (/^G-[A-Z0-9]+$/.test(options.ga4Id || "")) configuredGa4 = options.ga4Id;
  const page = analyticsPage(window.location.href, draftMode, production, allowedHosts, referrerFor(window.location.href));
  // A changed tag/ID cannot be swapped in place: unload via reload, then start clean.
  if (getAnalyticsConsent() !== "granted" || !page || !tag || (running && (activeTag?.mode !== tag.mode || activeTag.id !== tag.id))) {
    stopAnalytics();
    return;
  }
  if (!running) {
    running = true;
    lastPath = null;
    activeTag = tag;
    // Start with a fresh queue. Nothing before consent is recorded or replayed.
    window.dataLayer = [];
    gtag("consent", "default", { analytics_storage: "denied", ...deniedAds });
    gtag("set", { ...page, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true, url_passthrough: false });
    gtag("consent", "update", { analytics_storage: "granted", ...deniedAds });
    const script = document.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer";
    if (tag.mode === "gtm") {
      // GTM's Initialization trigger must see sanitized variables immediately.
      window.dataLayer.push({ ...page });
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      script.id = "haus-gtm";
      script.src = `https://www.googletagmanager.com/gtm.js?id=${tag.id}`;
    } else {
      // Consent is granted again (e.g. bfcache restore after a stop): lift an earlier kill switch.
      delete (window as unknown as Record<string, unknown>)[`ga-disable-${tag.id}`];
      gtag("js", new Date());
      // Page views are sent manually by trackAnalytics with sanitized fields only.
      gtag("config", tag.id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ...page });
      script.id = "haus-gtag";
      script.src = `https://www.googletagmanager.com/gtag/js?id=${tag.id}`;
    }
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
