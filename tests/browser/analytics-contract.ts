import { test, expect, type BrowserContext } from "@playwright/test";
import { buildSync } from "esbuild";

// Intercept Google analytics/ad endpoints and forbid application writes.
export async function interceptGoogle(context: BrowserContext, mode: "gtm" | "ga4") {
  const requests: string[] = [];
  await context.route(/https?:\/\/([^/]*\.)?(googletagmanager\.com|google-analytics\.com|google\.[a-z.]+|googleapis\.com|gstatic\.com|googleadservices\.com|doubleclick\.net|googlesyndication\.com)\//, async (route) => {
    const url = route.request().url();
    requests.push(url);
    const selected = mode === "gtm" ? "/gtm.js?id=GTM-TEST123" : "/gtag/js?id=G-TEST123456";
    if (url === `https://www.googletagmanager.com${selected}`) {
      await route.fulfill({ contentType: "application/javascript", body: mode === "gtm"
        ? 'window.google_tag_manager = {"G-TEST": {}}; document.cookie = "_ga=browser-test; Path=/; SameSite=Lax";'
        : 'window.__gtagStubLoads = (window.__gtagStubLoads || 0) + 1; document.cookie = "_ga=browser-test; Path=/; SameSite=Lax";' });
    } else await route.abort();
  });
  await context.route("**/api/**", async (route) => {
    if (["GET", "HEAD"].includes(route.request().method())) await route.fallback();
    else await route.abort();
  });
  return requests;
}

// Exercise the actual runtime in a test-only document. This does not enable
// operational forms or claim that a synthetic event is an accepted enquiry.
// Receipt gating remains covered by the existing form/API regression tests.
export function release2EventContract(mode: "gtm" | "ga4") {
  test(`${mode}: Release 2 event mapping preserves validation and consent`, async ({ context, page }) => {
    const requests = await interceptGoogle(context, mode);
    const source = buildSync({ entryPoints: ["src/lib/analytics.ts"], bundle: true, write: false, format: "iife", globalName: "analyticsTestRuntime", platform: "browser" }).outputFiles[0].text;
    await page.route("**/properties/analytics-harness*", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Analytics test harness</title>" }));
    await page.goto("/properties/analytics-harness?email=private@example.com#secret");
    await page.addScriptTag({ content: source });
    const result = await page.evaluate((selectedMode) => {
      const runtime = (window as unknown as { analyticsTestRuntime: typeof import("../../src/lib/analytics") }).analyticsTestRuntime;
      const options = { gtmId: selectedMode === "gtm" ? "GTM-TEST123" : "", ga4Id: "G-TEST123456", draft: false, production: true, allowedHosts: "localhost" };
      const lead = { form_version: "2026-09-28.v1", surface: "modal", interest: "buy", step: 2, has_project: true, email: "private@example.com", project_slug: "secret", message: "private free text" };
      const names = ["form_view", "form_start", "lead_submit_success", "newsletter_opt_in", "property_assistant_opened", "property_assistant_results_shown", "property_assistant_adviser_handoff"] as const;
      const emit = () => names.forEach((name) => runtime.trackAnalytics(name, name.startsWith("property_assistant") ? { route_scope: "property_detail", result_count: 99, prompt: "private free text", email: "private@example.com" } : lead));
      const events = () => (window.dataLayer || []).flatMap((entry) => {
        if (Object.prototype.toString.call(entry) === "[object Arguments]") {
          const command = Array.from(entry as IArguments);
          return command[0] === "event" ? [{ event: command[1], ...(command[2] as object) }] : [];
        }
        return "event" in entry ? [entry] : [];
      });
      runtime.syncAnalytics(options);
      emit();
      const before = events();
      runtime.saveAnalyticsConsent("granted");
      runtime.syncAnalytics(options);
      emit();
      const emitted = events().filter((event) => names.includes(event.event as typeof names[number]));
      const representations = (window.dataLayer || []).flatMap((entry) => {
        const command = Object.prototype.toString.call(entry) === "[object Arguments]";
        const name = command ? Array.from(entry as IArguments)[1] : (entry as Record<string, unknown>).event;
        return names.includes(name as typeof names[number]) ? [command ? "command" : "object"] : [];
      });
      const priorInvalid = events().length;
      runtime.trackAnalytics("form_view", { ...lead, form_version: "private@example.com" });
      runtime.trackAnalytics("form_start", { ...lead, surface: "private free text" });
      runtime.trackAnalytics("property_assistant_opened", { route_scope: "home" });
      const afterInvalid = events().length;
      runtime.saveAnalyticsConsent("denied");
      runtime.stopAnalytics(false);
      const priorWithdrawal = events().length;
      emit();
      return { before, emitted, representations, priorInvalid, afterInvalid, priorWithdrawal, afterWithdrawal: events().length, scripts: document.querySelectorAll("#haus-gtag, #haus-gtm").length };
    }, mode);
    expect(result.before).toEqual([]);
    expect(result.emitted.map((event) => event.event)).toEqual(["form_view", "form_start", "lead_submit_success", "newsletter_opt_in", "property_assistant_opened", "property_assistant_results_shown", "property_assistant_adviser_handoff"]);
    expect(result.representations).toEqual(Array(7).fill(mode === "ga4" ? "command" : "object"));
    expect(result.emitted[0]).toMatchObject({ form_name: "lead_eoi", form_version: "2026-09-28.v1", surface: "modal", interest: "buy", step: 2, has_project: true });
    expect(result.emitted[5]).toMatchObject({ route_scope: "property_detail", result_count: 3 });
    expect(JSON.stringify(result.emitted)).not.toMatch(/private@example|secret|private free text|prompt|email|project_slug|localhost/);
    expect(result.afterInvalid).toBe(result.priorInvalid);
    expect(result.afterWithdrawal).toBe(result.priorWithdrawal);
    expect(result.scripts).toBe(0);
    // A selected script can be removed before its request is dispatched.
    expect(requests.every((url) => url === (mode === "gtm" ? "https://www.googletagmanager.com/gtm.js?id=GTM-TEST123" : "https://www.googletagmanager.com/gtag/js?id=G-TEST123456"))).toBe(true);
  });
}
