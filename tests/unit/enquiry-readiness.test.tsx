import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/lead-eoi/enquiry-form", () => ({
  EnquiryForm: () => <form data-intake />,
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
        EnquirePage(),
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
  it("keeps the feature closed when explicitly disabled despite configured storage", () => {
    vi.stubEnv("LEAD_INTAKE_ENABLED", "false");
    vi.stubEnv("DATABASE_URL", "postgresql://test:unused@localhost/test");
    expect(renderToStaticMarkup(EnquirePage())).not.toContain("<form");
  });
  it("renders the enquiry form only when both flag and storage configuration exist", () => {
    vi.stubEnv("LEAD_INTAKE_ENABLED", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://test:unused@localhost/test");
    expect(renderToStaticMarkup(EnquirePage())).toContain("<form");
    expect(renderToStaticMarkup(ListPropertyPage())).toContain("<form");
  });
});
