import assert from "node:assert/strict";
import test from "node:test";
import approvedCareerRoles from "../content/careers-roles.json" with { type: "json" };
import {
  analyticsPage, analyticsHosts, CONSENT_KEY, consentFromStorage, getAnalyticsConsent,
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
  assert.equal(analyticsPage("https://hausofestate.com/register-interest")?.page_path, "/register-interest");
  assert.equal(analyticsPage("https://hausofestate.com/enquire?utm_source=instagram")?.page_location, "https://hausofestate.com/enquire");
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

test("new public tools and only reviewed careers paths are measurable without URL input data", () => {
  assert.equal(approvedCareerRoles.length, 9);
  const paths = ["/mortgage-calculator", "/sitemap", "/maintenance", "/careers", ...approvedCareerRoles.map(({ slug }) => `/careers/${slug}`)];
  for (const path of paths) {
    assert.deepEqual(analyticsPage(`https://hausofestate.com${path}?loanAmount=987654.32&annualRate=12.345&termYears=27&email=applicant@example.com#cv-file.pdf`), {
      page_path: path, page_location: `https://hausofestate.com${path}`, page_title: path.split("/")[1], page_referrer: "",
    });
    assert.equal(analyticsPage(`https://hausofestate.com${path}`, true), null);
    assert.equal(analyticsPage(`https://hausofestate.com${path}?preview=true`), null);
  }
  for (const path of [
    "/careers/interior-design-intern", "/careers/content-managers", "/careers/real-estate-agents",
    "/careers/pr-interns", "/careers/videographers", "/careers/lead-generators", "/careers/unknown",
    "/careers/sales-specialist-uk-nationwide-self-employed",
    "/careers/applicant@example.com", "/careers/social-media-account-manager-intern/apply", "/api/applications",
  ]) assert.equal(analyticsPage(`https://hausofestate.com${path}`), null, path);
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
    for (const event of ["form_view", "form_start", "lead_submit_success", "newsletter_opt_in", "property_assistant_opened", "property_assistant_results_shown", "property_assistant_adviser_handoff"]) {
      trackAnalytics(event, { form_version: "2026-09-01.v4", surface: "modal", route_scope: "home", result_count: 2 });
    }
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
    const leadNames = ["form_view", "form_start", "lead_submit_success", "newsletter_opt_in"];
    for (const event of leadNames) {
      trackAnalytics(event, {
        form_name: "private@example.com", form_version: "2026-09-01.v4", surface: "modal",
        interest: "buy", step: 2, has_project: true,
        first_name: "Private Person", email: "private@example.com", project_title: "Private Project", city: "Private City", user_id: "user-1", newsletter_preferences: "secret",
      });
    }
    const leadEvents = window.dataLayer.filter((entry) => leadNames.includes(entry.event));
    assert.deepEqual(leadEvents.map((entry) => entry.event), leadNames);
    for (const entry of leadEvents) {
      assert.equal(entry.form_name, "lead_eoi");
      assert.equal(entry.surface, "modal");
      assert.equal(entry.interest, "buy");
      assert.equal(entry.step, 2);
      assert.equal(entry.has_project, true);
      assert.deepEqual(Object.keys(entry).sort(), ["event", "page_path", "page_location", "page_title", "page_referrer", "form_name", "form_version", "surface", "interest", "step", "has_project"].sort());
    }
    trackAnalytics("form_view", { form_version: "private@example.com", surface: "modal" });
    trackAnalytics("form_view", { form_version: "2026-09-01.v4", surface: "private@example.com" });
    assert.equal(window.dataLayer.filter((entry) => leadNames.includes(entry.event)).length, 4);
    trackAnalytics("form_view", { form_version: "2026-09-01.v4", surface: "register_interest", interest: "private@example.com", step: 99, has_project: "private@example.com" });
    assert.equal(window.dataLayer.at(-1).interest, null);
    assert.equal(window.dataLayer.at(-1).step, null);
    assert.equal(window.dataLayer.at(-1).has_project, null);

    trackAnalytics("lead_submit_success", {
      form_version: "2026-09-01.v4", surface: "query_page", interest: "general_enquiry",
      message: "Private Person wants advice", email: "private@example.com", utm_campaign: "secret",
    });
    assert.equal(window.dataLayer.at(-1).surface, "query_page");
    assert.equal(window.dataLayer.at(-1).interest, "general_enquiry");
    assert.doesNotMatch(JSON.stringify(window.dataLayer.at(-1)), /Private Person|private@example|secret/);

    for (const event of ["property_assistant_opened", "property_assistant_results_shown", "property_assistant_adviser_handoff"]) {
      trackAnalytics(event, { route_scope: "home", result_count: 999, prompt: "secret", message: "Private Person", conversation_id: "user-1" });
    }
    const assistantEvents = window.dataLayer.filter((entry) => entry.event?.startsWith("property_assistant_"));
    assert.equal(assistantEvents.length, 3);
    assert.equal(assistantEvents[1].result_count, 3);
    assert.equal(assistantEvents[0].result_count, undefined);
    trackAnalytics("property_assistant_results_shown", { route_scope: "home", result_count: NaN });
    trackAnalytics("property_assistant_results_shown", { route_scope: "home", result_count: Infinity });
    trackAnalytics("property_assistant_opened", { route_scope: "properties" });
    assert.equal(window.dataLayer.filter((entry) => entry.event?.startsWith("property_assistant_")).length, 3);
    assert.doesNotMatch(JSON.stringify(window.dataLayer), /private@example|Private Person|Private Project|Private City|user-1|secret/);
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

    // These pages add only sanitized page views; form inputs and applicant facts
    // are not events or event parameters, even if accidentally supplied by a caller.
    for (const path of ["/mortgage-calculator", "/sitemap", "/careers/social-media-account-manager-intern"]) {
      location.href = `https://hausofestate.com${path}?loanAmount=987654.32&email=applicant@example.com#cv-file.pdf`;
      syncAnalytics(config);
      const pageView = events().at(-1);
      assert.equal(pageView.event, "haus_page_view");
      assert.equal(pageView.page_path, path);
      assert.deepEqual(Object.keys(pageView).sort(), ["event", "page_path", "page_location", "page_title", "page_referrer"].sort());
      const beforeInputEvents = window.dataLayer.length;
      trackAnalytics("mortgage_calculation", { loanAmount: 987654.32, annualRate: 12.345, termYears: 27 });
      trackAnalytics("application_submit", { applicant_name: "Applicant Private", email: "applicant@example.com", cv: "cv-file.pdf" });
      assert.equal(window.dataLayer.length, beforeInputEvents);
      trackAnalytics("haus_contact_click", {
        contact_method: "email", loanAmount: 987654.32, annualRate: 12.345, termYears: 27,
        applicant_name: "Applicant Private", email: "applicant@example.com", cv: "cv-file.pdf",
      });
      assert.doesNotMatch(JSON.stringify(window.dataLayer), /987654|12\.345|Applicant Private|applicant@example|cv-file|loanAmount|annualRate|termYears/);
    }
    location.href = "https://hausofestate.com/careers/unknown";
    const beforeUnknown = window.dataLayer.length;
    trackAnalytics("haus_page_view");
    trackAnalytics("haus_contact_click", { contact_method: "email" });
    assert.equal(window.dataLayer.length, beforeUnknown);
    location.href = "https://hausofestate.com/blog?query=secret";

    saveAnalyticsConsent("denied");
    syncAnalytics(config);
    const revokedCount = events().length;
    const allRevokedCount = window.dataLayer.length;
    trackAnalytics("haus_contact_click", { contact_method: "phone" });
    trackAnalytics("lead_submit_success", { form_version: "2026-09-01.v4", surface: "newsletter", interest: "newsletter_only" });
    trackAnalytics("property_assistant_opened", { route_scope: "home" });
    assert.equal(events().length, revokedCount);
    assert.equal(window.dataLayer.length, allRevokedCount);
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
