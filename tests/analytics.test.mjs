import assert from "node:assert/strict";
import test from "node:test";
import {
  analyticsPage, analyticsHosts, CONSENT_KEY, consentFromStorage, getAnalyticsConsent,
  saveAnalyticsConsent, syncAnalytics, stopAnalytics, trackAnalytics,
  installAnalyticsNavigationGuard, subscribeConsent, analyticsMode, ga4EventName,
  campaignParams, sanitizeReferrer, publicPageTitle, trackLead,
} from "../src/lib/analytics.ts";

test("public-page allowlist excludes private, preview, draft, local and non-production pages", () => {
  for (const path of ["/auth/login", "/auth/reset-password", "/studio", "/studio/desk", "/saved", "/account", "/api/foo", "/match", "/unknown", "/blog/user%40mail.com"]) {
    assert.equal(analyticsPage(`https://hausofestate.com${path}`), null, path);
  }
  for (const href of ["http://localhost:3000/", "https://preview.vercel.app/", "https://hausofestate.com/?preview=true", "https://hausofestate.com/?sanity-preview-secret=abc"]) assert.equal(analyticsPage(href), null);
  assert.equal(analyticsPage("https://hausofestate.com/blog/article", true), null);
  assert.equal(analyticsPage("https://hausofestate.com/", false, false), null);
  assert.deepEqual(analyticsPage("https://hausofestate.com/properties/azizi-florence?email=private@example.com#contact"), {
    page_path: "/properties/azizi-florence", page_location: "https://hausofestate.com/properties/azizi-florence", page_referrer: "", page_title: "Property",
  });
});

test("attribution: UTMs and ad click IDs survive in page_location, every other query param is stripped", () => {
  const url = "https://hausofestate.com/blog/some-guide?utm_source=newsletter&utm_medium=email&utm_campaign=oct-2026&utm_term=dubai+visa&utm_content=hero&gclid=EAIaIQobChMI_abc-123&email=private@example.com&phone=%2B447496033321&q=secret&ref=abc#contact";
  const page = analyticsPage(url);
  assert.equal(page.page_path, "/blog/some-guide");
  const location = new URL(page.page_location);
  assert.equal(location.origin + location.pathname, "https://hausofestate.com/blog/some-guide");
  assert.deepEqual(Object.fromEntries(location.searchParams), {
    utm_source: "newsletter", utm_medium: "email", utm_campaign: "oct-2026", utm_term: "dubai visa", utm_content: "hero", gclid: "EAIaIQobChMI_abc-123",
  });
  assert.doesNotMatch(page.page_location, /private@example|447496033321|secret|ref=|#/);
  // No attribution params: a clean URL without a trailing "?".
  assert.equal(analyticsPage("https://hausofestate.com/about?foo=bar").page_location, "https://hausofestate.com/about");
  // Preview/draft/token/secret flags still switch measurement off entirely, even next to UTMs.
  assert.equal(analyticsPage("https://hausofestate.com/?utm_source=x&token=abc"), null);
});

test("attribution: campaign values that look like contact data are discarded", () => {
  const params = campaignParams(new URLSearchParams({
    utm_source: "person@example.com", utm_medium: "07496033321", utm_campaign: "x".repeat(101), utm_term: "bad/value<script>", utm_content: "ok_value-1",
    gclid: "short", gbraid: "0AAAAAAAAAAAA_valid-id", fbclid: "not-forwarded-click-id-123456",
  }));
  assert.deepEqual(params, { utm_content: "ok_value-1", gbraid: "0AAAAAAAAAAAA_valid-id" });
});

test("page_referrer is an origin for other sites, a public path for our own, and blank otherwise", () => {
  const hosts = ["hausofestate.com", "www.hausofestate.com"];
  assert.equal(sanitizeReferrer("https://www.google.com/search?q=private%40example.com&oq=x", hosts), "https://www.google.com");
  assert.equal(sanitizeReferrer("https://user:pass@mail.example.com:8443/inbox/123?token=abc", hosts), "https://mail.example.com:8443");
  assert.equal(sanitizeReferrer("https://hausofestate.com/blog/a-guide?email=x@y.com", hosts), "https://hausofestate.com/blog/a-guide");
  assert.equal(sanitizeReferrer("https://hausofestate.com/auth/login?token=abc", hosts), "");
  for (const bad of ["", undefined, null, "not a url", "javascript:alert(1)", "android-app://com.google.android.gm"]) assert.equal(sanitizeReferrer(bad, hosts), "");
  assert.equal(analyticsPage("https://hausofestate.com/", false, true, undefined, "https://t.co/abc?x=1").page_referrer, "https://t.co");
});

test("page_title comes from a static map, never from the document", () => {
  assert.equal(publicPageTitle("/"), "Home");
  assert.equal(publicPageTitle("/properties/residential"), "Residential properties");
  assert.equal(publicPageTitle("/properties/some-listing"), "Property");
  assert.equal(publicPageTitle("/blog/some-post"), "Article");
});

test("only explicitly named demo hosts can opt in; wildcards and arbitrary previews remain excluded", () => {
  assert.deepEqual(analyticsHosts(), ["hausofestate.com", "www.hausofestate.com"]);
  assert.deepEqual(analyticsHosts(" localhost, DEMO.hausofestate.com "), ["localhost", "demo.hausofestate.com"]);
  assert.deepEqual(analyticsHosts("*.vercel.app,http://localhost,localhost:3000"), []);
  assert.equal(analyticsPage("http://localhost:3131/"), null);
  assert.equal(analyticsPage("http://localhost:3131/", false, true, "localhost")?.page_location, "https://hausofestate.com/");
  assert.equal(analyticsPage("https://review.vercel.app/", false, true, "review.vercel.app")?.page_path, "/");
  assert.equal(analyticsPage("https://other.vercel.app/", false, true, "review.vercel.app"), null);
  assert.equal(analyticsPage("https://hausofestate.com/", false, true, "localhost"), null);
  assert.equal(analyticsPage("http://localhost:3131/auth/login", false, true, "localhost"), null);
  assert.equal(analyticsPage("http://localhost:3131/", true, true, "localhost"), null);
  assert.equal(analyticsPage("http://localhost:3131/", false, false, "localhost"), null);
});

test("consent is versioned, expiring and fail-closed", () => {
  for (const raw of [null, "invalid", "true", JSON.stringify({ version: 2, analytics: "granted", expiresAt: 999 }), JSON.stringify({ version: 1, analytics: "granted", expiresAt: 100 })]) assert.equal(consentFromStorage(raw, 101), "unknown");
  assert.equal(consentFromStorage(JSON.stringify({ version: 1, analytics: "denied", expiresAt: 999 }), 100), "denied");
});

test("runtime gates scripts, drops backlog and PII, deduplicates pages, revokes and guards SPA navigation", () => {
  const storage = new Map();
  const scripts = [];
  const calls = { reload: 0, assign: [], replace: [] };
  const listeners = new EventTarget();
  const location = {
    href: "https://hausofestate.com/?email=private@example.com", hostname: "hausofestate.com",
    reload: () => calls.reload++, assign: (href) => calls.assign.push(href), replace: (href) => calls.replace.push(href),
  };
  globalThis.window = {
    location, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    addEventListener: listeners.addEventListener.bind(listeners), removeEventListener: listeners.removeEventListener.bind(listeners), dispatchEvent: listeners.dispatchEvent.bind(listeners),
  };
  globalThis.document = { cookie: "_ga=abc; session=keep", head: { appendChild: (script) => scripts.push(script) }, createElement: () => ({}), getElementById: () => ({ remove() {} }) };
  globalThis.history = { pushState: (_data, _unused, url) => { location.href = new URL(url, location.href).href; }, replaceState: (_data, _unused, url) => { location.href = new URL(url, location.href).href; } };
  const config = { gtmId: "GTM-TEST123", draft: false, production: true };
  const events = () => window.dataLayer?.filter((entry) => entry.event?.startsWith("haus_")) || [];
  const commands = () => window.dataLayer?.filter((entry) => entry[0]) || [];
  try {
    syncAnalytics(config);
    trackAnalytics("haus_property_search", { email: "private@example.com" });
    assert.equal(scripts.length, 0);
    assert.equal(window.dataLayer, undefined);
    saveAnalyticsConsent("denied");
    syncAnalytics(config);
    assert.equal(scripts.length, 0);

    // Anything queued elsewhere before consent must never be replayed.
    window.dataLayer = [{ event: "legacy_event", email: "private@example.com" }];
    saveAnalyticsConsent("granted");
    syncAnalytics(config);
    syncAnalytics(config); // React Strict Mode / duplicate effect.
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].referrerPolicy, "no-referrer");
    assert.equal(events().length, 1);
    assert.equal(events()[0].event, "haus_page_view");
    assert.equal(commands()[0][0], "consent");
    assert.equal(commands()[0][2].analytics_storage, "denied");
    assert.equal(commands()[2][2].analytics_storage, "granted");
    assert.equal(commands()[2][2].ad_storage, "denied");
    assert.doesNotMatch(JSON.stringify(window.dataLayer), /private@example|legacy_event/);

    trackAnalytics("haus_property_search", { intent: "sale", category: "residential", availability: "off-plan", selected_location: "private@example.com", email: "private@example.com", search_term: "secret", user_id: "user-1" });
    const search = events().at(-1);
    assert.deepEqual(Object.keys(search).sort(), ["availability", "category", "event", "form_location", "intent", "page_location", "page_path", "page_referrer", "page_title"].sort());
    assert.equal(search.event, "haus_property_search");
    assert.doesNotMatch(JSON.stringify(search), /lead_form_submit|private@example|secret|user-1/);
    const beforeInvalid = events().length;
    trackAnalytics("lead_form_submit", { email: "private@example.com" });
    trackAnalytics("haus_contact_click", { contact_method: "private@example.com" });
    trackAnalytics("haus_article_click", { content_path: "/auth/login" });
    assert.equal(events().length, beforeInvalid);

    location.href = "https://hausofestate.com/blog?query=secret";
    syncAnalytics(config);
    syncAnalytics(config);
    assert.equal(events().filter((event) => event.event === "haus_page_view").length, 2);
    trackAnalytics("haus_article_click", { content_path: "/blog/public-article", text: "secret" });
    trackAnalytics("haus_contact_click", { contact_method: "email", email: "private@example.com" });
    assert.equal(events().at(-1).contact_method, "email");
    assert.doesNotMatch(JSON.stringify(window.dataLayer), /private@example|secret/);

    saveAnalyticsConsent("denied");
    syncAnalytics(config);
    const revokedCount = events().length;
    trackAnalytics("haus_contact_click", { contact_method: "phone" });
    assert.equal(events().length, revokedCount);
    assert.equal(calls.reload, 1);
    assert.equal(getAnalyticsConsent(), "denied");
    assert.match(document.cookie, /Max-Age=0/);

    saveAnalyticsConsent("granted");
    syncAnalytics(config);
    const undo = installAnalyticsNavigationGuard();
    history.pushState({}, "", "/auth/login?token=secret");
    assert.deepEqual(calls.assign, ["https://hausofestate.com/auth/login?token=secret"]);
    assert.equal(location.href, "https://hausofestate.com/blog?query=secret");
    undo();

    location.href = "https://hausofestate.com/properties";
    syncAnalytics(config);
    location.href = "https://hausofestate.com/studio"; // Browser back/forward before React effect.
    const beforePrivate = events().length;
    trackAnalytics("haus_property_search");
    assert.equal(events().length, beforePrivate);
    syncAnalytics(config);
    assert.equal(calls.reload, 2);

    location.href = "https://hausofestate.com/";
    syncAnalytics({ ...config, draft: true });
    syncAnalytics({ ...config, production: false });
    syncAnalytics({ ...config, gtmId: "invalid" });
    assert.equal(scripts.length, 3);

    let updates = 0;
    const unsubscribe = subscribeConsent(() => updates++);
    saveAnalyticsConsent("denied");
    assert.equal(updates, 1);
    const storageEvent = new Event("storage");
    Object.defineProperty(storageEvent, "key", { value: CONSENT_KEY });
    window.dispatchEvent(storageEvent);
    assert.equal(updates, 2);
    unsubscribe();
  } finally {
    stopAnalytics(false);
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.history;
  }
});

test("tag mode: valid GTM takes precedence, GA4 measurement IDs are validated, events map to GA4 names", () => {
  assert.deepEqual(analyticsMode("GTM-ABC123", "G-FEZF22MELJ"), { mode: "gtm", id: "GTM-ABC123" });
  assert.deepEqual(analyticsMode(undefined, "G-FEZF22MELJ"), { mode: "ga4", id: "G-FEZF22MELJ" });
  assert.deepEqual(analyticsMode("invalid", "G-FEZF22MELJ"), { mode: "ga4", id: "G-FEZF22MELJ" });
  for (const id of ["", "GTM-ABC123", "UA-123-1", "g-abc", "G-ABC 1", "G-ABC&x=1", "G-"]) assert.equal(analyticsMode(undefined, id), null, id);
  assert.equal(analyticsMode(), null);
  assert.deepEqual(
    ["haus_page_view", "haus_property_click", "haus_article_click", "haus_contact_click", "haus_property_search", "haus_generate_lead"].map(ga4EventName),
    ["page_view", "property_click", "article_click", "contact_click", "property_search", "generate_lead"],
  );
});

test("GA4-direct mode loads gtag.js after consent and emits sanitized gtag events", () => {
  const storage = new Map();
  const scripts = [];
  const calls = { reload: 0 };
  const listeners = new EventTarget();
  const location = { href: "https://hausofestate.com/?email=private@example.com", hostname: "hausofestate.com", reload: () => calls.reload++ };
  globalThis.window = {
    location, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    addEventListener: listeners.addEventListener.bind(listeners), removeEventListener: listeners.removeEventListener.bind(listeners), dispatchEvent: listeners.dispatchEvent.bind(listeners),
  };
  const removed = [];
  globalThis.document = { cookie: "_ga=abc", head: { appendChild: (script) => scripts.push(script) }, createElement: () => ({}), getElementById: (id) => ({ remove() { removed.push(id); } }) };
  const config = { ga4Id: "G-TEST123", draft: false, production: true };
  const commands = () => window.dataLayer?.filter((entry) => entry[0]) || [];
  const events = () => commands().filter((entry) => entry[0] === "event");
  try {
    syncAnalytics(config);
    assert.equal(scripts.length, 0);
    assert.equal(window.dataLayer, undefined);

    saveAnalyticsConsent("granted");
    syncAnalytics(config);
    syncAnalytics(config);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].id, "haus-gtag");
    assert.equal(scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-TEST123");
    assert.equal(scripts[0].referrerPolicy, "no-referrer");
    assert.equal(scripts[0].async, true);
    const [first, , update, js, configCmd] = commands();
    assert.deepEqual([first[0], first[1], first[2].analytics_storage], ["consent", "default", "denied"]);
    assert.deepEqual([update[1], update[2].analytics_storage, update[2].ad_storage], ["update", "granted", "denied"]);
    assert.equal(js[0], "js");
    assert.deepEqual([configCmd[0], configCmd[1]], ["config", "G-TEST123"]);
    assert.equal(configCmd[2].send_page_view, false);
    assert.equal(configCmd[2].allow_google_signals, false);
    assert.equal(configCmd[2].page_location, "https://hausofestate.com/");
    assert.equal(window.dataLayer.some((entry) => entry.event), false, "no plain dataLayer events in GA4 mode");

    assert.equal(events().length, 1);
    assert.equal(events()[0][1], "page_view");
    trackAnalytics("haus_property_search", { intent: "rent", email: "private@example.com", search_term: "secret" });
    trackAnalytics("haus_contact_click", { contact_method: "whatsapp" });
    trackAnalytics("haus_contact_click", { contact_method: "private@example.com" });
    assert.deepEqual(events().map((entry) => entry[1]), ["page_view", "property_search", "contact_click"]);
    assert.deepEqual(Object.keys(events()[1][2]).sort(), ["form_location", "intent", "page_location", "page_path", "page_referrer", "page_title"]);
    assert.equal("event" in events()[1][2], false);
    assert.doesNotMatch(JSON.stringify([...window.dataLayer].map((entry) => [...entry])), /private@example|secret/);

    // Switching to a GTM container mid-document unloads via reload rather than mixing tags.
    syncAnalytics({ ...config, gtmId: "GTM-TEST123" });
    assert.equal(calls.reload, 1);
    assert.equal(window["ga-disable-G-TEST123"], true);
    assert.ok(removed.includes("haus-gtag"));

    saveAnalyticsConsent("denied");
    syncAnalytics(config);
    assert.equal(scripts.length, 1);
  } finally {
    stopAnalytics(false);
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("GA4 attribution end to end: UTMs and referrer origin reach GA4, SPA navigation chains page_referrer, generate_lead is label-only", () => {
  const storage = new Map();
  const listeners = new EventTarget();
  const location = {
    href: "https://hausofestate.com/?utm_source=newsletter&utm_medium=email&utm_campaign=launch&email=private@example.com&gclid=EAIaIQobChMI_abc-123",
    hostname: "hausofestate.com", reload() {},
  };
  globalThis.window = {
    location, localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    addEventListener: listeners.addEventListener.bind(listeners), removeEventListener: listeners.removeEventListener.bind(listeners), dispatchEvent: listeners.dispatchEvent.bind(listeners),
  };
  globalThis.document = {
    cookie: "", referrer: "https://www.google.com/search?q=private%40example.com",
    head: { appendChild() {} }, createElement: () => ({}), getElementById: () => ({ remove() {} }),
  };
  const config = { ga4Id: "G-TEST123", draft: false, production: true };
  const commands = () => window.dataLayer?.filter((entry) => entry[0]) || [];
  const events = (name) => commands().filter((entry) => entry[0] === "event" && (!name || entry[1] === name));
  try {
    // Without consent nothing is tracked, including leads.
    trackLead({ formId: "buyer_modal", market: "dubai", intent: "buy" });
    assert.equal(window.dataLayer, undefined);

    saveAnalyticsConsent("granted");
    syncAnalytics(config);
    const configParams = commands().find((entry) => entry[0] === "config")[2];
    const landing = new URL(configParams.page_location);
    assert.deepEqual(Object.fromEntries(landing.searchParams), { utm_source: "newsletter", utm_medium: "email", utm_campaign: "launch", gclid: "EAIaIQobChMI_abc-123" });
    assert.equal(configParams.page_referrer, "https://www.google.com");
    const view = events("page_view")[0][2];
    assert.equal(view.page_referrer, "https://www.google.com");
    assert.equal(view.page_title, "Home");

    // Lead: labels only; PII-looking and unknown values are dropped, the event still fires.
    trackLead({ formId: "buyer_modal", market: "Dubai", intent: "buy", email: "private@example.com", name: "Jane" });
    trackLead({ formId: "private@example.com", market: "narnia", intent: "free text" });
    const [good, bad] = events("generate_lead").map((entry) => entry[2]);
    assert.equal(good.form_id, "buyer_modal");
    assert.equal(good.market, "dubai");
    assert.equal(good.intent, "buy");
    assert.equal(good.page_referrer, "https://www.google.com", "same-page events reuse the view's referrer");
    assert.deepEqual(Object.keys(good).sort(), ["form_id", "intent", "market", "page_location", "page_path", "page_referrer", "page_title"]);
    assert.deepEqual(Object.keys(bad).sort(), ["page_location", "page_path", "page_referrer", "page_title"]);
    assert.doesNotMatch(JSON.stringify(events("generate_lead")), /private@example|Jane|narnia|free text/);

    // SPA navigation: next page_view's referrer is the previous public page (path only), UTMs are not carried over.
    location.href = "https://hausofestate.com/blog/some-guide?q=secret";
    syncAnalytics(config);
    const second = events("page_view")[1][2];
    assert.equal(second.page_referrer, "https://hausofestate.com/");
    assert.equal(second.page_location, "https://hausofestate.com/blog/some-guide");
    assert.doesNotMatch(JSON.stringify(window.dataLayer.map((entry) => [...entry])), /private@example|secret/);

    // Leads off public pages (e.g. /match, /auth) and after revocation are never sent.
    const before = events("generate_lead").length;
    location.href = "https://hausofestate.com/match";
    trackLead({ formId: "match_funnel", market: "uk", intent: "match" });
    assert.equal(events("generate_lead").length, before);
  } finally {
    stopAnalytics(false);
    delete globalThis.window;
    delete globalThis.document;
  }
});
