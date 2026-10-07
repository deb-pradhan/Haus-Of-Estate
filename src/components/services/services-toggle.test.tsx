import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadEoiTrigger } from "@/components/lead-eoi/lead-eoi-trigger";
import { ServicesToggle } from "./services-toggle";

const context = vi.hoisted(() => ({ enabled: false, openLead: vi.fn() }));
vi.mock("@/components/lead-eoi/lead-eoi-controller", () => ({
  useLeadEoi: () => context,
}));

const options = vi.hoisted(() => ({ current: [] as unknown[] }));
vi.mock("@/components/lead-eoi/lead-eoi-trigger", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/components/lead-eoi/lead-eoi-trigger")>();
  return {
    LeadEoiTrigger: (props: Parameters<typeof LeadEoiTrigger>[0]) => {
      const entry = original.LeadEoiTrigger(props);
      options.current.push(entry.props);
      return entry;
    },
  };
});

beforeEach(() => {
  context.enabled = false;
  context.openLead.mockClear();
  options.current = [];
});

describe("homepage service enquiry entry points", () => {
  it("offers only the gated fallback when intake is unavailable", () => {
    const html = renderToStaticMarkup(<ServicesToggle />);

    expect(html.match(/href="\/enquire"/g)).toHaveLength(4);
    expect(html).not.toMatch(/<(?:form|input|textarea|select|button)\b/);
    for (const goal of ["Buy", "Rent", "Sell", "Let"]) {
      expect(html).toContain(`Looking to ${goal}`);
    }
    expect(context.openLead).not.toHaveBeenCalled();
  });

  it("opens the canonical enquiry flow for every goal instead of a local success form", () => {
    context.enabled = true;
    const html = renderToStaticMarkup(<ServicesToggle />);

    expect(html.match(/<button\b/g)).toHaveLength(4);
    expect(html).not.toMatch(/<(?:form|input|textarea|select)\b/);
    expect(options.current).toHaveLength(4);
    for (const button of options.current as Array<{ onClick: () => void }>) {
      button.onClick();
    }
    expect(context.openLead.mock.calls).toEqual([
      [{ interest: "buy", surface: "manual_cta" }],
      [{ interest: "rent", surface: "manual_cta" }],
      [{ interest: "sell_let", surface: "manual_cta" }],
      [{ interest: "sell_let", surface: "manual_cta" }],
    ]);
  });
});
