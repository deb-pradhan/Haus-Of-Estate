import { describe, expect, it, vi } from "vitest";
import { LeadInfrastructureError, LeadValidationError } from "./errors";

const cms = vi.hoisted(() => ({ fetch: vi.fn(), withConfig: vi.fn() }));
vi.mock("@/sanity", () => ({
  client: {
    withConfig: cms.withConfig.mockImplementation(() => ({ fetch: cms.fetch })),
  },
}));

import { PUBLISHED_PROPERTY_QUERY, resolvePublishedProject } from "./project";

describe("published brochure project resolution", () => {
  it("excludes drafts and release versions with a fresh published perspective", async () => {
    const project = {
      slug: "florence-villas",
      title: "Florence Villas",
      designVariants: [{ _key: "villa-a", label: "Type A", brochureKey: "florence-4br", brochureRevision: "2026-10" }],
    };
    cms.fetch.mockResolvedValueOnce(project);
    await expect(resolvePublishedProject("florence-villas")).resolves.toEqual(project);
    expect(PUBLISHED_PROPERTY_QUERY).toContain('!(_id in path("drafts.**"))');
    expect(PUBLISHED_PROPERTY_QUERY).toContain('!(_id in path("versions.**"))');
    expect(PUBLISHED_PROPERTY_QUERY).toContain('status == "published"');
    expect(cms.withConfig).toHaveBeenCalledWith({ useCdn: false, perspective: "published" });
    expect(cms.fetch).toHaveBeenCalledWith(
      PUBLISHED_PROPERTY_QUERY,
      { slug: "florence-villas" },
      { cache: "no-store" },
    );
  });

  it("rejects a missing published record and does not mask CMS failures", async () => {
    cms.fetch.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("CMS unavailable"));
    await expect(resolvePublishedProject("draft-property")).rejects.toBeInstanceOf(LeadValidationError);
    await expect(resolvePublishedProject("florence-villas")).rejects.toBeInstanceOf(LeadInfrastructureError);
  });
});
