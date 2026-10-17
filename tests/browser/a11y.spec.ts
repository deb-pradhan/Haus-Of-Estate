import { test, expect } from "@playwright/test";

// Automated WCAG 2.2 AA scan with axe. `@axe-core/playwright` is NOT yet a
// dependency, so this spec skips itself until it is installed:
//   npm i -D @axe-core/playwright
// Fails on serious/critical violations (override: A11Y_IMPACTS="minor,moderate,serious,critical").

const PAGES = ["/", "/properties", "/blog", "/contact", "/faq", "/about"];
const IMPACTS = (process.env.A11Y_IMPACTS ?? "serious,critical").split(",");
const AXE_MODULE = "@axe-core/playwright"; // variable specifier: no compile-time dependency

interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  nodes: unknown[];
}
interface AxeRun {
  withTags(tags: string[]): AxeRun;
  analyze(): Promise<{ violations: AxeViolation[] }>;
}
type AxeBuilderCtor = new (opts: { page: unknown }) => AxeRun;

async function loadAxe(): Promise<AxeBuilderCtor | null> {
  try {
    const mod = await import(/* webpackIgnore: true */ AXE_MODULE);
    return (mod.default ?? mod.AxeBuilder) as AxeBuilderCtor;
  } catch {
    return null;
  }
}

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }, testInfo) => {
    const AxeBuilder = await loadAxe();
    test.skip(!AxeBuilder, "install @axe-core/playwright to enable accessibility scans");

    await page.goto(path, { waitUntil: "networkidle" });
    // Let reveal animations finish so contrast is measured on settled colours.
    await page.emulateMedia({ reducedMotion: "reduce" });

    const results = await new AxeBuilder!({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter((v) => IMPACTS.includes(v.impact ?? ""));
    await testInfo.attach("axe-violations.json", {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });
    expect(
      blocking.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) ${v.help}`),
      `Accessibility violations on ${path}`,
    ).toEqual([]);
  });
}
