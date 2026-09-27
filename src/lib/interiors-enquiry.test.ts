import { describe, expect, it } from "vitest";
import {
  buildInteriorEnquiryHref,
  composeInteriorEnquiryMessage,
  INTERIOR_BUDGET_MAX_LENGTH,
  INTERIOR_MESSAGE_MAX_LENGTH,
  readInteriorEnquiryContext,
  type InteriorGoal,
  type InteriorRoom,
} from "./interiors-enquiry";
import { LEAD_FORM_VERSION, PRIVACY_NOTICE_VERSION, leadIntakeV2Schema } from "./lead-intake/contract";

describe("interiors enquiry context", () => {
  it("accepts only the named service and known single-value goal/room selections", () => {
    expect(readInteriorEnquiryContext({ service: "interiors", goal: "lighting", room: "living-room", budget: "private" }))
      .toEqual({ goal: "lighting", room: "living-room" });
    expect(readInteriorEnquiryContext({ service: "interiors", goal: ["refresh", "renovate"], room: "private-value" }))
      .toEqual({ goal: "not-sure", room: "not-sure" });
    expect(readInteriorEnquiryContext({ service: ["interiors"], goal: "refresh" })).toBeUndefined();
    expect(readInteriorEnquiryContext({ goal: "refresh" })).toBeUndefined();
  });

  it("does not put arbitrary input in an enquiry URL", () => {
    const href = buildInteriorEnquiryHref("private goal" as InteriorGoal, "private room" as InteriorRoom);
    expect(href).toBe("/enquire?service=interiors&goal=not-sure&room=not-sure");
    expect(buildInteriorEnquiryHref("refresh", "bedroom"))
      .toBe("/enquire?service=interiors&goal=refresh&room=bedroom");
  });

  it("keeps optional facts absent rather than inventing a property type or budget", () => {
    const message = composeInteriorEnquiryMessage({ goal: "refresh", room: "bedroom", propertyType: "", budget: "", message: "Please discuss my room." });
    expect(message).toContain("Goal: Refresh a room");
    expect(message).toContain("Room or space: Bedroom");
    expect(message).toContain("Please discuss my room.");
    expect(message).not.toContain("Property type:");
    expect(message).not.toContain("Approximate budget:");
  });

  it("carries the submitted brief inside the existing message without changing consent or backend schema", () => {
    const message = composeInteriorEnquiryMessage({
      goal: "lighting", room: "whole-property", propertyType: "house",
      budget: "  GBP 5,000\nfor the project  ", message: "Please advise on lighting.",
    });
    expect(message).toContain("Property type: House");
    expect(message).toContain("Approximate budget: GBP 5,000 for the project");
    const input = {
      submissionId: "29eaf127-8a76-4a3b-84cb-431c41b723f1",
      interest: "general_enquiry",
      contact: { firstName: "Test", email: "test@example.com", message },
      privacyAcknowledged: true, newsletterOptIn: false, propertyMatchOptIn: false,
      formVersion: LEAD_FORM_VERSION, privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      context: { surface: "query_page", pagePath: "/enquire" },
    };
    const saved = leadIntakeV2Schema.parse(input);
    expect(saved.contact.message).toBe(message);
    expect(saved.newsletterOptIn).toBe(false);
    expect(saved.propertyMatchOptIn).toBe(false);
    expect(leadIntakeV2Schema.safeParse({ ...input, privacyAcknowledged: false }).success).toBe(false);
  });

  it("reserves enough of the existing message limit for the longest allowed brief", () => {
    const message = composeInteriorEnquiryMessage({
      goal: "finish", room: "whole-property", propertyType: "commercial",
      budget: "1".repeat(INTERIOR_BUDGET_MAX_LENGTH),
      message: "A".repeat(INTERIOR_MESSAGE_MAX_LENGTH),
    });
    expect(message.length).toBeLessThanOrEqual(2000);
    expect(message).toContain("A".repeat(INTERIOR_MESSAGE_MAX_LENGTH));
  });
});
