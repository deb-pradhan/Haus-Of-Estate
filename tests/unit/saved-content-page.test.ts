import { afterEach, describe, expect, it } from "vitest";
import SavedPage from "@/app/(main)/saved/page";

const previousFeatureFlag = process.env.SAVED_CONTENT_ENABLED;

afterEach(() => {
  if (previousFeatureFlag === undefined) {
    delete process.env.SAVED_CONTENT_ENABLED;
  } else {
    process.env.SAVED_CONTENT_ENABLED = previousFeatureFlag;
  }
});

describe("saved page feature gate", () => {
  it("returns the framework not-found response while disabled", () => {
    process.env.SAVED_CONTENT_ENABLED = "false";
    expect(() => SavedPage()).toThrow(/404/);
  });
});
