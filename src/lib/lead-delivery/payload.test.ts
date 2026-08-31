import { describe, expect, it } from "vitest";

import {
  EXCEL_LEAD_TABLE_HEADINGS,
  buildLeadDeliveryPayload,
  isLeadDeliveryPayload,
  normalizeLeadDeliveryPayload,
} from "./payload";

describe("buildLeadDeliveryPayload", () => {
  it("builds the exact versioned Excel delivery contract", () => {
    const payload = buildLeadDeliveryPayload({
      eventId: "event-1",
      leadId: "lead-1",
      submittedAt: new Date("2026-08-29T12:00:00.000Z"),
      firstName: " Surya ",
      surname: " Kommuri ",
      email: " PERSON@EXAMPLE.COM ",
      phone: null,
      interest: " invest ",
      market: "Dubai",
      propertyType: "apartment",
      bedrooms: 2,
      bathrooms: "2",
      timeframe: "3-6 months",
      propertyMatchOptIn: true,
      newsletterOptIn: true,
      source: "instagram",
      campaign: "bio",
      landingPage: "/register-interest",
    });

    expect(payload).toEqual({
      schemaVersion: "2.0",
      eventId: "event-1",
      eventType: "lead.created",
      leadId: "lead-1",
      row: {
        submissionTime: "2026-08-29T12:00:00.000Z",
        leadId: "lead-1",
        name: "Surya Kommuri",
        email: "person@example.com",
        phone: "",
        interest: "invest",
        market: "Dubai",
        location: "",
        propertyType: "apartment",
        bedrooms: "2",
        bathrooms: "2",
        timeframe: "3-6 months",
        project: "",
        propertyMatchOptIn: true,
        newsletterOptIn: true,
        source: "instagram",
        campaign: "bio",
        landingPage: "/register-interest",
        status: "New",
        owner: "",
        notes: "",
      },
    });
    expect(isLeadDeliveryPayload(payload)).toBe(true);
  });

  it("publishes the approved Excel headings in order", () => {
    expect(EXCEL_LEAD_TABLE_HEADINGS).toEqual([
      "submission time",
      "lead ID",
      "name",
      "email",
      "phone",
      "interest",
      "market",
      "location",
      "property type",
      "bedrooms",
      "bathrooms",
      "timeframe",
      "project",
      "property match opt-in",
      "newsletter opt-in",
      "source",
      "campaign",
      "landing page",
      "status",
      "owner",
      "notes",
    ]);
  });

  it("rejects missing required cells and invalid dates", () => {
    const base = {
      eventId: "event-1",
      leadId: "lead-1",
      submittedAt: "2026-08-29T12:00:00.000Z",
      firstName: "Surya",
      email: "person@example.com",
      interest: "buy",
      propertyMatchOptIn: false,
      newsletterOptIn: false,
    };

    expect(() => buildLeadDeliveryPayload({ ...base, email: " " })).toThrow(
      "email",
    );
    expect(() =>
      buildLeadDeliveryPayload({ ...base, submittedAt: "not-a-date" }),
    ).toThrow("valid submission time");
    expect(isLeadDeliveryPayload({ ...base })).toBe(false);
  });

  it("strips landing-page queries and neutralizes Excel formulas", () => {
    const payload = buildLeadDeliveryPayload({
      eventId: "event-1",
      leadId: "lead-1",
      submittedAt: "2026-08-29T12:00:00.000Z",
      firstName: "=HYPERLINK(\"https://example.test\")",
      email: "person@example.com",
      phone: "+44 7000 000000",
      interest: "buy",
      propertyMatchOptIn: false,
      newsletterOptIn: false,
      landingPage:
        "https://hausofestate.com/register-interest?email=private@example.com",
    });

    expect(payload.row.name).toBe("'=HYPERLINK(\"https://example.test\")");
    expect(payload.row.phone).toBe("'+44 7000 000000");
    expect(payload.row.landingPage).toBe("/register-interest");
  });

  it("upgrades immutable version 1 outbox payloads without inventing consent", () => {
    const current = buildLeadDeliveryPayload({
      eventId: "event-1",
      leadId: "lead-1",
      submittedAt: "2026-08-29T12:00:00.000Z",
      firstName: "Surya",
      email: "person@example.com",
      interest: "buy",
      propertyMatchOptIn: false,
      newsletterOptIn: true,
    });
    const legacyRow: Record<string, unknown> = { ...current.row };
    delete legacyRow.propertyMatchOptIn;
    const legacy = { ...current, schemaVersion: "1.0", row: legacyRow };

    expect(normalizeLeadDeliveryPayload(legacy)).toEqual(current);
    expect(normalizeLeadDeliveryPayload({ ...legacy, row: {} })).toBeNull();
  });
});
