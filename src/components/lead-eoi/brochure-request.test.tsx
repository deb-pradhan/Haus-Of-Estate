import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION } from "@/lib/lead-intake/contract";
import { normalizeLeadRequest } from "@/lib/lead-intake/normalize";
import {
  brochureMessageLimit,
  brochureReceiptCopy,
  brochureRequestNote,
  brochureRequestPayload,
  leadMessageWithBrochureRequest,
} from "./brochure-request";
import { LeadEoiForm } from "./lead-eoi-form";
import { PropertyBrochureRequestTrigger } from "./property-brochure-request-trigger";

const context = vi.hoisted(() => ({
  enabled: true,
  openLead: vi.fn(),
  readiness: { intakeReady: true, brochureEmailEnabled: true },
}));
vi.mock("./lead-eoi-controller", () => ({ useLeadEoi: () => context }));
vi.mock("./use-lead-readiness", () => ({ useLeadReadiness: () => context.readiness }));

const project = { slug: "azizi-florence-4-bedroom-villas", title: "Florence 4-bedroom villas" };
const design = { id: "type-a", label: "Type A" };

beforeEach(() => {
  context.enabled = true;
  context.readiness = { intakeReady: true, brochureEmailEnabled: true };
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
    expect(html).toContain("not required to receive it");
    expect(html).not.toContain("Brochure request saved");
    expect(html).not.toContain("brochure sent");
  });

  it("falls back to a property enquiry while brochure email is unavailable", () => {
    context.readiness = { intakeReady: true, brochureEmailEnabled: false };
    const trigger = PropertyBrochureRequestTrigger({ project, design });
    expect(trigger.props.children).toBe("Enquire about this property");
    trigger.props.onClick();
    expect(context.openLead).toHaveBeenCalledWith(expect.objectContaining({
      project,
      brochureRequest: { design },
    }));
    const html = renderToStaticMarkup(
      <LeadEoiForm surface="manual_cta" project={project} brochureRequest={{ design }} />,
    );
    expect(html).toContain("Brochure email is currently unavailable");
    expect(html).toContain("Design: Type A");
    expect(html).not.toContain("not required to receive it");
  });

  it("offers an enquiry instead of a brochure for a design without a collection mapping", () => {
    const trigger = PropertyBrochureRequestTrigger({ project, design, brochureMapped: false });
    expect(trigger.props.disabled).toBe(false);
    expect(trigger.props.children).toBe("Enquire about this property");
    expect(trigger.props.title).toContain("not yet available by email");
    trigger.props.onClick();
    expect(context.openLead).toHaveBeenCalledWith(expect.objectContaining({
      project,
      brochureRequest: { design, emailUnavailable: true },
    }));
    const html = renderToStaticMarkup(
      <LeadEoiForm surface="manual_cta" project={project} brochureRequest={{ design, emailUnavailable: true }} />,
    );
    expect(html).toContain("not yet available by email");
    expect(html).toContain("Design: Type A");
    expect(html).not.toContain("not required to receive it");
    // The enquiry still carries the selected design for staff follow-up.
    expect(brochureRequestNote(project, { design, emailUnavailable: true })).toContain("Requested design: Type A (type-a)");
    // A mapped design keeps the brochure request intact.
    const mapped = PropertyBrochureRequestTrigger({ project, design, brochureMapped: true });
    expect(mapped.props.children).toBe("Request full brochure");
    expect(mapped.props.title).toBeUndefined();
  });

  it("does not offer an unconfigured intake or treat a changed interest as a brochure request", () => {
    context.readiness = { intakeReady: false, brochureEmailEnabled: false };
    const trigger = PropertyBrochureRequestTrigger({ project, design });
    expect(trigger.props.disabled).toBe(true);
    trigger.props.onClick();
    expect(context.openLead).not.toHaveBeenCalled();
    for (const interest of ["general_enquiry", "newsletter_only", "sell_let"] as const) {
      expect(brochureRequestPayload(project, { design }, interest)).toBeUndefined();
      const html = renderToStaticMarkup(
        <LeadEoiForm surface="manual_cta" project={project} brochureRequest={{ design }} initialInterest={interest} />,
      );
      expect(html).not.toContain("Full brochure request");
      expect(html).not.toContain("Design: Type A");
    }
  });

  it("words saved and failed brochure receipts without claiming delivery or asking to resubmit", () => {
    const queued = brochureReceiptCopy("queued", project, { design });
    expect(queued?.heading).toBe("Brochure request saved");
    expect(queued?.body).toContain("Florence 4-bedroom villas — Type A");
    expect(queued?.body).toContain("Email delivery can take a little time");
    expect(queued?.body).not.toMatch(/delivered|has been sent/i);

    const failed = brochureReceiptCopy("failed", project, { design });
    expect(failed?.heading).toBe("Request saved, automatic email failed");
    expect(failed?.body).toContain("automatic brochure email failed");
    expect(failed?.body).toContain("no need to send this request again");
    expect(failed?.body).toContain("sales@hausofestate.com");
    expect(failed?.body).not.toMatch(/will follow up|will send|will email|try again|resubmit|delivered|take a little time/i);

    expect(brochureReceiptCopy("none", project, { design })).toBeUndefined();
    expect(brochureReceiptCopy("failed", undefined, undefined)?.body).toContain("the selected property has been saved");
  });

  it("passes only the selected design identifier, without a client-provided PDF path or revision", () => {
    expect(brochureRequestPayload(project, { design }, "buy")).toEqual({ designId: "type-a" });
    expect(brochureRequestPayload(project, {}, "invest")).toEqual({});
    expect(brochureRequestPayload(undefined, { design }, "buy")).toBeUndefined();
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
        brochure: brochureRequestPayload(project, { design }, "buy"),
        contact: { firstName: "Alex", email: "alex@example.test", message },
        privacyAcknowledged: true,
        propertyMatchOptIn,
        newsletterOptIn,
        formVersion: LEAD_FORM_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        context: { surface: "manual_cta", pagePath: `/properties/${project.slug}` },
      });
      expect(normalized.project).toEqual({ slug: project.slug });
      expect(normalized.brochure).toEqual({ designId: "type-a" });
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
