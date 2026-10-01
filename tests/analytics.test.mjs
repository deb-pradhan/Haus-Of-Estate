import assert from "node:assert/strict";
import test from "node:test";
import {
  analyticsPage, analyticsHosts, CONSENT_KEY, consentFromStorage, getAnalyticsConsent,
  saveAnalyticsConsent, syncAnalytics, stopAnalytics, trackAnalytics,
  installAnalyticsNavigationGuard, subscribeConsent, analyticsMode, ga4EventName,
} from "../src/lib/analytics.ts";

test("public-page allowlist excludes private, preview, draft, local and non-production pages", () => {
  for (const path of ["/auth/login", "/auth/reset-password", "/studio", "/studio/desk", "/saved", "/account", "/api/foo", "/match", "/unknown", "/blog/user%40mail.com"]) {
    assert.equal(analyticsPage(`https://hausofestate.com${path}`), null, path);
  }
  for (const href of ["http://localhost:3000/", "https://preview.vercel.app/", "https://hausofestate.com/?preview=true", "https://hausofestate.com/?sanity-preview-secret=abc"]) assert.equal(analyticsPage(href), null);
  assert.equal(analyticsPage("https://hausofestate.com/blog/article", true), null);
  assert.equal(analyticsPage("https://hausofestate.com/", false, false), null);
  assert.deepEqual(analyticsPage("https://hausofestate.com/properties/azizi-florence?email=private@example.com#contact"), {
    page_path: "/properties/azizi-florence", page_location: "https://hausofestate.com/properties/azizi-florence", page_referrer: "", page_title: "properties",
  });
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
    ["haus_page_view", "haus_property_click", "haus_article_click", "haus_contact_click", "haus_property_search"].map(ga4EventName),
    ["page_view", "property_click", "article_click", "contact_click", "property_search"],
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
