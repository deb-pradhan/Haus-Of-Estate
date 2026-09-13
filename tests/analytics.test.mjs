import assert from "node:assert/strict";
import test from "node:test";
import {
  analyticsPage, CONSENT_KEY, consentFromStorage, getAnalyticsConsent,
  saveAnalyticsConsent, syncAnalytics, stopAnalytics, trackAnalytics,
  installAnalyticsNavigationGuard, subscribeConsent,
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
