import { describe, expect, it } from "vitest";
import { LeadValidationError } from "./errors";
import { resolveLaunchInterestProject } from "./launch";

describe("resolveLaunchInterestProject", () => {
  it("returns the launch as the lead's project with a pre-launch title", () => {
    expect(resolveLaunchInterestProject("palm-springs-by-nakheel")).toEqual({
      slug: "palm-springs-by-nakheel",
      title: "Palm Springs by Nakheel (pre-launch interest)",
      community: "Jebel Ali, Dubai",
    });
  });

  it("rejects unknown keys as a field validation error rather than a silent general enquiry", () => {
    expect(() => resolveLaunchInterestProject("palm-jebel-ali")).toThrow(LeadValidationError);
    try {
      resolveLaunchInterestProject("palm-jebel-ali");
    } catch (error) {
      expect((error as LeadValidationError).fieldErrors).toEqual({
        launchInterest: ["Select a current launch"],
      });
    }
  });
});
