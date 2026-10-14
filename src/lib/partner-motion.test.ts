import { describe, expect, it } from "vitest";
import { advancePartnerMotion, clampPartnerVelocity, MAX_PARTNER_RELEASE_SPEED, PARTNER_DRIFT_SPEED, wrapPartnerOffset } from "./partner-motion";

describe("partner carousel motion", () => {
  it("wraps drag offsets in either direction and across multiple copies", () => {
    expect(wrapPartnerOffset(-2100, 2000)).toBe(-100);
    expect(wrapPartnerOffset(100, 2000)).toBe(-1900);
    expect(wrapPartnerOffset(6100, 2000)).toBe(-1900);
    expect(wrapPartnerOffset(100, 0)).toBe(0);
  });

  it("caps release speed in both directions", () => {
    expect(clampPartnerVelocity(100000)).toBe(MAX_PARTNER_RELEASE_SPEED);
    expect(clampPartnerVelocity(-100000)).toBe(-MAX_PARTNER_RELEASE_SPEED);
  });

  it("glides in the release direction before returning to the default direction", () => {
    const early = advancePartnerMotion(-500, 600, PARTNER_DRIFT_SPEED, 0.1, 2000);
    expect(early.offset).toBeGreaterThan(-500);
    expect(early.velocity).toBeGreaterThan(0);
    const settled = advancePartnerMotion(-500, 600, PARTNER_DRIFT_SPEED, 5, 2000);
    expect(settled.velocity).toBeCloseTo(PARTNER_DRIFT_SPEED, 2);
  });

  it("settles a flick to rest while hovering", () => {
    const result = advancePartnerMotion(-500, -600, 0, 5, 2000);
    expect(result.velocity).toBeCloseTo(0, 2);
    expect(result.offset).toBeLessThan(-500);
  });

  it("keeps flick distance and damping consistent at 60Hz and 144Hz", () => {
    const simulate = (rate: number) => {
      let state = { offset: -500, velocity: 800 };
      for (let step = 0; step < rate * 3; step++) {
        state = advancePartnerMotion(state.offset, state.velocity, PARTNER_DRIFT_SPEED, 1 / rate, 2000);
      }
      return state;
    };
    const slow = simulate(60);
    const fast = simulate(144);
    expect(fast.offset).toBeCloseTo(slow.offset, 6);
    expect(fast.velocity).toBeCloseTo(slow.velocity, 6);
  });
});
