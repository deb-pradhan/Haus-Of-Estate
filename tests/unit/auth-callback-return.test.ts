import { describe, expect, it } from "vitest";
import { callbackCookieReturnTo } from "../../src/lib/auth/callback-return-to";

describe("OAuth callback return destinations", () => {
  it("recovers a same-origin callback path", () => {
    expect(
      callbackCookieReturnTo(
        "https://hausofestate.com/properties?market=dubai",
        "https://hausofestate.com",
      ),
    ).toBe("/properties?market=dubai");
  });

  it("rejects a cross-origin callback cookie", () => {
    expect(
      callbackCookieReturnTo(
        "https://attacker.example/collect",
        "https://hausofestate.com",
      ),
    ).toBe("/");
  });
});
