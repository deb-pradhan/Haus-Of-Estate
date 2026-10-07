import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION } from "@/lib/lead-intake/contract";
import { normalizeLeadRequest } from "@/lib/lead-intake/normalize";
import {
  brochureMessageLimit,
  brochureRequestNote,
  leadMessageWithBrochureRequest,
} from "./brochure-request";
import { LeadEoiForm } from "./lead-eoi-form";
import { PropertyBrochureRequestTrigger } from "./property-brochure-request-trigger";

const context = vi.hoisted(() => ({ enabled: true, openLead: vi.fn() }));
vi.mock("./lead-eoi-controller", () => ({ useLeadEoi: () => context }));

const project = { slug: "azizi-florence-4-bedroom-villas", title: "Florence 4-bedroom villas" };
const design = { id: "type-a", label: "Type A" };

beforeEach(() => {
  context.enabled = true;
  context.openLead.mockClear();
});

describe("property brochure requests", () => {
  it("uses the canonical lead flow with the exact selected property and design", () => {
    const trigger = PropertyBrochureRequestTrigger({ project, design });
    trigger.props.onClick();
    expect(context.openLead).toHaveBeenCalledWith({
      project,
      interest: "buy",
      brochureRequest: { design },
      surface: "manual_cta",
    });
    expect(trigger.props).not.toHaveProperty("href");
  });

  it("cannot open intake from a held preview or without the intake provider", () => {
    for (const disabled of [true, false]) {
      context.enabled = disabled;
      const trigger = PropertyBrochureRequestTrigger({ project, design, disabled });
      expect(trigger.props.disabled).toBe(true);
      trigger.props.onClick();
    }
    expect(context.openLead).not.toHaveBeenCalled();
  });

  it("shows the request and selected design without promising brochure delivery", () => {
    const html = renderToStaticMarkup(
      <LeadEoiForm surface="manual_cta" project={project} brochureRequest={{ design }} />,
    );
    expect(html).toContain("Full brochure request");
    expect(html).toContain("Design: Type A");
    expect(html).toContain("Brochure email delivery is not yet available");
    expect(html).not.toContain("Brochure request saved");
    expect(html).not.toContain("brochure sent");
  });

  it.each([[false, false], [true, false], [false, true], [true, true]])(
    "retains the request through intake with property match=%s and newsletter=%s",
    (propertyMatchOptIn, newsletterOptIn) => {
      const note = brochureRequestNote(project, { design });
      const message = leadMessageWithBrochureRequest(note, "Please include the floor plan.");
      const normalized = normalizeLeadRequest({
        submissionId: "6bd94ff9-6dc6-4eff-8cb0-1bda245e595a",
        interest: "buy",
        project: { slug: project.slug },
        contact: { firstName: "Alex", email: "alex@example.test", message },
        privacyAcknowledged: true,
        propertyMatchOptIn,
        newsletterOptIn,
        formVersion: LEAD_FORM_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        context: { surface: "manual_cta", pagePath: `/properties/${project.slug}` },
      });
      expect(normalized.project).toEqual({ slug: project.slug });
      expect(normalized.contact.message).toContain(`Full brochure request: ${project.title} (${project.slug})`);
      expect(normalized.contact.message).toContain("Requested design: Type A (type-a)");
      expect(normalized.contact.message).toContain("Please include the floor plan.");
      expect(normalized.propertyMatchOptIn).toBe(propertyMatchOptIn);
      expect(normalized.newsletterOptIn).toBe(newsletterOptIn);
    },
  );

  it("reserves room for request context within the existing message contract", () => {
    const note = brochureRequestNote(project, { design });
    const limit = brochureMessageLimit(note);
    expect(leadMessageWithBrochureRequest(note, "a".repeat(limit))).toHaveLength(2_000);
    expect(leadMessageWithBrochureRequest(note, "")).toBe(note);
    expect(leadMessageWithBrochureRequest("", " ordinary enquiry ")).toBe("ordinary enquiry");
    expect(brochureMessageLimit("")).toBe(2_000);
    expect(leadMessageWithBrochureRequest("", " ")).toBeUndefined();
  });
});
