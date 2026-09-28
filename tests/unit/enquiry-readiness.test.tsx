import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/lead-eoi/enquiry-form", () => ({
  EnquiryForm: ({ interiors }: { interiors?: { goal: string; room: string } }) => (
    <form data-intake data-goal={interiors?.goal} data-room={interiors?.room} />
  ),
}));
vi.mock("@/components/lead-eoi/lead-eoi-form", () => ({
  LeadEoiForm: () => <form data-intake />,
}));
vi.mock("@/sanity/live", () => ({ sanityFetch: vi.fn() }));

import EnquirePage from "@/app/(main)/enquire/page";
import RegisterInterestPage from "@/app/(main)/register-interest/page";
import ListPropertyPage from "@/app/(main)/list-property/page";
import MatchLayout from "@/app/(funnel)/match/layout";

afterEach(() => vi.unstubAllEnvs());

describe("public enquiry readiness", () => {
  it.each(["", undefined])(
    "does not collect details when storage is unconfigured (%s)",
    async (database) => {
      vi.stubEnv("LEAD_INTAKE_ENABLED", "true");
      vi.stubEnv("DATABASE_URL", database);
      const pages = [
        await EnquirePage({ searchParams: Promise.resolve({}) }),
        ListPropertyPage(),
        MatchLayout({ children: <form data-intake /> }),
        await RegisterInterestPage({ searchParams: Promise.resolve({}) }),
      ];
      for (const page of pages) {
        const html = renderToStaticMarkup(page);
        expect(html).toContain("Online enquiries are temporarily unavailable");
        expect(html).toContain("mailto:info@hausofestate.com");
        expect(html).not.toContain("<form");
      }
    },
  );
  it("keeps the feature closed when explicitly disabled despite configured storage", async () => {
    vi.stubEnv("LEAD_INTAKE_ENABLED", "false");
    vi.stubEnv("DATABASE_URL", "postgresql://test:unused@localhost/test");
    expect(renderToStaticMarkup(await EnquirePage({ searchParams: Promise.resolve({ service: "interiors", goal: "refresh", room: "bedroom" }) }))).not.toContain("<form");
  });
  it("renders the enquiry form only when both flag and storage configuration exist", async () => {
    vi.stubEnv("LEAD_INTAKE_ENABLED", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://test:unused@localhost/test");
    expect(renderToStaticMarkup(await EnquirePage({ searchParams: Promise.resolve({}) }))).toContain("<form");
    expect(renderToStaticMarkup(ListPropertyPage())).toContain("<form");
  });
  it("passes only allowlisted project context to the enabled form", async () => {
    vi.stubEnv("LEAD_INTAKE_ENABLED", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://test:unused@localhost/test");
    const page = await EnquirePage({ searchParams: Promise.resolve({
      service: "interiors", goal: "refresh", room: "bedroom",
      budget: "PRIVATE_BUDGET", email: "PRIVATE_EMAIL", message: "PRIVATE_MESSAGE",
    }) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain('data-goal="refresh"');
    expect(html).toContain('data-room="bedroom"');
    expect(html).not.toContain("PRIVATE_");
  });
});
