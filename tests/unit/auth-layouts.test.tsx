import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
  sessionProvider: vi.fn(({ children }: { children: ReactNode }) => children),
  savedProvider: vi.fn(({ children }: { children: ReactNode }) => children),
}));
vi.mock("next/server", () => ({ connection: mocks.connection }));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
  Cormorant_Garamond: () => ({ variable: "font-serif" }),
}));
vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: false }),
}));
vi.mock("@/components/analytics/consent-manager", () => ({ ConsentManager: () => null }));
vi.mock("@/lib/auth/client", () => ({ SessionProvider: mocks.sessionProvider }));
vi.mock("@/components/saved-content", () => ({ SavedContentProvider: mocks.savedProvider }));
vi.mock("@/components/currency/currency-provider", () => ({
  CurrencyProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => children,
}));

import RootLayout from "@/app/layout";
import AuthLayout from "@/app/(auth)/layout";

beforeEach(() => {
  mocks.connection.mockReset().mockResolvedValue(undefined);
  vi.stubEnv("AUTH_ENABLED", "false");
  vi.stubEnv("SAVED_CONTENT_ENABLED", "true");
});
afterEach(() => vi.unstubAllEnvs());

describe("authentication layout boundaries", () => {
  it("waits for a request before reading runtime feature flags", async () => {
    let requestArrived!: () => void;
    mocks.connection.mockReturnValue(new Promise<void>((resolve) => { requestArrived = resolve; }));
    let rendered = false;
    const pending = RootLayout({ children: "Request-time content" }).then((layout) => { rendered = true; return layout; });
    await Promise.resolve();
    expect(rendered).toBe(false);
    vi.stubEnv("AUTH_ENABLED", "true");
    requestArrived();
    renderToStaticMarkup(await pending);
    expect(mocks.sessionProvider).toHaveBeenCalledOnce();
  });
  it("renders public content without session or saved providers while auth is deferred", async () => {
    const layout = await RootLayout({ children: createElement("main", null, "Public enquiry") });
    expect(renderToStaticMarkup(layout)).toContain("Public enquiry");
    expect(mocks.sessionProvider).not.toHaveBeenCalled();
    expect(mocks.savedProvider).not.toHaveBeenCalled();
  });

  it("restores both providers when auth is explicitly enabled", async () => {
    vi.stubEnv("AUTH_ENABLED", "true");
    const layout = await RootLayout({ children: createElement("main", null, "Public enquiry") });
    renderToStaticMarkup(layout);
    expect(mocks.sessionProvider).toHaveBeenCalledOnce();
    expect(mocks.savedProvider).toHaveBeenCalledOnce();
  });

  it("returns not found before rendering an auth page", () => {
    expect(() => AuthLayout({ children: "Sign in" })).toThrow(/404/);
  });
});
