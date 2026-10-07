import { afterEach, describe, expect, it, vi } from "vitest";
import { settlePublicAuthResponse } from "../../src/lib/auth/public-response-timing";

describe("public auth response timing", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("adds a production response floor", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");
    const settled = vi.fn();
    void settlePublicAuthResponse(Date.now()).then(settled);

    await vi.advanceTimersByTimeAsync(899);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(201);
    expect(settled).toHaveBeenCalledOnce();
  });
});
