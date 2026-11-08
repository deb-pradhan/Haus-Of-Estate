import { findLaunchInterest, launchProjectTitle } from "@/lib/launches/registry";
import { LeadValidationError } from "./errors";
import type { PublishedProjectContext } from "./project";

/**
 * Resolves a launch-interest key from the code allowlist into the same shape
 * the published-property resolver returns, so persistence and the sales
 * notification carry the launch as the lead's project. Unknown keys are a
 * validation error, never a silent general enquiry: the buyer asked about a
 * specific launch and the team must see that.
 */
export function resolveLaunchInterestProject(
  key: string,
): PublishedProjectContext {
  const launch = findLaunchInterest(key);
  if (!launch) {
    throw new LeadValidationError("Invalid launch", {
      launchInterest: ["Select a current launch"],
    });
  }
  return {
    slug: launch.key,
    title: launchProjectTitle(launch),
    community: `${launch.community}, ${launch.city}`,
  };
}
