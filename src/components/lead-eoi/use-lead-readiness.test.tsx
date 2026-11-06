// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let useLeadReadiness: typeof import("./use-lead-readiness").useLeadReadiness;
let root: Root | undefined;
let host: HTMLDivElement;
let now: number;
const fetcher = vi.fn<typeof fetch>();
const ready = { intakeReady: true, brochureEmailEnabled: true };
const unavailable = { intakeReady: false, brochureEmailEnabled: false };

function Consumer({ check = true }: { check?: boolean }) {
  const readiness = useLeadReadiness(check);
  return <output>{JSON.stringify(readiness)}</output>;
}

async function signal(event: "focus" | "online") {
  await act(async () => { window.dispatchEvent(new Event(event)); });
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((complete) => { resolve = complete; });
  return { promise, resolve };
}

beforeEach(async () => {
  vi.resetModules();
  ({ useLeadReadiness } = await import("./use-lead-readiness"));
  now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", fetcher);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  host.remove();
  vi.unstubAllGlobals();
  fetcher.mockReset();
});

describe("shared lead readiness", () => {
  it.each(["focus", "online"] as const)("recovers from a failed first check on %s after the cache expires", async (event) => {
    fetcher.mockRejectedValueOnce(new Error("temporarily offline"))
      .mockResolvedValueOnce(Response.json(ready));
    await act(async () => { root!.render(<Consumer />); });
    expect(host.textContent).toBe(JSON.stringify(unavailable));

    now += 9_999;
    await signal(event);
    expect(fetcher).toHaveBeenCalledTimes(1);
    now += 1;
    expect(fetcher).toHaveBeenCalledTimes(1);

    await signal(event);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(host.textContent).toBe(JSON.stringify(ready));
    expect(fetcher).toHaveBeenLastCalledWith("/api/leads", expect.objectContaining({ cache: "no-store" }));
  });

  it("shares in-flight requests and the settled cache across many consumers and repeated events", async () => {
    const request = deferredResponse();
    fetcher.mockReturnValueOnce(request.promise).mockResolvedValueOnce(Response.json(ready));
    await act(async () => {
      root!.render(<>{Array.from({ length: 20 }, (_, id) => <Consumer key={id} />)}</>);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect([...host.querySelectorAll("output")].every((output) => output.textContent === "null")).toBe(true);

    // Even a delayed request remains shared after the previous TTL would expire.
    now += 20_000;
    await signal("focus");
    await signal("online");
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => { request.resolve(Response.json(ready)); });
    expect([...host.querySelectorAll("output")].every((output) => output.textContent === JSON.stringify(ready))).toBe(true);
    await signal("focus");
    expect(fetcher).toHaveBeenCalledTimes(1);

    now += 10_000;
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("returns no stale availability or requests while disabled and removes its listeners on cleanup", async () => {
    fetcher.mockImplementation(async () => Response.json(ready));
    await act(async () => { root!.render(<Consumer check={false} />); });
    await signal("focus");
    await signal("online");
    expect(fetcher).not.toHaveBeenCalled();
    expect(host.textContent).toBe("null");

    await act(async () => { root!.render(<Consumer />); });
    expect(host.textContent).toBe(JSON.stringify(ready));
    await act(async () => { root!.render(<Consumer check={false} />); });
    expect(host.textContent).toBe("null");
    now += 10_000;
    await signal("focus");
    await signal("online");
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => { root!.render(<Consumer />); });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await act(async () => { root!.unmount(); });
    root = undefined;
    now += 10_000;
    await signal("focus");
    await signal("online");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("ignores an in-flight result after disabling or unmounting", async () => {
    const request = deferredResponse();
    fetcher.mockReturnValueOnce(request.promise);
    await act(async () => { root!.render(<><Consumer /><Consumer /></>); });
    await act(async () => { root!.render(<Consumer check={false} />); });
    await act(async () => { request.resolve(Response.json(ready)); });
    expect(host.textContent).toBe("null");
    expect(fetcher).toHaveBeenCalledTimes(1);
    now += 10_000;
    await signal("focus");
    await signal("online");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    { body: ready, status: 503 },
    { body: null, status: 200 },
    { body: { intakeReady: "true", brochureEmailEnabled: true }, status: 200 },
  ])("keeps invalid or unsuccessful readiness responses closed ($status, $body)", async ({ body, status }) => {
    fetcher.mockResolvedValueOnce(Response.json(body, { status }));
    await act(async () => { root!.render(<Consumer />); });
    expect(host.textContent).toBe(JSON.stringify(unavailable));
  });
});
